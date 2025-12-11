// app/photoCount/page.tsx
"use client"

import React, { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import api from "../utils/api"
import { useGlobalContext } from "../context/GlobalContext"
import { translations } from "../utils/translations"
import { getTranslatedName } from "../utils/text"
import { toast } from "react-toastify"

function PhotoCountPageContent() {
  const params = useSearchParams()
  const router = useRouter()
  const { lang } = useGlobalContext() //

  // e.g. "selfie", "phoneToPrint", ...
  const category = params.get("category") ?? ""
  const categoryId = params.get("categoryId") ?? ""
  const orderId = params.get("orderId") ?? ""

  // map category → icon
  const iconMap: Record<string, string> = {
    selfie: "/icons/camera.png",
    phoneToPrint: "/icons/print.png",
    photoRoll: "/icons/roll.png",
    print: "/icons/print-large.png",
    postcard: "/icons/postcard.png",
    biometric: "/icons/fingerprint.png",
  }
  const iconSrc = iconMap[category] || "/icons/camera.png"

  // dynamic choices computed from category base price
  const [options, setOptions] = useState<
    Array<{ count: number; price: number }>
  >([
    { count: 1, price: 0 },
    { count: 2, price: 0 },
    { count: 3, price: 0 },
  ])

  useEffect(() => {
    const fetchAndCompute = async () => {
      try {
        const res = await api.get("/categories/getAllCategories")
        if (res.data?.success) {
          const categories = res.data.data as Array<{
            _id: string
            price: number
            priceUSD?: number
            priceEUR?: number
          }>
          const current = categories.find((c) => c._id === categoryId)
          // Always use TL base price on photoCount page
          let basePrice = current?.price ?? 0
          // if (lang === "en" || lang === "ar") {
          //   basePrice = current?.priceUSD ?? basePrice
          // } else if (lang === "de" || lang === "fr") {
          //   basePrice = current?.priceEUR ?? basePrice
          // }
          const counts = [1, 2, 3]
          // price = count × category.price
          const computed = counts.map((cnt) => ({
            count: cnt,
            price: cnt * basePrice,
          }))
          setOptions(computed)
        }
      } catch (e) {
        console.error("Kategori fiyatları alınamadı:", e)
      }
    }
    if (categoryId) fetchAndCompute()
  }, [categoryId])

  // countdown state
  const [remaining, setRemaining] = useState(180)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // start timer on mount
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setRemaining((r) => r - 1)
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // when it hits zero, go home
  useEffect(() => {
    if (remaining <= 0) {
      router.push("/")
    }
  }, [remaining, router])

  const handleSelect = async (count: number) => {
    try {
      const response = await api.put(`/orders/selectPhotoCount/${orderId}`, {
        photoCount: count,
      })

      if (response.data.success) {
        const createdOrder = response.data.data
        const orderId = createdOrder._id

        // Prepare payment on the backend and wait before navigating
        try {
          const prepRes = await api.put(`/orders/preparePayment/${orderId}`)
          if (prepRes.data?.success) {
            console.log("Ödeme hazırlığı başarılı:", prepRes.data.data)
          } else {
            const msg = prepRes.data?.msg || "Ödeme hazırlığı başarısız."
            toast.error(msg)
            return
          }
        } catch (err) {
          console.error("PreparePayment hatası:", err)
          toast.error("Ödeme hazırlığı sırasında bir hata oluştu.")
          return
        }

        console.log("Sipariş başarıyla oluşturuldu:", createdOrder)

        // Kur ve sembolü sabitle: seçilen dil ve kategori fiyatlarından oranı türet
        let cur = "TRY"
        let fx = 1
        try {
          const res = await api.get("/categories/getAllCategories")
          const list = (res.data?.data ?? []) as Array<{
            _id: string
            price: number
            priceUSD?: number
            priceEUR?: number
          }>
          const current = list.find((c) => c._id === categoryId)
          if (current && current.price > 0) {
            if (lang === "en" || lang === "ar") {
              if (typeof current.priceUSD === "number") {
                cur = "USD"
                fx = current.priceUSD / current.price
              }
            } else if (lang === "de" || lang === "fr") {
              if (typeof current.priceEUR === "number") {
                cur = "EUR"
                fx = current.priceEUR / current.price
              }
            }
          }
        } catch {}

        const sourceOrderId = params.get("sourceOrderId") || ""
        router.push(
          `/payment?orderId=${orderId}&photoCount=${count}&cur=${cur}&fx=${fx}&sourceOrderId=${sourceOrderId}`
        )
      } else {
        toast.error(response.data.msg)
      }
    } catch (error) {
      console.error("Sipariş oluşturulamadı:", error)
      toast.error("Bir hata oluştu.")
    }
  }

  return (
    <div
      className="
        relative
        min-h-screen
        bg-gradient-to-br from-orange-500 to-orange-300
        flex flex-col items-center justify-center p-6
      "
    >
      {/* Back button */}
      <button
        onClick={() => router.push("/")}
        aria-label={translations[lang].backAlt}
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
      {/* countdown badge */}
      <div className="absolute top-4 right-4">
        <div className="bg-orange-600 text-white text-2xl rounded-xl px-4 py-2 flex items-center justify-center font-mono whitespace-nowrap">
          {translations[lang].remainingTime} {remaining}s
        </div>
      </div>

      <div
        className="
          w-full max-w-[70%] min-h-[65vh]
          bg-white/30 backdrop-blur-md
          rounded-2xl p-8
          flex flex-col  
          text-white 
        "
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-wide">
            {category.toUpperCase()}
            {/* {getTranslatedName(category, lang)} */}
          </h1>
          <p className="mt-2 text-2xl">{translations[lang].selectPrompt}</p>
        </div>

        {/* Grid of cards */}
        <div className="grid grid-cols-3 gap-6 w-full flex-1 p-4">
          {options.map(({ count, price }) => (
            <button
              key={count}
              onClick={() => handleSelect(count)}
              className="
                w-full h-full
                bg-white/40 backdrop-blur-md
                rounded-2xl p-6
                flex flex-col items-center justify-center
                hover:scale-105 transition-transform
              "
            >
              <div className="w-24 h-24 bg-white/50 rounded-full flex items-center justify-center mb-4">
                <img src={iconSrc} alt={category} className="w-12 h-12" />
              </div>
              <span className="text-2xl font-semibold text-gray-900">
                {count} {translations[lang].unitLabel}
              </span>
              {(() => {
                // Always show TL symbol on photoCount page
                // let symbol = "₺"
                // if (lang === "en" || lang === "ar") symbol = "$"
                // else if (lang === "de" || lang === "fr") symbol = "€"
                return (
                  <span className="mt-2 text-xl text-gray-900">
                    ₺ {price.toFixed(2)}
                  </span>
                )
              })()}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function PhotoCountPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-orange-500 to-orange-300 flex items-center justify-center">
          <div className="text-white text-xl">Loading...</div>
        </div>
      }
    >
      <PhotoCountPageContent />
    </Suspense>
  )
}
