// app/photo/page.tsx
"use client"

import React, { useState, useRef, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import * as fabric from "fabric"
import { translations } from "../utils/translations"
import api from "../utils/api"
import { useGlobalContext } from "../context/GlobalContext"

const FILTER_BASE = "/filters"

const PRINT_PHOTOS_KEY = "sb:print:photos:v1"
const PRINT_META_KEY = "sb:print:meta:v1"
const CAPTURED_KEY = "capturedPhotos"
const PRINT_COUNT_KEY = "printCount"

function PhotoPageContent() {
  const router = useRouter()
  const { lang } = useGlobalContext()

  // === canlı arka plan kaldırma (Live preview) ===
  const workerRef = useRef<Worker | null>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const offscreenDoneRef = useRef(false)
  const workerReadyRef = useRef(false)
  const pumpingRef = useRef(false)

  const params = useSearchParams()
  const photoCount = parseInt(params.get("photoCount") ?? "1")

  // fotoğraflar + seçili indeks
  const [photos, setPhotos] = useState<string[]>([])
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)

  // Her fotoğrafın arka planını hatırlamak için
  const [photoBackgrounds, setPhotoBackgrounds] = useState<(string | null)[]>(
    []
  )

  // --- YENİ: Orijinal çekimlerin saklanması ve filtre bilgisi
  const [originalPhotos, setOriginalPhotos] = useState<string[]>([])
  const [photoFilters, setPhotoFilters] = useState<(string | null)[]>([])
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null)

  // Text state persistence (JSON for Fabric)
  const [textStates, setTextStates] = useState<(any | null)[]>([])

  // --- Sağ panel modu: menü / efekt (filtre) / sticker / text
  const [mode, setMode] = useState<"menu" | "effect" | "sticker" | "text">(
    "menu"
  )

  // background selection states
  const [isBackgroundSelected, setIsBackgroundSelected] = useState(false)
  const [showBackgroundConfirmModal, setShowBackgroundConfirmModal] =
    useState(false)
  const [pendingBackgroundSelection, setPendingBackgroundSelection] = useState<
    string | null
  >(null)

  // Warning state for disabled style buttons
  const [showStyleDisabledWarning, setShowStyleDisabledWarning] =
    useState(false)
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Warning state for start shooting without background
  const [showStartShootingWarning, setShowStartShootingWarning] = useState(false)
  const startShootingWarningTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // background removal state
  const [isProcessing, setIsProcessing] = useState(false)

  // Countdown state for photo capture
  const [countdown, setCountdown] = useState<number | null>(null)
  const [isCountingDown, setIsCountingDown] = useState(false)
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null)
  const shutterAudioRef = useRef<HTMLAudioElement | null>(null)

  // Retake functionality
  const [retakeCount, setRetakeCount] = useState(0)
  const [maxRetakes] = useState(2)

  // Text editing state
  const [textInput, setTextInput] = useState("")
  const [textColor, setTextColor] = useState("#000000")
  const [fontSize, setFontSize] = useState(24)
  const [fontFamily, setFontFamily] = useState("Arial")
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [fontStyleView, setFontStyleView] = useState<"font" | "style">("font")
  const [hasTextOnCanvas, setHasTextOnCanvas] = useState(false)
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null)
  const fabricContainerRef = useRef<HTMLDivElement | null>(null)

  // Info tooltip state
  const [showInfoTooltip, setShowInfoTooltip] = useState(false)

  // Preview Scale State for Text Mode
  const [previewScale, setPreviewScale] = useState(1)
  const previewContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Only observe if in text mode and container exists
    const el = previewContainerRef.current
    if (!el) return

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        if (width === 0 || height === 0) continue
        // 360x240 base size (3:2 ratio)
        // Allow scaling > 1 to fill the space
        const s = Math.min(width / 360, height / 240)
        setPreviewScale(s)
      }
    })
    
    ro.observe(el)
    return () => ro.disconnect()
  }, [mode, selectedIdx]) // Re-run when mode changes to ensure ref is captured if it mounts/unmounts

  // category name from order
  const [categoryName, setCategoryName] = useState<string | null>(null)

  // geri sayım (saniye)
  const [remaining, setRemaining] = useState(600)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // kamera refs
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // static arkaplan kategorileri ve harita (ARTIK API'DEN ÇEKİLİYOR)
  // const bgCategories = [
  //   translations[lang].natureCategory,
  //   translations[lang].kidsCategory,
  //   translations[lang].fantasticCategory,
  //   translations[lang].footballCategory,
  //   translations[lang].graphicCategory,
  //   translations[lang].colorsCategory,
  //   translations[lang].safariCategory,
  //   translations[lang].cityCategory,
  // ]
  // const baseBgMap: Record<string, string[]> = { ... }

  // API'den gelen kategoriler ve görseller
  const [bgCategories, setBgCategories] = useState<string[]>([])
  const [bgItemsByCategory, setBgItemsByCategory] = useState<
    Record<string, string[]>
  >({})

  // seçilen kategori ve arkaplan
  const [selectedBgCategory, setSelectedBgCategory] = useState<string>(
    translations[lang].allCategory
  )
  const [selectedBg, setSelectedBg] = useState<string | null>(null)

  // API'den gelen harita
  const bgMap: Record<string, string[]> = { ...bgItemsByCategory }
  // Kategoriler boşsa, en azından All key'i olsun
  if (!bgMap[translations[lang].allCategory]) {
    bgMap[translations[lang].allCategory] = []
  }
  const displayedBackgrounds =
    bgMap[selectedBgCategory] ?? bgMap[translations[lang].allCategory] ?? []

  // Background'ları API'den çek
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await api.get(
          "/backgrounds/getAllBackgrounds/6825db80c30aaa768bc2e621"
        )
        const list: any[] = res?.data?.data || []
        const apiCategories: string[] = Array.isArray(res?.data?.categories)
          ? res.data.categories
          : []

        // Harita: kategori -> imageLink[]
        const map: Record<string, string[]> = {}
        const discoveredCategories = new Set<string>()
        for (const item of list) {
          const cat = String(item.category || "").trim()
          const link = String(item.imageLink || "").trim()
          if (!link) continue
          // All
          if (!map[translations[lang].allCategory]) {
            map[translations[lang].allCategory] = []
          }
          map[translations[lang].allCategory].push(link)
          // Specific category
          if (cat) {
            if (!map[cat]) map[cat] = []
            map[cat].push(link)
            discoveredCategories.add(cat)
          }
        }

        if (!cancelled) {
          setBgItemsByCategory(map)
          const categoryList =
            apiCategories.length > 0
              ? apiCategories
              : Array.from(discoveredCategories)
          setBgCategories(categoryList)
          // Varsayılan kategori: mümkünse mevcut seçim korunur
          setSelectedBgCategory((prev) => {
            if (prev && map[prev]) return prev
            return translations[lang].allCategory
          })
        }
      } catch (e) {
        console.error("Backgrounds fetch failed", e)
        if (!cancelled) {
          // boşalt, sadece All kalsın (canlı arkaplanları ekliyoruz zaten)
          setBgItemsByCategory({ [translations[lang].allCategory]: [] })
          setBgCategories([])
          setSelectedBgCategory(translations[lang].allCategory)
        }
      }
    })()
    return () => {
      cancelled = true
    }
    // lang değişince All label'ı değişiyor → yeniden kur
  }, [lang])

  // Arka plan seçim onaylı
  const handleBackgroundSelect = (bgUrl: string | null) => {
    if (!isBackgroundSelected) {
      setPendingBackgroundSelection(bgUrl)
      setShowBackgroundConfirmModal(true)
    }
  }
  const confirmBackgroundSelection = () => {
    setSelectedBg(pendingBackgroundSelection)
    setIsBackgroundSelected(true)
    setRetakeCount(0)
    setShowBackgroundConfirmModal(false)
    setPendingBackgroundSelection(null)

    if (workerReadyRef.current && pendingBackgroundSelection) {
      workerRef.current?.postMessage({
        type: "setBackground",
        url: pendingBackgroundSelection,
      })
    }
  }
  const cancelBackgroundSelection = () => {
    setShowBackgroundConfirmModal(false)
    setPendingBackgroundSelection(null)
  }

  // PhotoPageContent bileşeni içinde, helper:
  const saveForPrintShare = (
    p = photos,
    f = photoFilters,
    b = photoBackgrounds
  ) => {
    try {
      sessionStorage.setItem(PRINT_PHOTOS_KEY, JSON.stringify(p))
      sessionStorage.setItem(
        PRINT_META_KEY,
        JSON.stringify({ filters: f, backgrounds: b })
      )
    } catch (e) {
      console.warn("sessionStorage write failed", e)
    }
  }

  // photos / filters / backgrounds her değiştiğinde otomatik yaz:
  useEffect(() => {
    saveForPrintShare()
  }, [photos, photoFilters, photoBackgrounds])

  useEffect(() => {
    // countdown
    timerRef.current = setInterval(() => setRemaining((t) => t - 1), 1000)
    return () => clearInterval(timerRef.current!)
  }, [])

  // Sipariş kategorisi
  useEffect(() => {
    const orderId = params.get("orderId")
    if (!orderId) return
    ;(async () => {
      try {
        const res = await api.get(`/orders/getOrder/${orderId}`)
        const name = res?.data?.data?.categoryId?.name
        if (typeof name === "string" && name.trim().length > 0) {
          setCategoryName(name)
        }
      } catch (e) {
        console.error("Order fetch failed", e)
      }
    })()
  }, [params])

  useEffect(() => {
    if (remaining <= 0) router.push("/")
  }, [remaining, router])

  // Kamera + canlı önizleme (arka plan seçilince veya seçilmeyince)
  useEffect(() => {
    if (selectedIdx === null) {
      let stream: MediaStream | null = null
      let cancelled = false
      let animationFrameId: number | null = null

      ;(async () => {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true })
          if (!videoRef.current) return
          videoRef.current.srcObject = stream
          videoRef.current.muted = true
          await videoRef.current.play()

          if (cancelled) return

          // Eğer bir arka plan seçiliyse -> Worker ile segmentasyon
          // Eğer selectedBg null ise (veya henüz seçilmediyse) -> Raw video çizimi
          const shouldUseWorker = selectedBg !== null

          if (shouldUseWorker) {
            // --- WORKER START ---
             if (!offscreenDoneRef.current && previewCanvasRef.current) {
              const v = videoRef.current!
              const canvasW = v.videoWidth || 1920
              const canvasH = v.videoHeight || 1080
              previewCanvasRef.current.width = canvasW
              previewCanvasRef.current.height = canvasH
              
              // Canvas'ı offscreen'e transfer et
              const offscreen = previewCanvasRef.current.transferControlToOffscreen()
              offscreenDoneRef.current = true

              workerRef.current = new Worker(
                new URL("./segment-worker.ts", import.meta.url),
                { type: "module" }
              )

              workerRef.current.onmessage = (ev: MessageEvent) => {
                const { type } = ev.data || {}
                if (type === "ready") {
                  workerReadyRef.current = true
                  if (selectedBg) {
                    workerRef.current?.postMessage({
                      type: "setBackground",
                      url: selectedBg,
                    })
                  }
                  pump()
                }
              }

              const modelUrl = new URL(
                "/models/selfie_segmenter_landscape.tflite",
                location.origin
              ).toString()
              const wasmBaseUrl = new URL(
                "/mediapipe/wasm/",
                location.origin
              ).toString()

              workerRef.current.postMessage(
                { type: "init", canvas: offscreen, modelUrl, wasmBaseUrl },
                [offscreen]
              )
            } else if (workerRef.current) {
               // Zaten worker varsa, sadece pump tetikle
               pump()
               // Eğer worker var ve selectedBg değiştiyse güncelle
               if (selectedBg) {
                  workerRef.current.postMessage({
                      type: "setBackground",
                      url: selectedBg,
                  })
               }
            }

            async function pump() {
              if (cancelled || pumpingRef.current) return
              pumpingRef.current = true

              const v = videoRef.current!
              const loop = async () => {
                if (cancelled) return
                // Worker'a frame gönder
                if (v.readyState >= 2) {
                   const frame = await createImageBitmap(v)
                   workerRef.current?.postMessage({ type: "frame", frame }, [frame])
                }
                
                if ("requestVideoFrameCallback" in v) {
                  (v as any).requestVideoFrameCallback(loop)
                } else {
                  setTimeout(loop, 16)
                }
              }
              loop()
            }
            // --- WORKER END ---

          } else {
             // --- RAW VIDEO MODE START ---
             // Eğer daha önce worker kurulduysa temizle (fakat offscreen transfer edildiyse geri alamayız,
             // bu yüzden offscreenDoneRef=true ise basitçe o canvası kullanamayız, yeni canvas gerekir mi?
             // Offscreen transfer edilen canvas DOM'da "detached" olmaz, ama main thread'den drawImage yapamayız.
             // ÇÖZÜM: `key` prop kullanarak Canvas'ı remount etmek en temizi. 
             // Ancak bu useEffect içinde. Biz `key` prop'u `isBackgroundSelected` veya `selectedBg` değişimine bağlarsak
             // JSX tarafında component unmount/remount olur ve yeni ref gelir. 
             // Şimdilik JSX tarafında bu key değişimini yapalım, burada sadece raw çizim mantığı kalsın.
             
             // NOT: JSX'te canvas key={selectedBg ? "worker" : "raw"} gibi bir şey yaparsak ref sıfırlanır.
             // Biz burada ref'in taze olduğunu varsayalım.
             
             if (previewCanvasRef.current) {
                // Eğer offscreen'e transfer edildiyse buraya düşmemesi lazım (JSX re-mount edecek)
                const ctx = previewCanvasRef.current.getContext("2d")
                if (ctx) {
                   const loop = () => {
                      if (cancelled) return
                      if (videoRef.current && videoRef.current.readyState >= 2) {
                         const v = videoRef.current
                         previewCanvasRef.current!.width = v.videoWidth
                         previewCanvasRef.current!.height = v.videoHeight
                         // Aynalama için save/scale
                         ctx.save()
                         ctx.translate(v.videoWidth, 0)
                         ctx.scale(-1, 1)
                         ctx.drawImage(v, 0, 0)
                         ctx.restore()
                      }
                      animationFrameId = requestAnimationFrame(loop)
                   }
                   loop()
                }
             }
             // --- RAW VIDEO MODE END ---
          }
        } catch (e) {
          console.error(e)
        }
      })()

      return () => {
        cancelled = true
        pumpingRef.current = false
        if (animationFrameId) cancelAnimationFrame(animationFrameId)

        // Worker temizliği
        workerReadyRef.current = false
        if (workerRef.current) {
           workerRef.current.terminate()
           workerRef.current = null
        }
        offscreenDoneRef.current = false // Canvas yeniden oluşacaksa bu da sıfırlanmalı

        if (videoRef.current?.srcObject) {
          ;(videoRef.current.srcObject as MediaStream)
            .getTracks()
            .forEach((t) => t.stop())
        }
      }
    } else {
      // Fotoğraf çekildi, kamera dursun
      workerRef.current?.terminate()
      workerRef.current = null
      offscreenDoneRef.current = false
      if (videoRef.current?.srcObject) {
        ;(videoRef.current.srcObject as MediaStream)
          .getTracks()
          .forEach((t) => t.stop())
      }
    }
  }, [selectedIdx, selectedBg]) // isBackgroundSelected bağımlılığını kaldırdık, selectedBg önemli

  // Deklanşör sesi
  useEffect(() => {
    const createShutterSound = () => {
      try {
        const audio = new Audio()
        audio.src =
          "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt459NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwfCRqT2e3AcCkGOYfJ8d+NPwYb"
        audio.volume = 0.4
        audio.preload = "auto"
        return audio
      } catch {
        return null
      }
    }
    shutterAudioRef.current = createShutterSound()
    return () => {
      if (shutterAudioRef.current) {
        shutterAudioRef.current.pause()
        shutterAudioRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
    }
  }, [])

  // 3-2-1
  const startCountdown = () => {
    if (photos.length >= 1 || isProcessing || isCountingDown) return
    setIsCountingDown(true)
    setCountdown(3)

    let currentCount = 3
    countdownTimerRef.current = setInterval(() => {
      currentCount -= 1
      if (currentCount > 0) {
        setCountdown(currentCount)
      } else {
        clearInterval(countdownTimerRef.current!)
        setCountdown(null)
        setIsCountingDown(false)
        actualCapture()
      }
    }, 1000)
  }

  const actualCapture = async () => {
    if (!previewCanvasRef.current) return
    if (shutterAudioRef.current) {
      shutterAudioRef.current.currentTime = 0
      try {
        await shutterAudioRef.current.play()
      } catch {}
    }

    const src = previewCanvasRef.current

    // 4x6 oranlı (3/2) offscreen canvas (örnek: 1800x1200)
    const targetW = 1800
    const targetH = 1200
    const offscreen = document.createElement("canvas")
    offscreen.width = targetW
    offscreen.height = targetH
    const ctx = offscreen.getContext("2d")
    if (!ctx) return

    // Kaynağı contain + center çiz (letterbox)
    const srcW = src.width
    const srcH = src.height
    if (!srcW || !srcH) return

    const scale = Math.min(targetW / srcW, targetH / srcH)
    const drawW = srcW * scale
    const drawH = srcH * scale
    const dx = (targetW - drawW) / 2
    const dy = (targetH - drawH) / 2

    // Arka planı şeffaf/boş bırakmak yerine beyaz yapmıyoruz, artık ne varsa o (raw ise raw, bg ise bg)
    // ctx.fillStyle = "#ffffff"
    // ctx.fillRect(0, 0, targetW, targetH)
    ctx.drawImage(src, dx, dy, drawW, drawH)

    const img = offscreen.toDataURL("image/jpeg", 0.95)

    const newPhotoIndex = photos.length
    // Orijinal + mevcut foto
    setOriginalPhotos((p) => [...p, img])
    setPhotos((p) => [...p, img])
    setPhotoBackgrounds((p) => [...p, selectedBg])
    setPhotoFilters((p) => [...p, null]) // başlangıçta filtre yok
    setTextStates((p) => [...p, null]) // başlangıçta text yok
    setSelectedIdx(newPhotoIndex)
  }

  // Arkaplanlı görüntüyü oluşturmak için hazır fonksiyon (gerekirse)
  const applyBackgroundToImage = (
    processedImageUrl: string,
    backgroundUrl: string
  ): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")!

      const backgroundImg = new Image()
      const processedImg = new Image()

      let loadedCount = 0
      const checkLoaded = () => {
        loadedCount++
        if (loadedCount === 2) {
          canvas.width = processedImg.width
          canvas.height = processedImg.height
          ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height)
          ctx.drawImage(processedImg, 0, 0)
          resolve(canvas.toDataURL("image/jpeg", 0.9))
        }
      }

      backgroundImg.onload = checkLoaded
      processedImg.onload = checkLoaded
      backgroundImg.src = backgroundUrl
      processedImg.src = processedImageUrl
    })
  }

  // --- YENİ: Base üzerine PNG filtre overlay birleştirme
  const composeWithOverlay = (
    baseUrl: string,
    overlayUrl: string
  ): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")!

      const baseImg = new Image()
      const overlayImg = new Image()

      let loaded = 0
      const done = () => {
        loaded++
        if (loaded < 2) return
        canvas.width = baseImg.width
        canvas.height = baseImg.height
        // base
        ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height)
        // overlay — PNG şeffaf alanları korur
        ctx.drawImage(overlayImg, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL("image/jpeg", 0.95))
      }

      baseImg.onload = done
      overlayImg.onload = done
      // aynı origin: CORS gerekmiyor, ama sorun çıkmasın diye:
      baseImg.crossOrigin = "anonymous"
      overlayImg.crossOrigin = "anonymous"

      baseImg.src = baseUrl
      overlayImg.src = overlayUrl
    })
  }

  // --- YENİ: Filtre uygulama / kaldırma
  const applyFilterToCurrent = async (filterUrl: string | null) => {
    if (selectedIdx === null) return
    const base = originalPhotos[selectedIdx]
    if (!base) return

    if (!filterUrl) {
      // Filtreyi kaldır → orijinale dön
      setPhotos((prev) => prev.map((p, i) => (i === selectedIdx ? base : p)))
      setSelectedFilter(null)
      setPhotoFilters((prev) =>
        prev.map((f, i) => (i === selectedIdx ? null : f))
      )
      return
    }

    setIsProcessing(true)
    const merged = await composeWithOverlay(base, filterUrl)
    setIsProcessing(false)

    setPhotos((prev) => prev.map((p, i) => (i === selectedIdx ? merged : p)))
    setSelectedFilter(filterUrl)
    setPhotoFilters((prev) =>
      prev.map((f, i) => (i === selectedIdx ? filterUrl : f))
    )
  }

  // Updated capture trigger
  const capture = () => {
    // Check if background is selected
    if (!isBackgroundSelected) {
      setShowStartShootingWarning(true)
      if (startShootingWarningTimeoutRef.current) {
        clearTimeout(startShootingWarningTimeoutRef.current)
      }
      startShootingWarningTimeoutRef.current = setTimeout(() => {
        setShowStartShootingWarning(false)
      }, 3000)
      return
    }
    startCountdown()
  }

  // Retake current photo (aynı arkaplan)
  const retakePhoto = () => {
    if (selectedIdx === null || retakeCount >= maxRetakes) return

    // Clean up text mode if active
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.dispose()
      fabricCanvasRef.current = null
    }
    setHasTextOnCanvas(false)
    setMode("menu")

    setPhotos((p) => p.filter((_, i) => i !== selectedIdx))
    setOriginalPhotos((p) => p.filter((_, i) => i !== selectedIdx))
    setPhotoBackgrounds((p) => p.filter((_, i) => i !== selectedIdx))
    setPhotoFilters((p) => p.filter((_, i) => i !== selectedIdx))
    setTextStates((p) => p.filter((_, i) => i !== selectedIdx))
    setSelectedIdx(null)
    setSelectedFilter(null)
    setRetakeCount((prev) => prev + 1)
    setIsBackgroundSelected(true)
  }

  // Helper: Reconstruct background (Original + Filter) without text
  const getCleanImage = async (idx: number): Promise<string> => {
    const base = originalPhotos[idx]
    const filter = photoFilters[idx]
    if (!filter) return base
    return await composeWithOverlay(base, filter)
  }

  // Text overlay (fabric)
  const initializeFabricCanvas = async () => {
    if (!fabricContainerRef.current || selectedIdx === null) return
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.dispose()
    }
    setHasTextOnCanvas(false)

    const canvas = new fabric.Canvas("text-canvas", {
      width: 360,
      height: 240,
      backgroundColor: "transparent",
      preserveObjectStacking: true,
    })

    fabricCanvasRef.current = canvas

    // Event listeners for bidirectional binding
    const updateSelection = () => {
      const activeObj = canvas.getActiveObject()
      if (activeObj && activeObj.type === "text") {
        const textObj = activeObj as fabric.Text
        if (textObj.text) setTextInput(textObj.text)
        if (textObj.fill) setTextColor(textObj.fill as string)
        if (textObj.fontSize) setFontSize(textObj.fontSize)
        if (textObj.fontFamily) setFontFamily(textObj.fontFamily)
        if (typeof textObj.fontWeight === "string")
          setIsBold(textObj.fontWeight === "bold")
        if (textObj.fontStyle) setIsItalic(textObj.fontStyle === "italic")
        if (textObj.underline !== undefined) setIsUnderline(textObj.underline)
      }
    }

    canvas.on("selection:created", updateSelection)
    canvas.on("selection:updated", updateSelection)

    // Load Clean Image as Background
    const bgUrl = await getCleanImage(selectedIdx)

    const setCanvasBackground = (url: string) => {
      fabric.Image.fromURL(url).then((img) => {
        const scaleX = 360 / img.width!
        const scaleY = 240 / img.height!
        const scale = Math.min(scaleX, scaleY)
        img.scale(scale)

        const scaledWidth = img.width! * scale
        const scaledHeight = img.height! * scale
        img.set({
          left: (360 - scaledWidth) / 2,
          top: (240 - scaledHeight) / 2,
          selectable: false,
          evented: false,
        })

        canvas.backgroundImage = img
        canvas.renderAll()
      })
    }

    // Restore Text State if exists
    const savedState = textStates[selectedIdx]
    if (savedState) {
      canvas.loadFromJSON(savedState, () => {
        setCanvasBackground(bgUrl)
        const objects = canvas.getObjects().filter((o) => o.type === "text")
        setHasTextOnCanvas(objects.length > 0)
      })
    } else {
      setCanvasBackground(bgUrl)
    }
  }

  // --- Live Update Helpers ---
  // Call these when input states change to update the ACTIVE object
  const updateActiveObject = (updates: Partial<fabric.Text>) => {
    if (!fabricCanvasRef.current) return
    const activeObj = fabricCanvasRef.current.getActiveObject() as fabric.Text
    if (activeObj && activeObj.type === "text") {
      activeObj.set(updates)
      fabricCanvasRef.current.requestRenderAll()
    }
  }

  // Effects to sync State -> Canvas Active Object
  useEffect(() => {
    updateActiveObject({ text: textInput })
  }, [textInput])

  useEffect(() => {
    updateActiveObject({ fill: textColor })
  }, [textColor])
  useEffect(() => {
    updateActiveObject({ fontSize: fontSize })
  }, [fontSize])
  useEffect(() => {
    updateActiveObject({ fontFamily: fontFamily })
  }, [fontFamily])
  useEffect(() => {
    updateActiveObject({ fontWeight: isBold ? "bold" : "normal" })
  }, [isBold])
  useEffect(() => {
    updateActiveObject({ fontStyle: isItalic ? "italic" : "normal" })
  }, [isItalic])
  useEffect(() => {
    updateActiveObject({ underline: isUnderline })
  }, [isUnderline])

  const addTextToImage = () => {
    if (!fabricCanvasRef.current || !textInput.trim()) return
    const text = new fabric.Text(textInput, {
      left: 180,
      top: 120,
      fontFamily: fontFamily,
      fontSize: fontSize,
      fill: textColor,
      textAlign: "center",
      originX: "center",
      originY: "center",
      fontWeight: isBold ? "bold" : "normal",
      fontStyle: isItalic ? "italic" : "normal",
      underline: isUnderline,
    })
    fabricCanvasRef.current.add(text)
    fabricCanvasRef.current.setActiveObject(text)
    // setTextInput("") // Don't clear, keep it for editing
    setHasTextOnCanvas(true)
    fabricCanvasRef.current.renderAll()
  }

  const removeSelectedText = () => {
    if (!fabricCanvasRef.current) return
    const activeObject = fabricCanvasRef.current.getActiveObject()
    if (activeObject && activeObject.type === "text") {
      fabricCanvasRef.current.remove(activeObject)
      const textObjects = fabricCanvasRef.current
        .getObjects()
        .filter((obj) => obj.type === "text")
      setHasTextOnCanvas(textObjects.length > 0)
    }
  }

  const saveTextOverlay = () => {
    if (!fabricCanvasRef.current || selectedIdx === null) return

    // 1. Save Fabric State (JSON) for re-editing
    const json = fabricCanvasRef.current.toJSON()
    // Remove background image from JSON to avoid conflicts/bloat
    delete json.backgroundImage
    delete json.background

    setTextStates((prev) => {
      const copy = [...prev]
      copy[selectedIdx] = json
      return copy
    })

    // 2. Bake image for preview/printing
    // We need to bake text ON TOP OF the clean/filtered image (which is already set as canvas.backgroundImage)
    
    // Calculate multiplier to restore original resolution (e.g. 1800x1200) from small canvas (360x240)
    let multiplier = 1
    const bg = fabricCanvasRef.current.backgroundImage
    if (bg && bg instanceof fabric.Image && bg.width) {
       // bg.width is the original width of the image
       // canvas.width is 360
       multiplier = bg.width / (fabricCanvasRef.current.width || 360)
    } else {
       // Fallback: 1800 / 360 = 5
       multiplier = 5
    }

    const dataUrl = fabricCanvasRef.current.toDataURL({
      multiplier: multiplier,
      format: "jpeg",
      quality: 0.95,
    })

    setPhotos((prev) =>
      prev.map((photo, idx) => (idx === selectedIdx ? dataUrl : photo))
    )

    fabricCanvasRef.current.dispose()
    fabricCanvasRef.current = null
    // Don't reset hasTextOnCanvas instantly or logic might break if reused, but here we exit mode so it's fine.
    setHasTextOnCanvas(false)
  }



  type OverlayFilter = { id: string; name: string; src: string | null }
  const [overlayFilters, setOverlayFilters] = useState<OverlayFilter[]>([
    { id: "flt-none", name: translations[lang].noFilter, src: null },
  ])

  // Backend'den efekt (filtre) listesini çek
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await api.get(
          "/effects/getAllFilters/6825db80c30aaa768bc2e621"
        )
        const raw: any[] = res?.data?.data || []

        const mapped: OverlayFilter[] = raw.map((it: any, idx: number) => {
          const t = it?.translations?.[lang]
          const display =
            typeof t === "string"
              ? t
              : t?.name ?? it?.name ?? `Unnamed ${idx + 1}`

          return {
            id: String(it._id ?? it.id ?? `${display}-${idx}`),
            // 👇 her zaman string yap
            name: String(display),
            // boş/undefined linkleri null’a çevir ki UI fallback göstersin
            src: it?.imageLink ? String(it.imageLink) : null,
          }
        })

        if (!cancelled) {
          setOverlayFilters([
            { id: "flt-none", name: translations[lang].noFilter, src: null },
            ...mapped,
          ])
        }
      } catch (e) {
        console.error("Filters fetch failed", e)
        if (!cancelled) {
          setOverlayFilters([
            { id: "flt-none", name: translations[lang].noFilter, src: null },
          ])
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [lang])

  const stickers = ["😎", "😂", "🎉", "❤️", "🔥", "🥳", "🌟", "👑"]

  // Fotoğraf seçildiğinde o fotoğrafın son kullanılan filtresini oku
  useEffect(() => {
    if (selectedIdx !== null) {
      const photoBackground = photoBackgrounds[selectedIdx]
      setSelectedBg(photoBackground)
      if (photoBackground !== null) setIsBackgroundSelected(true)
      setSelectedFilter(photoFilters[selectedIdx] ?? null)
    }
  }, [selectedIdx, photoBackgrounds, photoFilters])

  // Text modu açılınca canvas kur
  useEffect(() => {
    if (mode === "text" && selectedIdx !== null) {
      initializeFabricCanvas()
    }
    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose()
        fabricCanvasRef.current = null
      }
    }
  }, [mode, selectedIdx])

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-orange-500 to-orange-300 flex py-3 px-4 md:px-12 lg:pl-24">
      {/* Back button */}
      <button
        onClick={() => router.push("/")}
        className="absolute top-4 left-4 p-2 bg-white/30 backdrop-blur-md rounded-full hover:bg-white/50 transition z-10"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      {/* Sayaç */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-orange-500 text-white rounded-xl px-5 py-3 flex items-center justify-center font-mono text-3xl whitespace-nowrap">
          {translations[lang].remainingTime} {remaining}s
        </div>
      </div>

      {/* SOL: Arkaplan paneli */}
      <div className="w-[30%] h-[95vh] bg-white/30 backdrop-blur-md rounded-2xl p-4 flex flex-col">
        <h2 className="text-white font-semibold mb-6 text-3xl">
          {translations[lang].backgroundsTitle}
        </h2>

        {/* 1) Kategori Seçimi */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[translations[lang].allCategory, ...bgCategories].map((cat) => (
            <button
              key={cat}
              onClick={() => {
                if (!isBackgroundSelected) setSelectedBgCategory(cat)
              }}
              disabled={isBackgroundSelected}
              className={`px-3 py-1 rounded-full text-lg font-semibold transition
                ${
                  selectedBgCategory === cat
                    ? "bg-orange-500 text-white font-semibold"
                    : isBackgroundSelected
                    ? "bg-gray-200/30 text-gray-500 cursor-not-allowed"
                    : "bg-gray-200/50 text-gray-800 hover:bg-white/40"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 2) "Arkaplan Yok" + liste */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-6 px-3 self-center">
            {/* "Arkaplan Yok" */}
            <div
              onClick={() => handleBackgroundSelect(null)}
              className={`w-full aspect-square flex bg-white/40 rounded-lg overflow-hidden transition border-2 relative
                ${
                  selectedBg === null && isBackgroundSelected
                    ? "border-orange-500 ring-2 ring-orange-300"
                    : "border-transparent"
                }
                ${
                  isBackgroundSelected && selectedBg !== null
                    ? "blur-sm opacity-60 cursor-not-allowed"
                    : "cursor-pointer hover:border-white/70"
                }`}
            >
              <span className="text-gray-800 text-center flex-1 flex items-center justify-center">
                {translations[lang].noBackground}
              </span>
              {selectedBg === null && isBackgroundSelected && (
                <div className="absolute top-2 right-2 bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  ✓
                </div>
              )}
            </div>

            {/* Arkaplanlar */}
            {displayedBackgrounds.map((url, index) => (
              <div
                key={url + index}
                onClick={() => handleBackgroundSelect(url)}
                className={`w-full aspect-square flex bg-gray-200/30 rounded-lg overflow-hidden transition border-2 relative
                  ${
                    selectedBg === url
                      ? "border-orange-500 ring-2 ring-orange-300"
                      : "border-transparent"
                  }
                  ${
                    isBackgroundSelected && selectedBg !== url
                      ? "blur-sm opacity-60 cursor-not-allowed"
                      : "cursor-pointer hover:border-white/70"
                  }`}
              >
                <img
                  src={url}
                  alt="Background option"
                  className="w-full h-full object-cover"
                />
                {selectedBg === url && (
                  <div className="absolute top-2 right-2 bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    ✓
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ORTA: Kamera / Fotoğraf */}
      <div className="flex-1 mx-4 mt-20 flex flex-col items-center space-y-4">
        <div className="w-full max-w-4xl aspect-[3/2] bg-gray-200/30 backdrop-blur-md rounded-2xl overflow-hidden relative">
          {selectedIdx === null ? (
            // isBackgroundSelected kontrolünü kaldırıyoruz, her zaman gösteriyoruz
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="hidden"
                />
                {/* 
                   Canvas'ı yeniden oluşturmak (remount) için key veriyoruz.
                   selectedBg!==null ise (worker mode) -> key="segmented"
                   selectedBg===null ise (raw mode)    -> key="raw"
                   Böylece worker için offscreen transfer edilmiş canvas ile, 
                   raw çizim için normal canvas birbirine karışmaz.
                */}
                <canvas
                  key={selectedBg !== null ? "segmented" : "raw"}
                  ref={previewCanvasRef}
                  className="w-full h-full object-cover"
                />
                {isCountingDown && countdown && (
                  <div className="absolute top-4 right-4 z-30">
                    <div className="countdown-display bg-black/20 backdrop-blur-xl text-white rounded-full w-20 h-20 flex items-center justify-center border-2 border-white/30 shadow-2xl">
                      <span className="text-4xl font-bold font-mono">
                        {countdown}
                      </span>
                    </div>
                  </div>
                )}
              </>
            
          ) : (
            <>
              <img
                src={photos[selectedIdx]}
                className={`w-full h-full object-cover transition-all duration-300 ${
                  isProcessing ? "blur-sm" : ""
                }`}
              />
              {isProcessing && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
                  <div className="bg-white/20 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-lg border border-white/40">
                    <div className="flex items-center gap-3">
                      <svg
                        className="animate-spin h-6 w-6 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        ></path>
                      </svg>
                      <span className="text-sm font-medium">
                        ✨ {translations[lang].processingYourPhoto}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="flex flex-col items-center gap-4 w-full">
          {/* Action Buttons */}
          <div className="flex gap-4 flex-wrap justify-center relative">
            {showStartShootingWarning && (
                <div className="absolute bottom-full mb-4 left-1/2 transform -translate-x-1/2 w-80 bg-black/80 backdrop-blur-md text-white text-center p-4 rounded-xl shadow-2xl border border-white/20 z-50 animate-fade-in-out">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-orange-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <span className="font-bold text-lg">Uyarı</span>
                  </div>
                  <p className="text-sm font-medium">
                    {translations[lang].startShootingWarning}
                  </p>
                </div>
            )}
            {selectedIdx === null ? (
              <button
                onClick={capture}
                disabled={
                  photos.length >= 1 ||
                  isProcessing ||
                  isCountingDown
                }
                className={`px-6 py-4 text-2xl font-semibold rounded-full shadow transition ${isCountingDown ? "hidden" : ""} ${
                  photos.length >= 1 ||
                  isProcessing ||
                  isCountingDown
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-white text-orange-600 hover:scale-105"
                }`}
              >
                {isCountingDown
                  ? ""
                  : isProcessing
                  ? translations[lang].processing
                  : photos.length >= 1
                  ? translations[lang].photoCaptured
                  : `${translations[lang].captureButton}`}
              </button>
            ) : (
              <>
                {retakeCount < maxRetakes && (
                  <div className="relative">
                    <button
                      onClick={retakePhoto}
                      className="px-6 py-4 text-2xl font-semibold bg-orange-500 text-white rounded-full shadow hover:scale-105 transition"
                    >
                      {translations[lang].retakeLeft} (
                      {maxRetakes - retakeCount})
                    </button>

                    {/* Info Button - Yeniden çekim butonunun sağ üstünde */}
                    <div className="absolute -top-2 -right-2">
                      <div className="relative">
                        <button
                          onClick={() => setShowInfoTooltip(!showInfoTooltip)}
                          className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-200"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </button>

                        {/* Tooltip */}
                        {showInfoTooltip && (
                          <div className="absolute bottom-full right-0 mb-2 w-80 bg-black/90 backdrop-blur-md text-white text-sm rounded-lg p-4 shadow-2xl border border-white/20 z-50">
                            <div className="relative">
                              <div className="text-center font-medium leading-relaxed">
                                {translations[lang].retakeInfoTooltip}
                              </div>
                              {/* Arrow */}
                              <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {retakeCount >= maxRetakes && (
                  <div className="px-6 py-4 text-xl font-semibold bg-blue-100 text-blue-800 rounded-full shadow">
                    {translations[lang].onlyEditingAllowed}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Photo Thumbnails */}
          <div className="flex gap-4 overflow-x-auto py-4 w-full justify-center">
            {photos.map((photo, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedIdx(idx)}
                className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-lg overflow-hidden cursor-pointer transition ${
                  selectedIdx === idx ? "ring-4 ring-orange-500" : ""
                }`}
              >
                <img src={photo} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SAĞ: Düzenleme paneli */}
      <div className="w-1/4 h-[95vh] bg-white/30 backdrop-blur-md rounded-2xl p-4 flex flex-col">
        {/* Menü */}
        {mode === "menu" && (
          <>
            <h2 className="text-white text-3xl font-semibold mb-6">
              {translations[lang].decorateTitle}
            </h2>

            <div className="flex flex-col gap-6 relative">
              {[
                {
                  id: "effect",
                  label: translations[lang].effectTab,
                  onClick: () => setMode("effect"),
                },
                {
                  id: "sticker",
                  label: translations[lang].stickerTab,
                  onClick: () => setMode("sticker"),
                },
                {
                  id: "text",
                  label: translations[lang].textTab,
                  onClick: () => setMode("text"),
                },
              ].map((btn) => {
                const isDisabled = photos.length === 0
                return (
                  <button
                    key={btn.id}
                    onClick={() => {
                      if (isDisabled) {
                        setShowStyleDisabledWarning(true)
                        if (warningTimeoutRef.current) {
                          clearTimeout(warningTimeoutRef.current)
                        }
                        warningTimeoutRef.current = setTimeout(() => {
                          setShowStyleDisabledWarning(false)
                        }, 4000)
                      } else {
                        btn.onClick()
                      }
                    }}
                    className={`w-[80%] self-center py-6 bg-white text-orange-600 rounded-full shadow transition text-2xl font-semibold relative
                      ${
                        isDisabled
                          ? "blur-sm opacity-60 cursor-not-allowed"
                          : "hover:scale-105"
                      }`}
                  >
                    {btn.label}
                  </button>
                )
              })}

              {/* Warning Message Overlay */}
              {showStyleDisabledWarning && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-[90%] mt-4 bg-black/80 backdrop-blur-md text-white text-center p-4 rounded-xl shadow-2xl border border-white/20 z-50 animate-fade-in-out">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-orange-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <span className="font-bold text-lg">Uyarı</span>
                  </div>
                  <p className="text-sm font-medium">
                    {translations[lang].selectPhotoToStyle}
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Continue Button */}
        {photos.length >= 1 &&
          mode === "menu" &&
          (retakeCount >= maxRetakes || selectedIdx !== null) && (
            <div className="mt-auto">
              <button
                onClick={() => {
                  try {
                    localStorage.setItem(CAPTURED_KEY, JSON.stringify(photos)) // ⬅️ fotolar
                    localStorage.setItem(PRINT_COUNT_KEY, String(photoCount)) // ⬅️ kaç çıktı
                  } catch {}
                  router.push(
                    `/print-share?orderId=${params.get(
                      "orderId"
                    )}&photoCount=${photoCount}`
                  )
                }}
                className="w-[80%] mx-auto block py-6 mb-6 bg-gradient-to-r from-orange-500 to-orange-300 text-white rounded-full shadow hover:scale-105 transition text-2xl font-semibold"
              >
                {translations[lang].proceedButton} ({photoCount} çıktı)
              </button>
            </div>
          )}

        {/* === YENİ: PNG Filtre Listesi (Effect sekmesi) === */}
        {mode === "effect" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white text-lg font-semibold">
                {translations[lang].selectEffectTitle}
              </h2>
              <button
                onClick={() => setMode("menu")}
                className="p-2 bg-white/30 backdrop-blur-md rounded-full hover:bg-white/50 transition cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 p-2">
              <div className="grid grid-cols-2 gap-4">
                {overlayFilters.map((f) => {
                  const active = selectedFilter === (f.src ?? null)
                  const disabled = selectedIdx === null
                  return (
                    <button
                      key={f.id}
                      onClick={() => applyFilterToCurrent(f.src ?? null)}
                      disabled={disabled}
                      className={`w-full aspect-square rounded-lg p-3 transition relative ${
                        disabled
                          ? "bg-white/30 cursor-not-allowed"
                          : "hover:ring-2 hover:ring-orange-500 bg-white/40"
                      } ${active ? "ring-2 ring-orange-500" : ""}`}
                    >
                      <div className="w-full h-full checker rounded-md overflow-hidden flex items-center justify-center">
                        {f.src ? (
                          <img
                            src={f.src}
                            alt={f.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="text-black/70 text-lg font-medium">
                            {translations[lang].noFilter ?? "Filtre Yok"}
                          </span>
                        )}
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 text-center text-sm font-medium text-black/80">
                        {f.name}
                      </div>
                      {active && (
                        <div className="absolute top-2 right-2 bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                          ✓
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-3">
              <button
                onClick={() => setMode("menu")}
                className="w-[80%] mx-auto block py-4 bg-gradient-to-r from-orange-500 to-orange-400 text-white rounded-full shadow hover:scale-105 transition text-xl font-semibold"
              >
                {translations[lang].backToMenu ?? "Menüye Dön"}
              </button>
            </div>
          </>
        )}

        {/* Sticker Listesi */}
        {mode === "sticker" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white text-lg font-semibold">
                {translations[lang].selectStickerTitle}
              </h2>
              <button
                onClick={() => setMode("menu")}
                className="p-2 bg-white/30 backdrop-blur-md rounded-full hover:bg-white/50 transition cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 p-2">
              <div className="grid grid-cols-2 gap-4">
                {stickers.map((st) => (
                  <button
                    key={st}
                    onClick={() => {}}
                    className="w-full aspect-square flex items-center bg-white/40 rounded-lg p-3 hover:ring-2 hover:ring-orange-500 transition text-2xl justify-center"
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Metin */}
        {mode === "text" && (
          <div className="relative h-full flex flex-col overflow-hidden">
            <div className="flex-none">
              <div className="flex justify-between items-center mb-1">
                <h2 className="text-white text-2xl font-bold">
                  {translations[lang].addTextTitle}
                </h2>
                <div className="flex gap-3 items-center">
                  {selectedIdx !== null && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (fabricCanvasRef.current) {
                            fabricCanvasRef.current.dispose()
                            fabricCanvasRef.current = null
                          }
                          setMode("menu")
                        }}
                        className="flex-1 py-3 px-4 bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-xl font-bold hover:from-red-600 hover:to-orange-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
                      >
                        ↩️ {translations[lang].cancelText}
                      </button>
                      <button
                        onClick={() => {
                          saveTextOverlay()
                          setMode("menu")
                        }}
                        disabled={!hasTextOnCanvas}
                        className={`py-2 px-3 rounded-lg font-medium transition-all duration-200 shadow-lg text-sm ${
                          hasTextOnCanvas
                            ? "bg-gradient-to-r from-orange-500 to-orange-400 text-white hover:from-orange-600 hover:to-orange-400 hover:scale-105"
                            : "bg-gray-400/50 text-gray-300 cursor-not-allowed"
                        }`}
                      >
                        💾 {translations[lang].saveText}
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => setMode("menu")}
                    className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/30 transition-all duration-200 cursor-pointer shadow-lg flex items-center justify-center flex-shrink-0"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>

              {selectedIdx !== null && (
                <>
                  <div className="mb-3 mt-4">
                    <input
                      type="text"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder={translations[lang].typeAwesome}
                      className="w-full bg-gradient-to-r from-white/30 to-white/20 backdrop-blur-md rounded-xl p-4 text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-white/50 border border-white/20 shadow-lg"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 border border-white/20">
                      <label className="text-white text-md font-semibold block mb-2">
                        {translations[lang].sizeLabel}{" "}
                        <span className="text-orange-500">({fontSize}px)</span>
                      </label>
                      <input
                        type="range"
                        min="12"
                        max="72"
                        value={fontSize}
                        onChange={(e) => setFontSize(parseInt(e.target.value))}
                        className="w-full h-2 bg-white/80 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>

                    <div className=" bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 ">
                      <div className="relative">
                        <div className="flex justify-center mb-3">
                          <div
                            className="w-12 h-12 rounded-full border-4 border-white/50 shadow-lg"
                            style={{ backgroundColor: textColor }}
                          ></div>
                        </div>
                        <input
                          type="color"
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                          className="w-full h-8 rounded-xl border-2 border-orange-300/50 cursor-pointer opacity-0 absolute inset-0"
                        />
                        <button
                          onClick={() =>
                            (
                              document.querySelector(
                                'input[type="color"]'
                              ) as HTMLInputElement
                            )?.click()
                          }
                          className="w-full py-2 bg-gradient-to-r from-orange-400/50 to-orange-400/50 backdrop-blur-sm rounded-xl border border-orange-300/40 text-white font-medium hover:from-orange-400/50 hover:to-orange-400/50 transition-all duration-200 hover:cursor-pointer"
                        >
                          {translations[lang].chooseColor}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 mt-2">
                    <div className="bg-white/20 backdrop-blur-md  rounded-2xl p-4 border border-orange-300/25 ">
                      <div className="flex gap-5 mb-4 px-2">
                        <button
                          onClick={() => setFontStyleView("font")}
                          className={`flex-1 py-2 px-4 rounded-xl font-semibold text-sm transition-all duration-200 ${
                            fontStyleView === "font"
                              ? "bg-gradient-to-r from-orange-500 to-orange-500 text-white shadow-lg transform scale-105"
                              : "bg-white/70 text-gray-600/80 hover:bg-white/30"
                          }`}
                        >
                          {translations[lang].fontTab}
                        </button>
                        <button
                          onClick={() => setFontStyleView("style")}
                          className={`flex-1 py-2 px-4 rounded-xl font-semibold text-sm transition-all duration-200 ${
                            fontStyleView === "style"
                              ? "bg-gradient-to-r from-orange-500 to-orange-500 text-white shadow-lg transform scale-105"
                              : "bg-white/70 text-gray-600/80 hover:bg-white/30"
                          }`}
                        >
                          {translations[lang].styleTab}
                        </button>
                      </div>

                      {fontStyleView === "font" ? (
                        <div>
                          <select
                            value={fontFamily}
                            onChange={(e) => setFontFamily(e.target.value)}
                            className="w-full bg-gradient-to-r from-orange-500/40 to-orange-500/30 backdrop-blur-md rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-400/50 border border-orange-300/30 shadow-lg font-medium"
                          >
                            <option
                              value="Arial"
                              className="text-gray-800 bg-white"
                            >
                              Arial
                            </option>
                            <option
                              value="Times New Roman"
                              className="text-gray-800 bg-white"
                            >
                              Times New Roman
                            </option>
                            <option
                              value="Helvetica"
                              className="text-gray-800 bg-white"
                            >
                              Helvetica
                            </option>
                            <option
                              value="Georgia"
                              className="text-gray-800 bg-white"
                            >
                              Georgia
                            </option>
                            <option
                              value="Verdana"
                              className="text-gray-800 bg-white"
                            >
                              Verdana
                            </option>
                          </select>
                        </div>
                      ) : (
                        <div>
                          <div className="grid grid-cols-3 gap-3">
                            <button
                              onClick={() => setIsBold(!isBold)}
                              className={`py-3 px-2 rounded-xl font-bold text-sm transition-all duration-200 shadow-lg ${
                                isBold
                                  ? "bg-gradient-to-r from-orange-500 to-orange-500 text-white transform scale-105"
                                  : "bg-white/70 text-gray-600/80 hover:bg-white/30"
                              }`}
                            >
                              <span className="font-bold">B</span>
                              <div className="text-xs mt-1">
                                {translations[lang].boldText}
                              </div>
                            </button>
                            <button
                              onClick={() => setIsItalic(!isItalic)}
                              className={`py-3 px-2 rounded-xl font-bold text-sm transition-all duration-200 shadow-lg ${
                                isItalic
                                  ? "bg-gradient-to-r from-orange-500 to-orange-500 text-white transform scale-105"
                                  : "bg-white/70 text-gray-600/80 hover:bg-white/30"
                              }`}
                            >
                              <span className="italic font-bold">I</span>
                              <div className="text-xs mt-1">
                                {translations[lang].italicText}
                              </div>
                            </button>
                            <button
                              onClick={() => setIsUnderline(!isUnderline)}
                              className={`py-3 px-2 rounded-xl font-bold text-sm transition-all duration-200 shadow-lg ${
                                isUnderline
                                  ? "bg-gradient-to-r from-orange-500 to-orange-500 text-white transform scale-105"
                                  : "bg-white/70 text-gray-600/80 hover:bg-white/30"
                              }`}
                            >
                              <span className="underline font-bold">U</span>
                              <div className="text-xs mt-1">
                                {translations[lang].underText}
                              </div>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 ">
                    <button
                      onClick={addTextToImage}
                      disabled={!textInput.trim()}
                      className={`flex-1 py-3 px-4 rounded-xl font-bold text-white transition-all duration-200 shadow-lg ${
                        textInput.trim()
                          ? "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transform hover:scale-105"
                          : "bg-gray-400/50 cursor-not-allowed"
                      }`}
                    >
                      {translations[lang].addTextButton}
                    </button>
                    <button
                      onClick={removeSelectedText}
                      className="flex-1 py-3 px-4 bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-xl font-bold hover:from-red-600 hover:to-orange-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
                    >
                      {translations[lang].removeTextButton}
                    </button>
                  </div>
                </>
              )}
            </div>

            {selectedIdx !== null ? (
              <div className="flex-1 min-h-0 flex items-center justify-center mt-3 relative">
                 <div ref={previewContainerRef} className=" w-full h-full flex items-center justify-center">
                    <div
                      ref={fabricContainerRef}
                      style={{ 
                        transform: `scale(${previewScale})`,
                        width: 360,
                        height: 240
                      }}
                      className="origin-center bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md rounded-2xl border-2 border-white/30 shadow-2xl overflow-hidden flex items-center justify-center shrink-0"
                    >
                      <canvas id="text-canvas" className="rounded-xl" />
                    </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
                  <div className="text-6xl mb-4">🖼️</div>
                  <p className="text-gray-700 text-lg font-medium">
                    {translations[lang].selectPhotoFirst}
                  </p>
                  <p className="text-gray-600 text-sm mt-2">
                    {translations[lang].chooseFromThumbnails}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Background Selection Confirmation Modal */}
      {showBackgroundConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 max-w-md mx-4 shadow-2xl border border-white/20">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                {translations[lang].confirmBackgroundSelection}
              </h3>

              <div className="mb-6">
                {pendingBackgroundSelection ? (
                  <div className="w-32 h-32 mx-auto rounded-lg overflow-hidden border-2 border-orange-300">
                    <img
                      src={pendingBackgroundSelection}
                      alt="Seçilen arka plan"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-32 h-32 mx-auto rounded-lg bg-gray-200/50 border-2 border-orange-300 flex items-center justify-center">
                    <span className="text-gray-600 text-sm text-center">
                      {translations[lang].noBackgroundSelected}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-gray-600 mb-6 text-lg">
                {translations[lang].confirmBackgroundMessage}
                <br />
                <span className="text-sm text-orange-600 font-semibold">
                  {translations[lang].selectionFinal}
                </span>
              </p>

              <div className="flex gap-4">
                <button
                  onClick={cancelBackgroundSelection}
                  className="flex-1 py-3 px-6 bg-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-400 transition-all duration-200"
                >
                  {translations[lang].cancel}
                </button>
                <button
                  onClick={confirmBackgroundSelection}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-orange-500 to-orange-400 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-orange-500 transition-all duration-200"
                >
                  {translations[lang].confirm}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PhotoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-orange-500 to-orange-300 flex items-center justify-center">
          <div className="text-white text-xl">Loading...</div>
        </div>
      }
    >
      <PhotoPageContent />
    </Suspense>
  )
}
