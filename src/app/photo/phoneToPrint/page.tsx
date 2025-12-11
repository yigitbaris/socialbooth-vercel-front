"use client"
import React, { Suspense, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import api, { baseUrl } from "@/app/utils/api"
import { QRCodeCanvas } from "qrcode.react"

type Step = "qr"
type UploadedPreview = { originalName: string; dataUrl: string }

export default function PhoneToPrintPage() {
  return (
    <Suspense fallback={<PhoneToPrintFallback />}>
      <PhoneToPrintContent />
    </Suspense>
  )
}

const PhoneToPrintFallback = () => (
  <div className="relative min-h-screen bg-gradient-to-br from-orange-500 to-orange-300 p-6 flex items-center justify-center text-white/80">
    Parametreler yükleniyor…
  </div>
)

function PhoneToPrintContent() {
  const router = useRouter()
  const params = useSearchParams()
  const urlOrderId = params.get("orderId") || ""
  const urlPhotoCount = params.get("photoCount")

  const [step] = useState<Step>("qr") // QR-first
  const [orderId, setOrderId] = useState<string>("")
  const [count, setCount] = useState<number>(1)
  const [slotId, setSlotId] = useState<string>("")
  const [qrUrl, setQrUrl] = useState<string>("")
  const [previews, setPreviews] = useState<UploadedPreview[]>([])
  const esRef = useRef<EventSource | null>(null)

  // helper: file URL → dataURL (print-share dataURL'i direkt render eder)
  const toDataUrl = async (fileUrl: string) => {
    const res = await fetch(fileUrl, { credentials: "include" })
    const blob = await res.blob()
    return await new Promise<string>((resolve) => {
      const fr = new FileReader()
      fr.onloadend = () => resolve(String(fr.result))
      fr.readAsDataURL(blob)
    })
  }

  const attachSSE = (slot: string) => {
    // önceki EventSource'u kapat
    if (esRef.current) {
      esRef.current.close()
      esRef.current = null
    }
    const es = new EventSource(
      `http://booth-api.cloud.solucharger.com/api/v1/phoneToPrint/subscribe/${slot}`
    )

    es.onopen = () => {
      console.log("SSE connection opened for slot:", slot)
    }

    es.onmessage = async (m) => {
      try {
        console.log("SSE message received:", m.data)
        const data = JSON.parse(m.data)
        if (data?.type === "connected") {
          console.log("SSE connected to slot:", data.slotId)
        } else if (data?.type === "uploaded" && Array.isArray(data.files)) {
          console.log("Files uploaded:", data.files)
          // backend artık publicUrl veriyor → direkt kullan
          const next = data.files.map((f: any) => ({
            originalName: f.originalName || "image",
            // backend zaten /static/... veriyor; tam URL oluştur
            dataUrl: f.publicUrl?.startsWith("http")
              ? f.publicUrl
              : `http://booth-api.cloud.solucharger.com${f.publicUrl}`,
          }))
          console.log("Setting previews:", next)
          setPreviews(next)
        }
      } catch (e) {
        console.error("SSE parse error:", e)
      }
    }
    es.onerror = (e) => {
      console.warn("SSE error", e)
      // SSE bağlantısı koptuğunda yeniden bağlanmayı dene
      setTimeout(() => {
        if (esRef.current?.readyState === EventSource.CLOSED) {
          console.log("Reconnecting SSE...")
          attachSSE(slot)
        }
      }, 3000)
    }
    esRef.current = es
  }

  const createSlot = async (ord?: string) => {
    setPreviews([])
    const s = await api.post("/phoneToPrint/create-slot", {
      orderId: ord || null,
    })

    setSlotId(s.data.data.slotId)
    setQrUrl(s.data.data.qrUrl)
    attachSSE(s.data.data.slotId)
  }

  // ilk yükleme: orderId & count kararını ver, slot oluştur, QR göster
  useEffect(() => {
    setOrderId(urlOrderId || "")
    setCount(Number.parseInt(urlPhotoCount || "1"))
    createSlot(urlOrderId || undefined)
    return () => {
      if (esRef.current) esRef.current.close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlOrderId, urlPhotoCount])

  // yeniden yükleme isterse: slotu sıfırla & yeni QR
  const resetAndRecreateSlot = async () => {
    try {
      if (esRef.current) {
        esRef.current.close()
        esRef.current = null
      }
    } catch {}
    await createSlot(orderId || undefined)
  }

  // Onay → print-share (backend'e print yok)
  const confirmAndGo = async () => {
    try {
      // print-share localStorage protokolü:
      // - capturedPhotos: string[] (dataURL veya relative URL)
      // - printCount: string
      localStorage.setItem(
        "capturedPhotos",
        JSON.stringify(previews.map((p) => p.dataUrl))
      )
      localStorage.setItem("printCount", String(count))
    } catch (e) {
      console.error("localStorage set error", e)
    }
    const q = new URLSearchParams()
    if (orderId) q.set("orderId", orderId)
    q.set("photoCount", String(count))
    router.push(`/print-share?${q.toString()}`)
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-orange-500 to-orange-300 p-6">
      {/* QR & Bekleme */}
      {step === "qr" && (
        <div className="mx-auto max-w-3xl bg-white/30 backdrop-blur-md rounded-2xl p-6 flex flex-col items-center">
          <h2 className="text-white text-2xl font-bold mb-2">
            Telefonundan Fotoğraf Yükle
          </h2>
          <p className="text-white/80 mb-4 text-center">
            1) QR'ı okut • 2) Açılan sayfadan fotoğraf(lar)ını yükle • 3) Burada
            önizle ve onayla
          </p>

          {/* QR */}
          <div className="flex flex-col items-center gap-3">
            {qrUrl ? (
              <QRCodeCanvas value={qrUrl} size={256} includeMargin />
            ) : (
              <div className="text-white/80">QR hazırlanıyor…</div>
            )}
            {qrUrl && (
              <a
                href={qrUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white underline text-sm break-all"
              >
                {qrUrl}
              </a>
            )}
            <div className="text-white/70 text-sm">
              {orderId ? `Sipariş #${orderId}` : "Geçici sipariş"}
              {" • "}Adet: {count}
            </div>
          </div>

          {/* Gelen Fotoğraflar */}
          <div className="mt-6 w-full">
            <h3 className="text-white font-semibold mb-2">
              Gelen Dosyalar ({previews.length})
            </h3>

            {previews.length > 0 ? (
              <>
                <div className="grid grid-cols-3 gap-3">
                  {previews.map((p, i) => (
                    <div
                      key={i}
                      className="bg-white/70 rounded-lg p-2 text-sm flex flex-col items-center"
                    >
                      <img
                        src={p.dataUrl}
                        alt={p.originalName}
                        className="w-full rounded-md"
                      />
                      <div className="mt-2 text-gray-700 truncate w-full text-center">
                        {p.originalName}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={resetAndRecreateSlot}
                    className="px-4 py-2 bg-white/30 rounded-full text-white hover:bg-white/40 transition"
                  >
                    Sil & Tekrar Yükle
                  </button>
                  <button
                    onClick={confirmAndGo}
                    className="px-6 py-2 bg-white text-orange-600 rounded-full"
                  >
                    Onayla ve Yazdır ({count})
                  </button>
                </div>
              </>
            ) : (
              <div className="p-4 rounded-lg bg-white/20 text-white/90">
                Henüz fotoğraf gelmedi. Yükleme tamamlanınca burada önizleme
                göreceksin.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
