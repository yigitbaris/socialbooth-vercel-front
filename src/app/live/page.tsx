"use client"
//live page
import { useEffect, useRef, useState } from "react"

type BgItem = { id: string; label: string; url: string }

const BACKGROUNDS: BgItem[] = [
  {
    id: "studio",
    label: "Studio Gray",
    url: "https://images.pexels.com/photos/17978501/pexels-photo-17978501.jpeg?auto=compress&cs=tinysrgb&w=1280&h=720&dpr=1",
  },
  {
    id: "purple",
    label: "Purple Gradient",
    url: "https://images.pexels.com/photos/213958/pexels-photo-213958.jpeg?auto=compress&cs=tinysrgb&w=1280&h=720&dpr=1",
  },
]

export default function LiveLocal() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const workerRef = useRef<Worker | null>(null)
  const startedRef = useRef(false)
  const offscreenDoneRef = useRef(false)

  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<{ personIdx?: number; labels?: string[] }>(
    {}
  )
  const [activeBg, setActiveBg] = useState<string>(BACKGROUNDS[0].id)
  const [bgLoading, setBgLoading] = useState(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    let stream: MediaStream | null = null
    let cancelled = false

    ;(async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: false,
        })

        const v = videoRef.current!
        v.srcObject = stream
        v.muted = true
        v.playsInline = true
        ;(v as any).autoplay = true

        await new Promise<void>((res) => {
          if (v.readyState >= 1) res()
          else v.onloadedmetadata = () => res()
        })
        try {
          await v.play()
        } catch (err: any) {
          const msg = err?.message || String(err)
          if (!msg.includes("interrupted by a new load request")) throw err
        }
        if (cancelled) return

        if (!offscreenDoneRef.current) {
          const offscreen = canvasRef.current!.transferControlToOffscreen()
          offscreenDoneRef.current = true

          workerRef.current = new Worker(
            new URL("./segment-worker.ts", import.meta.url),
            { type: "module" }
          )

          workerRef.current.onmessage = (ev: MessageEvent) => {
            const { type, error: errMsg, labels, personIdx } = ev.data || {}
            if (type === "ready") {
              pump()
            } else if (type === "error") {
              setError(errMsg || "Worker init failed")
              // pompayı yine de çalıştır
              pump()
            } else if (type === "info") {
              if (labels) setInfo({ labels, personIdx })
            } else if (type === "bg-loading") {
              setBgLoading(true)
            } else if (type === "bg-ready") {
              setBgLoading(false)
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

          const initial = BACKGROUNDS.find((b) => b.id === activeBg)!
          workerRef.current.postMessage({
            type: "setBackground",
            url: initial.url,
          })
        }

        const pump = async () => {
          if (cancelled) return
          const v = videoRef.current!
          const frame = await createImageBitmap(v)
          workerRef.current?.postMessage({ type: "frame", frame }, [frame])
          if ("requestVideoFrameCallback" in v) {
            ;(v as any).requestVideoFrameCallback(pump)
          } else {
            setTimeout(pump, 16)
          }
        }
      } catch (e: any) {
        setError(e?.message || String(e))
      }
    })()

    return () => {
      cancelled = true
      workerRef.current?.terminate()
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const handleBgClick = (bg: BgItem) => {
    setActiveBg(bg.id)
    setBgLoading(true)
    workerRef.current?.postMessage({ type: "setBackground", url: bg.url })
  }

  return (
    <div className="p-6 space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <video
          ref={videoRef}
          muted
          playsInline
          className="w-full rounded-xl bg-black"
        />
        <canvas
          ref={canvasRef}
          width={1280}
          height={1000}
          className="w-full rounded-xl bg-black"
        />
      </div>

      <div className="mt-2">
        <p className="text-sm text-gray-200 mb-2">
          Arka plan seç {bgLoading ? "(yükleniyor…)" : ""}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {BACKGROUNDS.map((bg) => (
            <button
              key={bg.id}
              onClick={() => handleBgClick(bg)}
              disabled={bgLoading}
              className={`relative rounded-lg overflow-hidden border transition ${
                activeBg === bg.id
                  ? "border-indigo-500 ring-2 ring-indigo-300"
                  : "border-gray-300 hover:border-gray-400"
              } ${bgLoading ? "opacity-70 cursor-wait" : ""}`}
              title={bg.label}
            >
              <img
                src={bg.url}
                alt={bg.label}
                className="h-24 w-full object-cover"
              />
              <span className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-xs px-2 py-1">
                {bg.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">Hata: {error}</p>}
      {info?.labels && (
        <p className="text-xs text-gray-400">
          personIdx: {info.personIdx} • labels: {info.labels.join(", ")}
        </p>
      )}
    </div>
  )
}
