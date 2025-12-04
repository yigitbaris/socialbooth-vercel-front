// app/payment/page.tsx
"use client"

import React, { useEffect, useRef, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import api from "../utils/api"
import { useGlobalContext } from "../context/GlobalContext"
import { translations } from "../utils/translations"
import { toast } from "react-toastify"

function PaymentPageContent() {
  const router = useRouter()
  const params = useSearchParams()
  const orderId = params.get("orderId")
  const category = (params.get("category") ?? "").toUpperCase()
  const photoCount = params.get("photoCount")
  const cur = (params.get("cur") ?? "TRY").toUpperCase()
  const fx = Number(params.get("fx") ?? 1)
  const { lang } = useGlobalContext()

  //order
  const [order, setOrder] = useState<any | null>(null)

  // countdown
  const [remaining, setRemaining] = useState(120)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const didAbortRef = useRef<boolean>(false)

  // promo
  const [promo, setPromo] = useState("")
  const [discount, setDiscount] = useState(0)
  const [couponApplied, setCouponApplied] = useState(false)
  const [showPromoInput, setShowPromoInput] = useState(false)

  // payment state
  const [paymentState, setPaymentState] = useState<
    "initial" | "loading" | "completed"
  >("initial")

  // base & final amounts
  const [baseAmount, setBaseAmount] = useState(100)
  const finalAmount = (baseAmount * (100 - discount)) / 100

  // loading & double-fetch guard
  const [isLoadingOrder, setIsLoadingOrder] = useState<boolean>(true)
  const didFetchRef = useRef<boolean>(false)

  useEffect(() => {
    // 1) Sadece orderId değiştiğinde çalışacak: ödeme hazırlığı
    if (!orderId) return
  }, [orderId])

  useEffect(() => {
    // 2) Sayfa ilk açıldığında sipariş detayı al (StrictMode'da çift çağrıyı engelle)
    if (!orderId) return
    if (didFetchRef.current) return
    didFetchRef.current = true

    const fetchOrder = async () => {
      setIsLoadingOrder(true)
      try {
        const orderRes = await api.get(`/orders/getOrder/${orderId}`)
        if (orderRes.data.success) {
          console.log("Sipariş detayı:", orderRes.data.data)
          setOrder(orderRes.data.data)
        }
      } catch (err) {
        console.error("getOrder hatası:", err)
      } finally {
        setIsLoadingOrder(false)
      }
    }

    fetchOrder()
  }, [orderId])

  // countdown logic
  useEffect(() => {
    timerRef.current = setInterval(() => setRemaining((r) => r - 1), 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  useEffect(() => {
    const abortOnTimeout = async () => {
      if (didAbortRef.current) return
      didAbortRef.current = true
      try {
        await api.post(`/payments/payment/abort`)
      } catch (err) {
        console.error("payment abort failed:", err)
      } finally {
        router.push("/")
      }
    }

    if (remaining <= 0) {
      if (timerRef.current) clearInterval(timerRef.current)
      abortOnTimeout()
    }
  }, [remaining, router])

  // apply promo (backend'e gönder, order.totalAmount'ı güncelle)
  const applyPromo = async () => {
    try {
      if (!orderId) {
        toast.error("Sipariş ID bulunamadı!")
        return
      }
      const code = promo.trim().toLowerCase()
      if (!code) {
        toast.error("Lütfen kupon kodu girin")
        return
      }

      const res = await api.post(`/coupons/apply`, {
        orderId,
        couponCode: code,
      })

      if (res.data?.success) {
        // Güncellenmiş toplamı göster
        const newTotal = res.data.data?.totalAmount
        const appliedCode = res.data.data?.couponCode
        const discountAmount = Number(res.data.data?.discountAmount || 0)
        setOrder((prev: any) => ({
          ...(prev || {}),
          totalAmount: newTotal,
          couponCode: appliedCode || prev?.couponCode,
        }))
        toast.success("Kupon uygulandı")
        // Backend döndürdüğü indirim yüzdesini bilgi amaçlı göster
        setDiscount(discountAmount)
        setCouponApplied(true)
        setShowPromoInput(false)
      } else {
        toast.error(res.data?.msg || "Kupon uygulanamadı")
      }
    } catch (err: any) {
      console.error("applyPromo error:", err)
      toast.error("Kupon uygulanırken hata oluştu")
    }
  }

  // confirm payment - BKM TechPOS 509 entegrasyonu
  const confirmPayment = async (method: "cash" | "creditCard") => {
    if (!orderId) {
      toast.error("Sipariş ID bulunamadı!")
      return
    }

    // Kredi kartı için önce kredi kartı sayfasına yönlendir
    if (method === "creditCard") {
      router.push(
        `/payment/creditCard?orderId=${orderId}&photoCount=${photoCount}&cur=${cur}&fx=${fx}`
      )
    } else {
      // Nakit ödeme için direkt sayfaya yönlendir
      router.push(
        `/payment/${method}?orderId=${orderId}&photoCount=${photoCount}&cur=${cur}&fx=${fx}`
      )
    }
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-orange-500 to-orange-300 flex flex-col items-center justify-center p-6 space-y-4">
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

      {/* Countdown badge */}
      <div className="absolute top-4 right-4">
        <div className="bg-orange-500 text-white rounded-xl px-4 py-2 flex items-center justify-center font-mono text-2xl whitespace-nowrap">
          {translations[lang].remainingTime} {remaining}s
        </div>
      </div>

      {/* Glass card */}
      <div className="w-full max-w-3xl bg-white/30 backdrop-blur-md rounded-2xl shadow-2xl p-8 space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">{category}</h1>
          <p className="mt-2 text-2xl font-semibold text-white">
            {translations[lang].paymentPrompt}
          </p>
        </div>

        {/* Payment options */}
        <div className="flex flex-col md:flex-row items-stretch gap-6">
          <button
            onClick={() => confirmPayment("cash")}
            disabled={paymentState !== "initial"}
            className="flex-1 bg-white/40 backdrop-blur-md rounded-2xl p-6 flex flex-col items-center justify-center hover:scale-105 transition transform"
          >
            <img src="/icons/dollars.png" alt="Nakit" className="h-32 mb-4" />
            <span className="text-2xl font-semibold text-black">
              {translations[lang].cashButton}
            </span>
          </button>

          {/* <div className="hidden text-lg md:flex items-center text-black">
            {translations[lang].orText}
          </div> */}

          <button
            onClick={() => confirmPayment("creditCard")}
            disabled={paymentState !== "initial"}
            className="flex-1 bg-white/40 backdrop-blur-md rounded-2xl p-6 flex flex-col items-center justify-center hover:scale-105 transition transform"
          >
            <img
              src="/icons/atm-card.png"
              alt="Kredi Kartı"
              className="h-32 mb-4"
            />
            <span className="text-2xl font-semibold text-black">
              {translations[lang].creditButton}
            </span>
          </button>
        </div>

        {/* Amount row */}
        <div className="flex justify-between items-center text-white">
          <div className="text-xl font-semibold uppercase border border-white/50 rounded-lg px-4 py-2">
            {translations[lang].amountLabel}
          </div>
          {/* <div className="text-3xl font-bold">₺ {finalAmount.toFixed(2)}</div> */}
          {isLoadingOrder ? (
            <div className="h-9 w-28 bg-white/40 rounded animate-pulse" />
          ) : (
            (() => {
              const symbol = cur === "USD" ? "$" : cur === "EUR" ? "€" : "₺"
              const amount =
                Number(order?.totalAmount ?? 0) * (cur === "TRY" ? 1 : fx)
              return (
                <div className="text-3xl font-bold">
                  {symbol} {amount.toFixed(2)}
                </div>
              )
            })()
          )}
        </div>

        {/* İndirim bilgisi */}
        {!!discount && discount > 0 && (
          <div className="text-center text-white/90">
            <span className="inline-block bg-white/30 rounded-full px-4 py-1 text-lg">
              %{discount} {translations[lang].discountApplied}
            </span>
          </div>
        )}

        {/* Promo button */}
        {!showPromoInput &&
          paymentState === "initial" &&
          !couponApplied &&
          !order?.couponCode && (
            <button
              onClick={() => setShowPromoInput(true)}
              className="w-full bg-orange-400 text-white rounded-full py-3 hover:bg-orange-500 transition"
            >
              {translations[lang].promoQuestion}
            </button>
          )}

        {/* Promo input */}
        {showPromoInput &&
          paymentState === "initial" &&
          !couponApplied &&
          !order?.couponCode && (
            <div className="flex gap-2">
              <input
                value={promo}
                onChange={(e) => setPromo(e.target.value)}
                placeholder={translations[lang].promoPlaceholder}
                className="flex-1 px-4 py-2 rounded-full bg-white/50 placeholder-gray-700 focus:outline-none"
              />
              <button
                onClick={applyPromo}
                className="px-6 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition"
              >
                {translations[lang].applyButton}
              </button>
            </div>
          )}

        {/* Final action state */}
        {paymentState === "loading" && (
          <div className="text-center text-white">
            {translations[lang].loadingText}
          </div>
        )}
        {paymentState === "completed" && (
          <button
            onClick={() => router.push(`/print-share?orderId=${orderId}`)}
            className="w-full bg-white text-orange-600 rounded-full py-3 font-semibold hover:bg-white/60 transition"
          >
            {translations[lang].completedButton}
          </button>
        )}
      </div>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-orange-500 to-orange-300 flex items-center justify-center">
      <div className="text-white text-xl">Loading...</div>
    </div>}>
      <PaymentPageContent />
    </Suspense>
  )
}
