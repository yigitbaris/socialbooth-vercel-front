//photo page segment worker
import {
  FilesetResolver,
  ImageSegmenter,
  ImageSegmenterResult,
} from "@mediapipe/tasks-vision"

let canvas: OffscreenCanvas
let ctx: OffscreenCanvasRenderingContext2D

let segmenter: ImageSegmenter | null = null
let labels: string[] = []
let personIdx = 1

let fgCanvas: OffscreenCanvas | null = null
let fgCtx: OffscreenCanvasRenderingContext2D | null = null

// ---- BG yön@etimi (detached hatasına karşı sağlam) ----
let bgUrl: string | null = null
let bgBitmap: ImageBitmap | null = null
const bgCache = new Map<string, ImageBitmap>() // LRU için ekleme sırası
const MAX_BG_CACHE = 4
let bgAbort: AbortController | null = null
let bgReqToken = 0 // yarış önleyici token

const MASK_SHORT_SIDE = 192 // Düşürüldü: 256 -> 192 (daha düşük performans için)
const DEBUG_INVERT = false

// Segmentasyon için işleme çözünürlüğü (3:2 oranında)
const PROCESS_WIDTH = 640
const PROCESS_HEIGHT = 426 // 3:2 = 4x6 oranı (640/426 ≈ 1.502)

// Mask kenarı yumuşatma (feather/blur radius)
const FEATHER_RADIUS = 12 // 8-16px aralığında

// Frame skip için busy flag
let isProcessingFrame = false

function pickPersonIndex(ls: string[]) {
  const i = ls.findIndex((l) => /person|selfie|human/i.test(l))
  return i >= 0 ? i : 1
}

function ensureFgCanvasSize(w: number, h: number) {
  if (!fgCanvas || !fgCtx || fgCanvas.width !== w || fgCanvas.height !== h) {
    fgCanvas = new OffscreenCanvas(w, h)
    fgCtx = fgCanvas.getContext("2d") as OffscreenCanvasRenderingContext2D
  }
}

// Mask kenarına feather/blur uygula
async function applyFeatherToMask(
  maskBitmap: ImageBitmap,
  radius: number
): Promise<ImageBitmap | null> {
  try {
    const tmp = new OffscreenCanvas(maskBitmap.width, maskBitmap.height)
    const tctx = tmp.getContext("2d")!
    tctx.drawImage(maskBitmap, 0, 0)

    // Gaussian blur için canvas filter kullan (eğer destekleniyorsa)
    // Fallback: basit alpha kanalı manipülasyonu
    const imageData = tctx.getImageData(
      0,
      0,
      maskBitmap.width,
      maskBitmap.height
    )
    const data = imageData.data

    // Basit blur: alpha kanalını yumuşat
    // Her piksel için çevresindeki piksellerin ortalamasını al
    const blurred = new Uint8ClampedArray(data.length)
    const r = Math.max(1, Math.floor(radius))

    for (let y = 0; y < maskBitmap.height; y++) {
      for (let x = 0; x < maskBitmap.width; x++) {
        let sum = 0
        let count = 0

        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            const nx = x + dx
            const ny = y + dy
            if (
              nx >= 0 &&
              nx < maskBitmap.width &&
              ny >= 0 &&
              ny < maskBitmap.height
            ) {
              const idx = (ny * maskBitmap.width + nx) * 4 + 3
              sum += data[idx]
              count++
            }
          }
        }

        const idx = (y * maskBitmap.width + x) * 4
        blurred[idx] = data[idx] // R
        blurred[idx + 1] = data[idx + 1] // G
        blurred[idx + 2] = data[idx + 2] // B
        blurred[idx + 3] = Math.round(sum / count) // A (yumuşatılmış)
      }
    }

    const blurredImageData = new ImageData(
      blurred,
      maskBitmap.width,
      maskBitmap.height
    )
    tctx.putImageData(blurredImageData, 0, 0)

    return await createImageBitmap(tmp)
  } catch (e) {
    console.warn("Feather apply failed, returning original", e)
    return maskBitmap
  }
}

async function confidenceMaskToBitmap(
  m: any,
  wfb: number,
  hfb: number
): Promise<ImageBitmap | null> {
  if (m instanceof ImageBitmap) return m
  if (typeof m.getAsImageBitmap === "function") {
    try {
      return await m.getAsImageBitmap()
    } catch {}
  }
  const toFloat32 = m?.getAsFloat32Array?.bind(m)
  const w: number = m?.width ?? wfb ?? MASK_SHORT_SIDE
  const h: number = m?.height ?? hfb ?? MASK_SHORT_SIDE
  if (!toFloat32) return null
  const f32: Float32Array = toFloat32()
  const tmp = new OffscreenCanvas(w, h)
  const tctx = tmp.getContext("2d")!
  const img = tctx.createImageData(w, h)
  for (let i = 0, p = 0; i < f32.length; i++, p += 4) {
    const a = Math.max(0, Math.min(255, Math.round(f32[i] * 255)))
    img.data[p] = 255
    img.data[p + 1] = 255
    img.data[p + 2] = 255
    img.data[p + 3] = DEBUG_INVERT ? 255 - a : a
  }
  tctx.putImageData(img, 0, 0)
  return await createImageBitmap(tmp)
}

async function maskToImageBitmap(
  result: ImageSegmenterResult
): Promise<ImageBitmap | null> {
  const anyResult: any = result as any
  const mask: any = anyResult.categoryMask
  if (!mask) return null

  if (mask instanceof ImageBitmap) return mask
  if (typeof mask.getAsImageBitmap === "function") {
    try {
      return await mask.getAsImageBitmap()
    } catch {}
  }

  const toFloat32 = mask.getAsFloat32Array?.bind(mask)
  const toUint8 = mask.getAsUint8Array?.bind(mask)
  const width: number = mask.width ?? anyResult.outputWidth ?? MASK_SHORT_SIDE
  const height: number =
    mask.height ?? anyResult.outputHeight ?? MASK_SHORT_SIDE
  if (!toFloat32 && !toUint8) return null

  let alpha: Uint8ClampedArray
  if (toFloat32) {
    const f32: Float32Array = toFloat32()
    alpha = new Uint8ClampedArray(f32.length)
    for (let i = 0; i < f32.length; i++) {
      const cls = Math.round(f32[i])
      const pass = cls === personIdx
      const a = pass ? 255 : 0
      alpha[i] = DEBUG_INVERT ? 255 - a : a
    }
  } else {
    const u8: Uint8Array = toUint8()
    alpha = new Uint8ClampedArray(u8.length)
    for (let i = 0; i < u8.length; i++) {
      const pass = u8[i] === personIdx
      const a = pass ? 255 : 0
      alpha[i] = DEBUG_INVERT ? 255 - a : a
    }
  }

  const tmp = new OffscreenCanvas(width, height)
  const tctx = tmp.getContext("2d")!
  const img = tctx.createImageData(width, height)
  for (let i = 0, p = 0; i < alpha.length; i++, p += 4) {
    img.data[p] = 255
    img.data[p + 1] = 255
    img.data[p + 2] = 255
    img.data[p + 3] = alpha[i]
  }
  tctx.putImageData(img, 0, 0)
  return await createImageBitmap(tmp)
}

// --- BG yükleme: token + LRU + asla aktif olanı kapatma ---
async function loadBackground(url: string) {
  if (!url) return
  const w = canvas?.width || 960 // Düşürüldü: 1280 -> 960 (daha düşük performans için)
  const h = canvas?.height || 540 // Düşürüldü: 720 -> 540
  const key = `${url}@${w}x${h}`

  // Aynı görsel/ölçü zaten kullanılıyorsa
  if (
    bgUrl === url &&
    bgBitmap &&
    bgBitmap.width === w &&
    bgBitmap.height === h
  ) {
    ;(self as any).postMessage({ type: "bg-ready" })
    return
  }

  // Cache hiti
  const cached = bgCache.get(key)
  if (cached) {
    // LRU güncelle
    bgCache.delete(key)
    bgCache.set(key, cached)
    bgUrl = url
    bgBitmap = cached
    ;(self as any).postMessage({ type: "bg-ready" })
    return
  }

  // Yeni istek
  const myToken = ++bgReqToken
  bgAbort?.abort()
  bgAbort = new AbortController()
  ;(self as any).postMessage({ type: "bg-loading" })

  try {
    const res = await fetch(url, { mode: "cors", signal: bgAbort.signal })
    const blob = await res.blob()

    // decode sırasında küçült
    const bmp = await createImageBitmap(blob, {
      resizeWidth: w,
      resizeHeight: h,
      resizeQuality: "medium", // Düşürüldü: "high" -> "medium" (daha hızlı)
    })

    // Eski istekse çöpe at
    if (myToken !== bgReqToken) {
      try {
        bmp.close()
      } catch {}
      return
    }

    bgUrl = url
    bgBitmap = bmp
    bgCache.set(key, bmp)

    // LRU: kapasite aşımı → aktif olmayanı kapatarak çıkart
    while (bgCache.size > MAX_BG_CACHE) {
      const oldestKey = bgCache.keys().next().value as string
      const oldestBmp = bgCache.get(oldestKey)!
      // aktif olanı evict etme
      if (oldestBmp === bgBitmap) {
        bgCache.delete(oldestKey)
        bgCache.set(oldestKey, oldestBmp)
        continue
      }
      bgCache.delete(oldestKey)
      try {
        oldestBmp.close()
      } catch {}
    }

    ;(self as any).postMessage({ type: "bg-ready" })
  } catch (e: any) {
    if (e?.name === "AbortError")
      return // Hata: cache/aktif bg’ye dokunma; sadece sinyal gönder
    ;(self as any).postMessage({ type: "bg-ready" })
  }
}

self.onmessage = async (e: MessageEvent) => {
  const data = e.data

  if (data.type === "init") {
    try {
      canvas = data.canvas as OffscreenCanvas
      ctx = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D

      const modelUrl: string = data.modelUrl
      const wasmBaseUrl: string = data.wasmBaseUrl
      const vision = await FilesetResolver.forVisionTasks(wasmBaseUrl)

      segmenter = await ImageSegmenter.createFromOptions(vision, {
        baseOptions: { modelAssetPath: modelUrl, delegate: "CPU" },
        runningMode: "VIDEO",
        outputCategoryMask: true,
        outputConfidenceMasks: false, // Kapatıldı: daha düşük performans için
      })

      labels = (segmenter as any).getLabels?.() ?? []
      personIdx = pickPersonIndex(labels)
      ;(self as any).postMessage({ type: "ready" })
      ;(self as any).postMessage({ type: "info", labels, personIdx })
    } catch (err: any) {
      ;(self as any).postMessage({
        type: "error",
        error: err?.message || String(err),
      })
    }
    return
  }

  if (data.type === "setBackground") {
    await loadBackground(data.url)
    return
  }

  if (data.type === "frame") {
    // Frame skip: Önceki kare hala işleniyorsa yeni kareyi drop et
    if (isProcessingFrame) {
      const frame: ImageBitmap = data.frame
      frame.close()
      return
    }

    const frame: ImageBitmap = data.frame
    isProcessingFrame = true

    try {
      // Canvas boyutu 4x6 oranında olmalı (zaten init'te ayarlandı)
      if (!canvas.width || !canvas.height) {
        // Fallback: 3:2 oranında varsayılan boyut
        canvas.width = 1800
        canvas.height = 1200
      }
      ensureFgCanvasSize(canvas.width, canvas.height)

      // Segmentasyon için düşük çözünürlüklü işleme (3:2 oranında)
      const processCanvas = new OffscreenCanvas(PROCESS_WIDTH, PROCESS_HEIGHT)
      const processCtx = processCanvas.getContext("2d")!
      processCtx.drawImage(frame, 0, 0, PROCESS_WIDTH, PROCESS_HEIGHT)

      // Segmentation işlemi için küçük canvas'ı ImageBitmap'e çevir
      const processBitmap = await createImageBitmap(processCanvas)
      const ts = performance.now()
      const res = await segmenter!.segmentForVideo(processBitmap, ts)
      processBitmap.close()

      // Foreground: frame'i canvas boyutuna çiz
      fgCtx!.globalCompositeOperation = "source-over"
      fgCtx!.clearRect(0, 0, canvas.width, canvas.height)
      fgCtx!.drawImage(frame, 0, 0, canvas.width, canvas.height)

      // Mask'i al ve canvas boyutuna scale et
      let maskBitmap: ImageBitmap | null = null
      const cm = (res as any).confidenceMasks
      if (cm && cm[personIdx]) {
        maskBitmap = await confidenceMaskToBitmap(
          cm[personIdx],
          (res as any).outputWidth,
          (res as any).outputHeight
        )
      }
      if (!maskBitmap) maskBitmap = await maskToImageBitmap(res)

      if (maskBitmap) {
        // Mask'i canvas boyutuna scale et
        const scaledMask = new OffscreenCanvas(canvas.width, canvas.height)
        const scaledMaskCtx = scaledMask.getContext("2d")!
        scaledMaskCtx.drawImage(maskBitmap, 0, 0, canvas.width, canvas.height)
        maskBitmap.close()

        // Feather/blur uygula (kenar yumuşatma)
        const featheredMaskBitmap = await createImageBitmap(scaledMask)
        const featheredMask = await applyFeatherToMask(
          featheredMaskBitmap,
          FEATHER_RADIUS
        )
        featheredMaskBitmap.close()

        if (featheredMask) {
          // Mask'i foreground'a uygula
          fgCtx!.globalCompositeOperation = "destination-in"
          fgCtx!.drawImage(featheredMask, 0, 0, canvas.width, canvas.height)
          featheredMask.close()
        }
      }
      fgCtx!.globalCompositeOperation = "source-over"

      // Compose: background + foreground
      ctx.globalCompositeOperation = "source-over"
      if (bgBitmap) {
        try {
          ctx.drawImage(bgBitmap, 0, 0, canvas.width, canvas.height)
        } catch (e) {
          // Eğer bir şekilde detached yakalarsak: bg'yi bırak ve beyaz boya
          bgBitmap = null
          ctx.fillStyle = "#ffffff"
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        }
      } else {
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
      ctx.drawImage(fgCanvas!, 0, 0, canvas.width, canvas.height)
    } catch (err: any) {
      ;(self as any).postMessage({
        type: "error",
        error: err?.message || String(err),
      })
      try {
        ctx.globalCompositeOperation = "source-over"
        if (bgBitmap) {
          try {
            ctx.drawImage(bgBitmap, 0, 0, canvas.width, canvas.height)
          } catch {
            bgBitmap = null
          }
        } else {
          ctx.fillStyle = "#ffffff"
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        }
        ctx.drawImage(frame, 0, 0, canvas.width, canvas.height)
      } catch {}
    } finally {
      frame.close()
      isProcessingFrame = false
      // İşleme bitti, ana thread'e idle mesajı gönder
      ;(self as any).postMessage({ type: "idle" })
    }
  }
}
