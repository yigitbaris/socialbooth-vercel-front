// app/photo/selfie/page.tsx
"use client"
import React, { useState, useRef, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import BgModal from "@/app/components/SelfieBackgroundModal"
import SelfieEffectModal from "@/app/components/SelfieEffectModal"
import api from "@/app/utils/api"
import { toast } from "react-toastify"

type PhotoItem = {
  id: string // Fotoğraf ID (veritabanı ID’si)
  url: string // Görüntülenecek URL
}

function SelfiePageContent() {
  const router = useRouter()
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null) //seçili fotoğraf indeksi

  // Arka plan modalı
  const [showBg, setShowBg] = useState(false)

  // efekt ekleme modalı
  const [showEffects, setShowEffects] = useState(false)

  // overlayVisible: whether Sticker/Text overlay is open
  const [overlayVisible, setOverlayVisible] = useState(false)
  const [mode, setMode] = useState<"sticker" | "text">("sticker") //sticker veya text ekleme alanı gösterimi

  const [selectedSticker, setSelectedSticker] = useState<string | null>(null) //seçili sticker
  const [selectedFrame, setSelectedFrame] = useState<string | null>(null) //seçili arka plan
  const [selectedEffect, setSelectedEffect] = useState<string | null>(null) //seçili efekt
  const [enteredText, setEnteredText] = useState("") //girilen metin

  // Örnek sticker ve frame listeleri
  const stickers = ["😎", "😂", "🎉", "🌟", "❤️", "🥳", "👑", "🔥"]

  //! EKLENEN KISIMLAR
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const orderId = useSearchParams().get("orderId")

  console.log("photos:", photos)

  useEffect(() => {
    const openCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch (err) {
        toast.error("Kameraya erişilemedi.")
        console.error(err)
      }
    }

    // Kamera sadece görüntü aktifse açılmalı
    if (selectedIdx === null) {
      openCamera()
    }

    return () => {
      if (videoRef.current?.srcObject) {
        ;(videoRef.current.srcObject as MediaStream)
          .getTracks()
          .forEach((track) => track.stop())
        videoRef.current.srcObject = null
      }
    }
  }, [selectedIdx])

  const capture = async () => {
    if (!videoRef.current || !canvasRef.current) return

    const ctx = canvasRef.current.getContext("2d")
    if (!ctx) return

    canvasRef.current.width = videoRef.current.videoWidth
    canvasRef.current.height = videoRef.current.videoHeight

    ctx.drawImage(
      videoRef.current,
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    )

    const base64 = canvasRef.current.toDataURL("image/jpeg")

    const blob = await fetch(base64).then((res) => res.blob())
    const file = new File([blob], "photo.jpg", { type: "image/jpeg" })

    const formData = new FormData()
    formData.append("photo", file) // ✅ "photo" key'ini backend ile uyumlu hale getiriyoruz

    try {
      const response = await api.post(`/orders/addPhoto/${orderId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      if (response.data.success) {
        const uploadedImageUrl = response.data.data.imageUrl // Backend'den dönen resim URL'si
        const uploadedImageId = response.data.data._id
        setPhotos((prev) => [
          ...prev,
          { id: uploadedImageId, url: uploadedImageUrl },
        ])
        // Fotoğrafı state'e ekleyelim
      } else {
        toast.error("Fotoğraf yüklenemedi: " + response.data.msg)
      }
    } catch (err) {
      toast.error("Fotoğraf yüklenirken hata oluştu.")
      console.error(err)
    }
  }

  const handleRetake = () => {
    setSelectedIdx(null) // Kamera aktif olsun
    // Kamera zaten açık olduğu için ekstra bir şey yapmana gerek yok
  }

  // // Fotoğraf çek / yeniden çek
  // const capture = () => {
  //   if (selectedIdx === null) {
  //     setPhotos((prev) => [...prev, prev.length + 1]);
  //   } else {
  //     setSelectedIdx(null);
  //   }
  // };

  //! Fotoğraf kaldır
  const removePhoto = async () => {
    if (selectedIdx == null) return

    const photoToDelete = photos[selectedIdx]
    const photoId = photoToDelete.id

    try {
      await api.delete(`/products/deleteProduct/${photoId}`)

      // Frontend'den de kaldır
      const updatedPhotos = [...photos]
      updatedPhotos.splice(selectedIdx, 1)
      setPhotos(updatedPhotos)
      setSelectedIdx(null)
    } catch (err) {
      console.error("Fotoğraf silinirken hata:", err)
      toast.error("Fotoğraf silinirken bir hata oluştu.")
    }
  }

  //! Ödeme sayfasına yönlendir
  const prepareForPayment = async () => {
    if (!orderId) {
      toast.error("Sipariş ID bulunamadı! Önce sipariş oluşturulmalı.")
      return
    }

    try {
      const response = await api.put(`/orders/complateOrder/${orderId}`)

      if (response.data.success) {
        console.log("Sipariş ödeme aşamasına hazır:", response.data.data)
        router.push(`/payment?orderId=${orderId}`)
      } else {
        toast.error("Sipariş hazırlanamıyor: " + response.data.msg)
      }
    } catch (error) {
      console.error("Ödeme aşamasına geçerken hata oluştu:", error)
      toast.error("Bir hata oluştu.")
    }
  }

  //! İşlem yapılmazsa önceki sayfaya geri dön
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      router.back()
    }, 240_000) // 240,000 ms = 240 seconds

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [router])

  //! Fotoğrafları çekelim
  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const response = await api.get(`/orders/getOrder/${orderId}`)
        if (response.data.success) {
          const photoData = response.data.data.products.map((product: any) => ({
            id: product._id,
            url: product.imageUrl,
          }))
          setPhotos(photoData) // ✅ State'e fotoğrafları tekrar yükle
        } else {
          console.error("Fotoğraflar getirilemedi:", response.data.msg)
        }
      } catch (error) {
        console.error("API isteğinde hata oluştu:", error)
      }
    }

    if (orderId) fetchPhotos()
  }, [orderId]) // ✅ orderId değiştiğinde API çağrısı yap

  return (
    <>
      {/* Background Modal */}
      <BgModal
        show={showBg}
        onClose={() => setShowBg(false)}
        selectedFrame={selectedFrame}
        onSelect={(bgId) => {
          setSelectedFrame(bgId)
          setShowBg(false)
        }}
      />
      {/* Effects Modal */}
      <SelfieEffectModal
        show={showEffects}
        onClose={() => setShowEffects(false)}
        selectedEffect={selectedEffect}
        onSelect={(effectId) => {
          setSelectedEffect(effectId)
          setShowEffects(false)
        }}
      />

      <div className="relative min-h-screen bg-gradient-to-br from-pink-500 to-orange-200 flex flex-col items-center p-6 space-y-4">
        {/* Back button */}
        <button
          onClick={() => router.push("/")}
          className="absolute top-4 left-4 p-2 bg-white/30 backdrop-blur-md rounded-full hover:bg-white/50 transition"
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

        {/* Camera Preview */}
        {/* <div className="w-full max-w-lg aspect-square bg-gray-200/50 rounded-2xl flex items-center justify-center">
          <span className="text-white/70 text-lg">
            {selectedIdx == null
              ? "Camera Preview"
              : `Fotoğraf Önizleme ${selectedIdx + 1}`}
            {selectedFrame && ` - seçili arka plan ${selectedFrame}`}
            {selectedEffect && ` - seçili efekt ${selectedEffect}`}
          </span>
        </div> */}

        <div className="w-full max-w-lg aspect-square bg-gray-200/50 rounded-2xl flex items-center justify-center relative overflow-hidden">
          {selectedIdx == null ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute top-0 left-0 w-full h-full object-cover rounded-2xl"
            />
          ) : (
            <img
              src={`http://booth-api.cloud.solucharger.com${photos[selectedIdx].url}`}
              alt={`Fotoğraf ${selectedIdx + 1}`}
              className="absolute top-0 left-0 w-full h-full object-cover rounded-2xl"
            />
          )}
          <canvas ref={canvasRef} className="hidden" />
          <span className="text-white/70 text-lg z-10">
            {selectedIdx == null
              ? "Camera Preview"
              : `Fotoğraf ${selectedIdx + 1}`}
          </span>
        </div>

        {/* Capture / Background Buttons */}
        <div className="flex gap-4 mt-2">
          <button
            onClick={selectedIdx == null ? capture : handleRetake}
            className="px-8 py-3 bg-white text-pink-600 rounded-full shadow hover:scale-105 transition"
          >
            {selectedIdx == null ? "Fotoğraf Çek" : "Yeni Fotoğraf Çek"}
          </button>

          {selectedIdx != null && (
            <button
              onClick={removePhoto}
              className="px-6 py-3 bg-red-500 text-white rounded-full shadow hover:scale-105 transition"
            >
              Kaldır
            </button>
          )}
          {photos.length > 0 && (
            <button
              onClick={prepareForPayment}
              className="
            px-6 py-3 
            bg-gradient-to-r from-pink-500  to-orange-300 
            text-white font-semibold 
            rounded-full shadow-lg 
            transform transition 
            hover:scale-105 hover:shadow-2xl
            "
            >
              Devam Et
            </button>
          )}
        </div>

        {/* Sticker / Text Buttons (only when a photo is selected & no overlay) */}
        {selectedIdx != null && !overlayVisible && (
          <div className="flex gap-4 pb-2">
            <button
              onClick={() => setShowBg(true)}
              className="px-6 py-3 bg-white text-pink-600 rounded-full shadow hover:scale-105 transition"
            >
              Arka Plan
            </button>
            <button
              onClick={() => {
                setShowEffects(true)
              }}
              className="px-6 py-3 bg-white text-pink-600 rounded-full shadow hover:bg-white/50 transition"
            >
              Efekt Ekle
            </button>
            <button
              onClick={() => {
                setMode("sticker")
                setOverlayVisible(true)
              }}
              className="px-6 py-3 bg-white text-pink-600 rounded-full shadow hover:bg-white/50 transition"
            >
              Sticker Ekle
            </button>
            <button
              onClick={() => {
                setMode("text")
                setOverlayVisible(true)
              }}
              className="px-6 py-3 bg-white text-pink-600 rounded-full shadow hover:bg-white/50 transition"
            >
              Metin Ekle
            </button>
          </div>
        )}

        {overlayVisible && (
          <div className="w-full max-w-lg space-y-4">
            {/* Tabs */}
            <div className="flex bg-white/30 backdrop-blur-md rounded-xl overflow-hidden">
              <button
                onClick={() => setMode("sticker")}
                className={`flex-1 py-2 text-center transition ${
                  mode === "sticker"
                    ? "bg-white/50 text-pink-600 font-bold"
                    : "text-white/100 hover:bg-white/40"
                }`}
              >
                Sticker
              </button>
              <button
                onClick={() => setMode("text")}
                className={`flex-1 py-2 text-center transition ${
                  mode === "text"
                    ? "bg-white/50 text-pink-600 font-bold"
                    : "text-white/100 hover:bg-white/40"
                }`}
              >
                Metin Ekle
              </button>
            </div>

            {/* Panel */}
            {mode === "sticker" ? (
              <div className="bg-white/30 backdrop-blur-md rounded-xl shadow-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-white text-lg font-medium mb-2">
                    Sticker Seç
                  </h2>
                  {/* Header with Close + Confirm */}
                  <div className="flex justify-center items-center gap-3 px-2">
                    {/* Close */}
                    <button
                      onClick={() => setOverlayVisible(false)}
                      className="p-2 bg-red-500 backdrop-blur-md rounded-full hover:bg-red-600 transition"
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                    {/* Confirm */}
                    <button
                      onClick={() => setOverlayVisible(false)}
                      className="px-4 py-2 bg-gradient-to-r from-pink-500  to-orange-500 text-white font-semibold rounded-full shadow-lg hover:opacity-90 hover:scale-105 transition hover:cursor-pointer"
                    >
                      Ekle
                    </button>
                  </div>
                </div>
                <div className="flex gap-4 py-2 overflow-x-auto">
                  {stickers.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setSelectedSticker(emoji)}
                      className={`w-24 h-24 bg-white/30 rounded-md flex items-center justify-center text-2xl flex-shrink-0 transition ${
                        selectedSticker === emoji
                          ? "ring-4 ring-white shadow-lg"
                          : "hover:ring-2 hover:ring-white/70"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white/30 backdrop-blur-md rounded-xl shadow-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-white text-lg font-medium mb-2">
                    Metin Ekle
                  </h2>
                  {/* Header with Close + Confirm */}
                  <div className="flex justify-center items-center gap-3 px-2">
                    {/* Close */}
                    <button
                      onClick={() => setOverlayVisible(false)}
                      className="p-2 bg-red-500 backdrop-blur-md rounded-full hover:bg-red-600 transition"
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                    {/* Confirm */}
                    <button
                      onClick={() => setOverlayVisible(false)}
                      className="px-4 py-2 bg-gradient-to-r from-pink-500  to-orange-500 text-white font-semibold rounded-full shadow-lg hover:opacity-90 hover:scale-105 transition hover:cursor-pointer"
                    >
                      Ekle
                    </button>
                  </div>
                </div>
                <textarea
                  value={enteredText}
                  onChange={(e) => setEnteredText(e.target.value)}
                  className="w-full h-32 p-2 rounded-md text-black border-0 ring-0"
                  placeholder="Buraya yazın…"
                />
              </div>
            )}
          </div>
        )}

        {/* Photo Thumbnails */}
        {!overlayVisible && photos.length > 0 && (
          <div className="w-full max-w-3xl overflow-x-auto bg-gray-200/50 rounded-2xl py-6 px-4">
            <div className="flex gap-4">
              <div className="pl-2" />
              {photos.map((_, idx) => (
                <div key={idx} className="relative flex-shrink-0">
                  <span className="absolute top-1 left-1 text-xs font-bold text-white bg-black/50 px-1 rounded">
                    {idx + 1}/10
                  </span>

                  {/* Gradient ring wrapper when selected */}
                  <div
                    className={`rounded-lg transition ${
                      selectedIdx === idx
                        ? "p-1 bg-gradient-to-r from-pink-500 via-orange-300 to-yellow-500"
                        : ""
                    }`}
                  >
                    <div
                      onClick={() => setSelectedIdx(idx)}
                      className={`w-36 h-36 rounded-lg cursor-pointer overflow-hidden transition ${
                        selectedIdx === idx
                          ? "ring-2 ring-pink-500"
                          : "border-2 border-transparent hover:border-white/70"
                      }`}
                    >
                      <img
                        src={`http://booth-api.cloud.solucharger.com${photos[idx].url}`}
                        alt={`Fotoğraf ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <div className="pr-2" />
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default function SelfiePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-orange-500 to-orange-300 flex items-center justify-center">
          <div className="text-white text-xl">Loading...</div>
        </div>
      }
    >
      <SelfiePageContent />
    </Suspense>
  )
}
