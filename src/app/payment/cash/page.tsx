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

function CashPaymentPageContent() {
  const router = useRouter()
  const params = useSearchParams()
  const orderId = params.get("orderId") ?? ""
  const photoCount = params.get("photoCount") ?? ""
  // Kur kullanımı devre dışı, TRY sabit
  const cur = "TRY"
  // const fx = Number(params.get("fx") ?? 1)
  const { lang } = useGlobalContext()
  // Dinamik veriler
  const [categoryName, setCategoryName] = useState<
    Array<Record<Locale, string>>
  >([])
  const [count, setCount] = useState<number>(0)
  const [totalAmount, setTotalAmount] = useState<number>(0)

  // geri sayım
  const [remaining, setRemaining] = useState(120)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // kullanıcıdan girilen ödeme (nakit)
  const [paid, setPaid] = useState<number>(0)

  // Kalan tutar
  const remainingAmount = Math.max(totalAmount - paid, 0)

  // 1) Mount’ta sipariş detayını çek
  useEffect(() => {
    if (!orderId) return
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/orders/getOrder/${orderId}`)
        if (res.data.success) {
          const order = res.data.data
          setCategoryName(order.categoryId.name)
          setCount(order.photoCount)
          setTotalAmount(order.totalAmount)
        }
      } catch (err) {
        console.error("Sipariş detayları getirilirken hata:", err)
        alert("Sipariş bilgisi alınamadı.")
        router.push("/")
      }
    }
    fetchOrder()
  }, [orderId, router])

  // 2) Mount’ta geri sayımı başlat
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setRemaining((t) => t - 1)
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // sıfıra inince anasayfaya dön
  useEffect(() => {
    if (remaining <= 0) {
      router.push("/")
    }
  }, [remaining, router])

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-orange-500 to-orange-300 flex flex-col items-center justify-center p-6 space-y-4">
      {/* Back button */}
      <button
        onClick={() => router.back()}
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

      {/* Countdown badge */}
      <div className="absolute top-4 right-4">
        <div className="bg-orange-500 text-white rounded-xl px-4 py-2 flex items-center justify-center font-mono text-2xl whitespace-nowrap">
          {translations[lang].remainingTime} {remaining}s
        </div>
      </div>

      {/* Main Glass Panel */}
      <div className="w-full max-w-3xl bg-white/30 backdrop-blur-md rounded-2xl shadow-2xl p-8 space-y-8">
        {/* Header */}
        <div
          /*
          onClick={() =>
            router.push(`/photo?orderId=${orderId}&photoCount=${photoCount}`)
          }
            */
          className="text-center text-white cursor-pointer"
        >
          <h1 className="text-3xl font-semibold">
            {count} {translations[lang].unitLabel}{" "}
            {getTranslatedName(categoryName, lang)}{" "}
          </h1>
        </div>

        {/* Tutar row */}
        <div className="flex justify-center items-center gap-8 text-white">
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

        {/* Instructions */}
        <div className="bg-white rounded-lg p-6">
          <p className="text-red-600 text-xl mb-3">
            * {translations[lang].instruction1}
          </p>
          <p className="text-red-600 text-xl mb-3">
            * {translations[lang].instruction2}
          </p>
          <p className="text-red-600 text-xl">
            * {translations[lang].instruction3}
          </p>
        </div>

        {/* Paid / Remaining */}
        <div className="flex justify-center items-center gap-12 text-white mb-6">
          <div className="text-center">
            <div className="mb-2 text-3xl font-semibold">
              {translations[lang].paidLabel}
            </div>
            {(() => {
              const symbol = "₺"
              const amount = paid
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
              const symbol = "₺"
              const amount = remainingAmount
              return (
                <div className="border border-white/50 rounded-lg px-6 py-2 text-2xl font-bold">
                  {symbol} {amount.toFixed(2)}
                </div>
              )
            })()}
          </div>
        </div>

        {/* Payment Confirmation Button */}
        <div className="flex justify-center">
          <button
            onClick={async () => {
              try {
                // Sipariş durumunu ödeme tamamlandı olarak güncelle
                await api.put(`/orders/updateStatus/${orderId}`, {
                  status: "paid",
                })

                // Sipariş bilgilerini çek ve kategoriye göre yönlendir
                try {
                  const res = await api.get(`/orders/getOrder/${orderId}`)
                  if (res.data?.success) {
                    const order = res.data.data
                    const categoryName =
                      order.categoryId?.name?.[0]?.text ||
                      order.categoryId?.name ||
                      ""

                    // Kategori adına göre yönlendirme
                    if (
                      categoryName.toLowerCase().includes("phone") ||
                      categoryName.toLowerCase().includes("telefon")
                    ) {
                      // PhoneToPrint kategorisi için phoneToPrint sayfasına yönlendir
                      router.push(
                        `/photo/phoneToPrint?orderId=${orderId}&photoCount=${photoCount}`
                      )
                    } else {
                      // Diğer kategoriler (selfie, vs.) için mevcut photo sayfasına yönlendir
                      router.push(
                        `/photo?orderId=${orderId}&photoCount=${photoCount}`
                      )
                    }
                  } else {
                    // Hata durumunda varsayılan yönlendirme
                    router.push(
                      `/photo?orderId=${orderId}&photoCount=${photoCount}`
                    )
                  }
                } catch (error) {
                  console.error("Sipariş bilgisi alınamadı:", error)
                  // Hata durumunda varsayılan yönlendirme
                  router.push(
                    `/photo?orderId=${orderId}&photoCount=${photoCount}`
                  )
                }
              } catch (error) {
                console.error("Status update error:", error)
                alert("Durum güncellenirken hata oluştu.")
              }
            }}
            className="bg-green-500 hover:bg-green-600 text-white text-2xl font-bold py-4 px-8 rounded-full transition-colors"
          >
            {translations[lang].confirmPaymentButton || "Ödeme Tamamlandı"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CashPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-orange-500 to-orange-300 flex items-center justify-center">
          <div className="text-white text-xl">Loading...</div>
        </div>
      }
    >
      <CashPaymentPageContent />
    </Suspense>
  )
}
