"use client"

import React, { useEffect, useRef, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import api from "@/app/utils/api"
import { useGlobalContext } from "@/app/context/GlobalContext"
import { Locale, translations } from "@/app/utils/translations"
import { getTranslatedName } from "@/app/utils/text"
const nameTranslationMap = {
  Selfie: {
    tr: "Selfie",
    en: "Selfie",
    de: "Selfie",
    fr: "Selfie",
    ar: "سيلفي",
  },
  "Telefondan Baskı": {
    tr: "Telefondan Baskı",
    en: "Phone Print",
    de: "Druck vom Handy",
    fr: "Impression mobile",
    ar: "طباعة من الهاتف",
  },
  "Photo Roll": {
    tr: "Photo Roll",
    en: "Photo Roll",
    de: "Filmrolle",
    fr: "Bobine photo",
    ar: "لفة الصور",
  },
  "Baskı Al": {
    tr: "Baskı Al",
    en: "Print",
    de: "Drucken",
    fr: "Imprimer",
    ar: "طباعة",
  },
  Postcard: {
    tr: "Postcard",
    en: "Postcard",
    de: "Postkarte",
    fr: "Carte postale",
    ar: "بطاقة بريدية",
  },
  Biometrik: {
    tr: "Biometrik",
    en: "Biometric",
    de: "Biometrisch",
    fr: "Biométrique",
    ar: "بصمة حيوية",
  },
}

function CardPaymentPageContent() {
  const router = useRouter()
  const params = useSearchParams()
  const orderId = params.get("orderId") ?? ""
  const photoCount = params.get("photoCount") ?? ""
  // Kur kullanımı devre dışı, TRY sabit
  const cur = "TRY"
  // const fx = Number(params.get("fx") ?? 1)
  const { lang } = useGlobalContext()
  const startedRef = useRef(false)

  // Dinamik veriler
  const [categoryName, setCategoryName] = useState<
    Array<Record<Locale, string>>
  >([])
  const [count, setCount] = useState<number>(0)
  const [totalAmount, setTotalAmount] = useState<number>(0)

  // Geri sayım
  const [remaining, setRemaining] = useState<number>(120)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Ödenen tutar (şimdilik mock)
  const [paid, setPaid] = useState<number>(0)
  const remainingAmount = Math.max(totalAmount - paid, 0)

  // Ödeme akışı durumları
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>("")

  // 1) Mount’ta sipariş detayını çek
  useEffect(() => {
    if (!orderId) return
    console.log("credit card page useEffect", orderId)
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/orders/getOrder/${orderId}`)
        if (res.data.success) {
          const order = res.data.data
          setCategoryName(order.categoryId.name)
          setCount(order.photoCount)
          setTotalAmount(order.totalAmount)
        } else {
          throw new Error(res.data.msg)
        }
      } catch (err) {
        console.error("Sipariş detayları getirilirken hata:", err)
        alert("Sipariş bilgisi alınamadı.")
        router.push("/")
      }
    }
    fetchOrder()
  }, [orderId, router])

  useEffect(() => {
    if (!orderId || startedRef.current) return
    startedRef.current = true // 👈 ikinci kez çalışmasını engelle
    ;(async () => {
      try {
        setIsProcessing(true)
        const pair = await api.post(`/payments/pair`).catch(() => null)
        const res = await api.post(`/payments/payment/start/${orderId}`, {
          // currency: "TRY",
          // fx: 1,
        })
        if (res.data?.ok) setShowSuccessModal(true)
        else
          setErrorMessage(
            res.data?.error || res.data?.msg || "Ödeme başlatılamadı."
          )
      } catch (err: any) {
        setErrorMessage(
          err?.response?.data?.error ||
            err?.response?.data?.msg ||
            "Ödeme sırasında bir hata oluştu."
        )
      } finally {
        setIsProcessing(false)
      }
    })()
  }, [orderId])

  // 2) Mount’ta geri sayımı başlat
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setRemaining((t) => t - 1)
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // Sayaç sıfıra inince anasayfaya dön
  useEffect(() => {
    if (remaining <= 0) {
      router.push("/")
    }
  }, [remaining, router])

  // Başarı modali açıldığında 2 sn sonra otomatik yönlendirme
  useEffect(() => {
    console.log("showSuccessModal", showSuccessModal)

    if (!showSuccessModal) return
    console.log("showSuccessModal", showSuccessModal)
    const t = setTimeout(async () => {
      // Sipariş bilgilerini çek ve kategoriye göre yönlendir
      try {
        console.log("🔍 Fetching order details for orderId:", orderId)
        const res = await api.get(`/orders/getOrder/${orderId}`)
        console.log("✅ Order API response:", res.data)

        if (res.data?.success) {
          const order = res.data.data
          const categoryName = order.categoryId?.name || ""
          setCategoryName(categoryName)
          console.log("📋 Order details:", {
            orderId: order._id,
            categoryName: categoryName,
            categoryId: order.categoryId?._id,
            photoCount: order.photoCount,
          })

          // Kategori adına göre yönlendirme
          const isPhonePrint =
            categoryName.toLowerCase().includes("telefondan") ||
            categoryName.toLowerCase().includes("phone") ||
            categoryName.toLowerCase().includes("baskı")

          console.log("🎯 Navigation decision:", {
            categoryName,
            isPhonePrint,
            willRedirectTo: isPhonePrint ? "phoneToPrint" : "photo",
          })

          if (isPhonePrint) {
            console.log("📱 Redirecting to phoneToPrint page")
            router.push(
              `/photo/phoneToPrint?orderId=${orderId}&photoCount=${photoCount}`
            )
          } else {
            console.log("📸 Redirecting to photo page")
            router.push(`/photo?orderId=${orderId}&photoCount=${photoCount}`)
          }
        } else {
          console.log("❌ Order API failed, redirecting to photo page")
          router.push(`/photo?orderId=${orderId}&photoCount=${photoCount}`)
        }
      } catch (error) {
        console.error("💥 Error fetching order details:", error)
        console.log("🔄 Fallback: redirecting to photo page")
        router.push(`/photo?orderId=${orderId}&photoCount=${photoCount}`)
      }
    }, 2000)
    return () => clearTimeout(t)
  }, [showSuccessModal, router, orderId, photoCount])

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-orange-500 to-orange-300 flex flex-col items-center justify-center p-6 space-y-4">
      {/* Geri butonu */}
      <button
        onClick={() => router.back()}
        aria-label={translations[lang].backAlt}
        className="absolute top-4 left-4 p-2 bg-white/30 backdrop-blur-md rounded-full hover:bg-white/50 transition"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-white"
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

      {/* Sayaç badge */}
      <div className="absolute top-4 right-4">
        <div className="bg-orange-500 text-white w-auto rounded-xl px-4 py-2 flex items-center justify-center font-mono text-2xl whitespace-nowrap">
          {translations[lang].remainingTime} {remaining}s
        </div>
      </div>

      {/* Ana Glass Panel */}
      <div className="w-full max-w-3xl bg-white/30 backdrop-blur-md rounded-2xl shadow-2xl p-8 space-y-8 text-white">
        {/* Başlık */}
        <div className="text-center">
          <h1 className="text-3xl font-semibold">
            {count} {translations[lang].unitLabel}{" "}
            {getTranslatedName(categoryName, lang)}{" "}
          </h1>
        </div>

        {/* Tutar satırı */}
        <div className="flex justify-center items-center gap-8">
          <div className="border border-white/50 rounded-lg px-6 py-2 text-2xl">
            {translations[lang].amountLabel}
          </div>
          {(() => {
            const symbol = "₺"
            const amount = totalAmount
            return (
              <div className="border border-white/50 rounded-lg px-6 py-2 text-2xl font-bold">
                {symbol} {amount.toFixed(2)}
              </div>
            )
          })()}
        </div>

        {/* Kart terminal görseli */}
        <div className="flex justify-center">
          <img
            src="/icons/pos-terminal.png"
            alt="Kart Ödemesi"
            className="w-full max-w-xs rounded-lg"
          />
        </div>
        {/* POS talimatı */}
        {!showSuccessModal && (
          <div className="text-center text-lg text-white font-bold">
            {translations[lang].posInstruction}
          </div>
        )}

        {/* Ödenen / Kalan */}
        {/*
        <div className="flex justify-center items-center gap-16">
          <div className="text-center">
            <div className="mb-2 text-3xl font-semibold">
              {translations[lang].paidLabel}
            </div>
            {(() => {
              const symbol = cur === "USD" ? "$" : cur === "EUR" ? "€" : "₺"
              const amount = paid * (cur === "TRY" ? 1 : fx)
              return (
                <div className="border border-white/50 rounded-lg px-6 py-2 text-2xl text-red-600 font-bold">
                  {symbol} {amount.toFixed(2)}
                </div>
              )
            })()}
          </div>
          <div className="text-center">
            <div className="mb-2 text-3xl font-semibold">
              {translations[lang].remainingLabel}
            </div>
            {(() => {
              const symbol = cur === "USD" ? "$" : cur === "EUR" ? "€" : "₺"
              const amount = remainingAmount * (cur === "TRY" ? 1 : fx)
              return (
                <div className="border border-white/50 rounded-lg px-6 py-2 text-2xl font-bold">
                  {symbol} {amount.toFixed(2)}
                </div>
              )
            })()}
          </div>
        </div>*/}
      </div>

      {/* İşleniyor etiketi */}
      {isProcessing && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full">
          {translations[lang].loadingText}
        </div>
      )}

      {/* Hata bildirimi */}
      {!!errorMessage && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-full max-w-[90%] text-center flex items-center gap-3">
          <span>{errorMessage}</span>
          <button
            onClick={() => {
              setErrorMessage("")
              // yeniden dene
              ;(async () => {
                try {
                  setIsProcessing(true)
                  try {
                    await api.post(`/payments/pair`)
                  } catch {}
                  const res = await api.post(
                    `/payments/payment/start/${orderId}`,
                    { currency: cur }
                  )
                  if (res.data?.ok) {
                    setShowSuccessModal(true)
                  } else {
                    setErrorMessage(
                      res.data?.error || res.data?.msg || "Ödeme başlatılamadı."
                    )
                  }
                } catch (err: any) {
                  setErrorMessage(
                    err?.response?.data?.error ||
                      err?.response?.data?.msg ||
                      "Ödeme sırasında bir hata oluştu."
                  )
                } finally {
                  setIsProcessing(false)
                }
              })()
            }}
            className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-full"
          >
            Tekrar Dene
          </button>
        </div>
      )}

      {/* Başarı modalı */}
      {showSuccessModal && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-[90%] max-w-md text-center">
            <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1>
              isPhonePrint: {getTranslatedName(categoryName, lang).toString()}
            </h1>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              {translations[lang].paymentSuccessTitle}
            </h2>
            <p className="text-gray-700 mb-6">
              {translations[lang].paymentSuccessBody}
            </p>
            {/*
            <button
              onClick={() =>
                router.push(
                  `/photo?orderId=${orderId}&photoCount=${photoCount}`
                )
              }
              className="w-full bg-green-600 hover:bg-green-700 text-white rounded-full py-3 font-semibold"
            >
              {translations[lang].confirmPaymentButton}
            </button>*/}
          </div>
        </div>
      )}
    </div>
  )
}

export default function CardPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-orange-500 to-orange-300 flex items-center justify-center">
          <div className="text-white text-xl">Loading...</div>
        </div>
      }
    >
      <CardPaymentPageContent />
    </Suspense>
  )
}
