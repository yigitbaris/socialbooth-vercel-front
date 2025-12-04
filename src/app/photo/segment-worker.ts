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

// ---- BG yönetimi (detached hatasına karşı sağlam) ----
let bgUrl: string | null = null
let bgBitmap: ImageBitmap | null = null
const bgCache = new Map<string, ImageBitmap>() // LRU için ekleme sırası
const MAX_BG_CACHE = 4
let bgAbort: AbortController | null = null
let bgReqToken = 0 // yarış önleyici token

const MASK_SHORT_SIDE = 256
const DEBUG_INVERT = false

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
  const w = canvas?.width || 1280
  const h = canvas?.height || 720
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
      resizeQuality: "high",
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

      try {
        segmenter = await ImageSegmenter.createFromOptions(vision, {
          baseOptions: { modelAssetPath: modelUrl, delegate: "GPU" },
          runningMode: "VIDEO",
          outputCategoryMask: true,
          outputConfidenceMasks: true,
        })
      } catch {
        segmenter = await ImageSegmenter.createFromOptions(vision, {
          baseOptions: { modelAssetPath: modelUrl, delegate: "CPU" },
          runningMode: "VIDEO",
          outputCategoryMask: true,
          outputConfidenceMasks: true,
        })
      }

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
    const frame: ImageBitmap = data.frame
    try {
      if (!canvas.width || !canvas.height) {
        canvas.width = frame.width
        canvas.height = frame.height
      }
      ensureFgCanvasSize(canvas.width, canvas.height)

      // segmentation
      const k = Math.min(
        MASK_SHORT_SIDE / frame.width,
        MASK_SHORT_SIDE / frame.height
      )
      const smallW = Math.max(1, Math.round(frame.width * k))
      const smallH = Math.max(1, Math.round(frame.height * k))
      const small = await createImageBitmap(frame, {
        resizeWidth: smallW,
        resizeHeight: smallH,
        resizeQuality: "high",
      })
      const ts = performance.now()
      const res = await segmenter!.segmentForVideo(small, ts)
      small.close()

      // foreground
      fgCtx!.globalCompositeOperation = "source-over"
      fgCtx!.clearRect(0, 0, canvas.width, canvas.height)
      fgCtx!.drawImage(frame, 0, 0, canvas.width, canvas.height)

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
        fgCtx!.globalCompositeOperation = "destination-in"
        fgCtx!.drawImage(maskBitmap, 0, 0, canvas.width, canvas.height)
        maskBitmap.close?.()
      }
      fgCtx!.globalCompositeOperation = "source-over"

      // compose
      ctx.globalCompositeOperation = "source-over"
      if (bgBitmap) {
        try {
          ctx.drawImage(bgBitmap, 0, 0, canvas.width, canvas.height)
        } catch (e) {
          // Eğer bir şekilde detached yakalarsak: bg’yi bırak ve beyaz boya
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
    }
  }
}
