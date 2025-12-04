// app/print-share/page.tsx
"use client"

import React, { useEffect, useRef, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import api from "../utils/api"
import { translations } from "../utils/translations"
import { useGlobalContext } from "../context/GlobalContext"
import Lottie from "lottie-react"
import FramedPhoto from "../components/FramedPhoto"

function AnimatedDots({
  baseText,
  className,
}: {
  baseText: string
  className?: string
}) {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    const seq = setInterval(() => {
      setIndex((prev) => (prev + 1) % 3)
    }, 600)
    return () => clearInterval(seq)
  }, [])
  const dots = index === 0 ? "." : index === 1 ? ".." : "..."
  return (
    <div className={className}>
      {baseText} {dots}
    </div>
  )
}

function PrintSharePageContent() {
  const router = useRouter()
  const { lang } = useGlobalContext()
  const searchParams = useSearchParams()

  const orderId = searchParams.get("orderId")
  // PhotoCount'u parametre olarak al, fallback localStorage'dan
  const photoCount = parseInt(
    searchParams.get("photoCount") || localStorage.getItem("printCount") || "1"
  )

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const photosLoadedRef = useRef(false)
  const [photos, setPhotos] = useState<{ id: string; url: string }[]>([])
  const [showIntro, setShowIntro] = useState(true)
  const [printerAnim, setPrinterAnim] = useState<any | null>(null)
  const [remaining, setRemaining] = useState<number>(240)
  const [isReprinting, setIsReprinting] = useState(false)

  // Kiosk local print servisi URL'i (env üzerinden override edilebilir)
  const KIOSK_PRINT_URL =
    process.env.NEXT_PUBLIC_KIOSK_PRINT_URL ||
    "http://booth-api.cloud.solucharger.com/print"

  useEffect(() => {
    // Load printer animation JSON from public
    const loadAnim = async () => {
      try {
        const res = await fetch("/printer.json")
        if (res.ok) {
          const data = await res.json()
          setPrinterAnim(data)
        }
      } catch (e) {
        console.error("Failed to load printer.json", e)
      }
    }
    loadAnim()

    // Show intro for 10 seconds
    const introTimer = setTimeout(() => {
      setShowIntro(false)
    }, 5_000)

    return () => clearTimeout(introTimer)
  }, [])

  // Kiosk’a print job gönderen yardımcı fonksiyon
  async function sendToKioskPrint({
    photos,
    copies,
    orderId,
  }: {
    photos: { id: string; url: string }[]
    copies: number
    orderId?: string | null
  }) {
    if (!photos || photos.length === 0) return

    try {
      setIsReprinting(true)
      const resp = await fetch(KIOSK_PRINT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Kiosk-Token": process.env.NEXT_PUBLIC_KIOSK_TOKEN || "",
        },
        body: JSON.stringify({
          orderId,
          jobs: photos.map((photo) => ({
            // dataUrl: Kiosk servisine dataURL veya base64 göndereceğiz
            dataUrl: photo.url.startsWith("data:")
              ? photo.url
              : `http://booth-api.cloud.solucharger.com${photo.url}`,
            size: "4x6", // Gerekirse UI'den okunabilir
            copies,
            landscape: false,
          })),
        }),
      })

      if (!resp.ok) {
        const text = await resp.text().catch(() => "")
        console.error("Kiosk print failed:", resp.status, text)
      }
    } catch (e) {
      console.error("Kiosk print request error:", e)
    } finally {
      setIsReprinting(false)
    }
  }

  // Fotoğraflar yüklendikten SONRA print job gönder
  useEffect(() => {
    if (!orderId) return
    if (!photos || photos.length === 0) return

    sendToKioskPrint({ photos, copies: photoCount, orderId })
  }, [photos, photoCount, orderId])

  useEffect(() => {
    // Don't load photos if already loaded
    if (photosLoadedRef.current) {
      console.log("Photos already loaded, skipping...")
      return
    }

    const loadPhotos = async () => {
      // Set flag immediately to prevent concurrent calls
      photosLoadedRef.current = true

      // First try to get photos from localStorage (from photo page)
      const capturedPhotos = localStorage.getItem("capturedPhotos")
      if (capturedPhotos) {
        try {
          const photoUrls = JSON.parse(capturedPhotos)
          if (photoUrls && Array.isArray(photoUrls) && photoUrls.length > 0) {
            // Convert photo URLs to expected format
            const photoData = photoUrls.map((url: string, index: number) => ({
              id: `captured-${index}`,
              url: url,
            }))
            setPhotos(photoData)
            // Clear localStorage after using
            localStorage.removeItem("capturedPhotos")
            console.log(
              "Successfully loaded photos from localStorage:",
              photoData.length
            )
            return // Exit early to prevent API call
          }
        } catch (error) {
          console.error("Error parsing captured photos:", error)
          // Clear corrupted localStorage
          localStorage.removeItem("capturedPhotos")
        }
      }

      // Fallback to API if no localStorage photos or localStorage photos are empty
      if (orderId) {
        console.log("No localStorage photos found, fetching from API...")
        try {
          const response = await api.get(`/orders/getOrder/${orderId}`)
          if (response.data.success && response.data.data.products) {
            // ✅ Fotoğrafları ürünler içinden çekiyoruz
            const photoData = response.data.data.products.map(
              (product: { _id: string; imageUrl: string }) => ({
                id: product._id,
                url: product.imageUrl,
              })
            )
            setPhotos(photoData)
            console.log(
              "Successfully loaded photos from API:",
              photoData.length
            )
          } else {
            console.error("Sipariş getirilemedi:", response.data.msg)
            setPhotos([]) // Set empty array if no photos
          }
        } catch (error) {
          console.error("API isteğinde hata oluştu:", error)
          setPhotos([]) // Set empty array on error
        }
      }
    }

    loadPhotos()
  }, [orderId])

  const handleEmail = () => {
    router.push("/exit")
  }
  const handleSMS = () => {
    router.push("/exit")
  }
  const handlePrint = () => {
    router.push("/payment")
  }

  // choose 1-col if only 1 photo, else 2-col
  const gridColsClass = photos.length === 1 ? "grid-cols-1" : "grid-cols-2"

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setRemaining((t) => t - 1)
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  useEffect(() => {
    if (remaining <= 0) {
      router.push("/")
    }
  }, [remaining, router])

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-orange-500 to-orange-300 flex flex-col items-center justify-center p-6 space-y-4">
      {/* Logout + Countdown */}
      <div className="absolute top-4 right-4 flex items-center gap-3">
        <button
          onClick={() => router.push("/")}
          className="p-3 text-lg bg-white/70 backdrop-blur-md rounded-full shadow hover:bg-white/80 transition"
        >
          {translations[lang].logoutButton}
        </button>
        <div className="bg-orange-500 text-white rounded-xl px-4 py-2 flex items-center justify-center font-mono text-2xl whitespace-nowrap">
          {translations[lang].remainingTime} {remaining}s
        </div>
      </div>

      {showIntro ? (
        <div className="bg-white/30 backdrop-blur-md rounded-2xl shadow-2xl p-8 max-w-xl w-full text-white flex flex-col items-center">
          <div className="w-[100%] h-[100%]">
            {printerAnim && (
              <Lottie animationData={printerAnim} loop autoplay />
            )}
          </div>
          <div className="mt-8 text-4xl font-semibold text-white text-center">
            {translations[lang].pickupReminder}
          </div>
          <AnimatedDots
            baseText={translations[lang].preparingPrint}
            className="mt-6 text-2xl text-white/90"
          />
        </div>
      ) : (
        <div className="bg-white/30 backdrop-blur-md rounded-2xl shadow-2xl p-8 max-w-xl w-full text-white flex flex-col items-center justify-center">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">
              {translations[lang].printShareTitle}
            </h1>
            <div className="mt-2 px-4 py-2 bg-orange-500/20 backdrop-blur-sm rounded-full border border-orange-300/30">
              <span className="text-orange-500 text-lg font-semibold">
                📄 {photoCount} {translations[lang].outputCount}
              </span>
            </div>
          </div>

          {/* Debug info */}
          <div className="mb-4 text-sm text-gray-200">
            {/* Debug: {photos.length} photos loaded */}
            {photos.length === 0 && (
              <div className="mt-2 p-2 bg-red-500/20 rounded">
                {translations[lang].noPhotosFound}
              </div>
            )}
          </div>

          {/* Photo grid */}
          {photos.length > 0 ? (
            <div
              className={[
                "grid",
                "px-2",
                gridColsClass,
                "gap-4 w-full",
                "place-items-center",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {photos.map(({ id, url }, i) => {
                const src = url.startsWith("data:")
                  ? url
                  : `http://booth-api.cloud.solucharger.com${url}`
                return (
                  <FramedPhoto key={id} src={src} alt={`Fotoğraf ${i + 1}`} />
                )
              })}
            </div>
          ) : (
            <div className="w-full p-8 bg-white/20 rounded-lg text-center">
              <div className="text-4xl mb-4">📸</div>
              <p className="text-white">
                {translations[lang].noPhotosAvailable}
              </p>
              <p className="text-sm text-gray-200 mt-2">
                {translations[lang].photosAfterCapture}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col text-black w-full mt-8 space-y-3">
            <div className="flex justify-between w-full">
              <button
                onClick={handleEmail}
                className="flex-1 flex flex-col items-center px-4 py-2 bg-white/40 hover:bg-white/60 rounded-lg transition"
              >
                <span className="text-2xl">📧</span>
                <span className="mt-1">{translations[lang].emailAction}</span>
              </button>
              <button
                onClick={handleSMS}
                className="flex-1 flex flex-col items-center px-4 py-2 bg-white/40 hover:bg-white/60 rounded-lg transition mx-2"
              >
                <span className="text-2xl">📩</span>
                <span className="mt-1">{translations[lang].smsAction}</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 flex flex-col items-center px-4 py-2 bg-white/40 hover:bg-white/60 rounded-lg transition"
              >
                <span className="text-2xl">🖨️</span>
                <span className="mt-1">{translations[lang].printAction}</span>
              </button>
            </div>

            {/* Extra copy print button */}
            {photos.length > 0 && (
              <button
                onClick={() =>
                  sendToKioskPrint({ photos, copies: photoCount, orderId })
                }
                disabled={isReprinting}
                className={`w-full py-4 rounded-full text-xl font-semibold shadow-lg transition ${
                  isReprinting
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                    : "bg-gradient-to-r from-orange-500 to-orange-300 text-white hover:scale-105"
                }`}
              >
                {isReprinting
                  ? translations[lang].preparingPrint
                  : "Kopya Baskı Al"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function PrintSharePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-orange-500 to-orange-300 flex items-center justify-center">
          <div className="text-white text-xl">Loading...</div>
        </div>
      }
    >
      <PrintSharePageContent />
    </Suspense>
  )
}
