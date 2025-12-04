// app/exit/page.tsx
"use client"
import React, { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { translations } from "../utils/translations"
import { useGlobalContext } from "../context/GlobalContext"

export default function ExitPage() {
  const router = useRouter()
  const { lang } = useGlobalContext()

  // const timerRef = useRef<NodeJS.Timeout>()
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      router.push("/")
    }, 60_000) // 60,000 ms = 60 seconds

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-orange-300 flex items-center justify-center p-4">
      <div className="bg-white/30 backdrop-blur-md rounded-xl shadow-xl p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold mb-4 text-gray-900">Social Booth</h1>
        {/* <h2 className="text-xl font-bold mb-4 text-gray-900">Teşekkürler!</h2> */}
        <h2 className="text-gray-800 text-3xl mb-3">
          {translations[lang].exitReminder}
        </h2>
        <div className="text-3xl mb-3">{translations[lang].exitEmoji}</div>
        <p className="text-gray-600 mb-8">{translations[lang].exitSubtext}</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2 bg-orange-500 text-white rounded-full shadow hover:bg-orange-600 transition"
          >
            {translations[lang].homeButton}
          </button>
          {/* <button
            onClick={() => router.push("/photo")}
            className="px-6 py-2 bg-white text-pink-600 rounded-full shadow hover:bg-white/70 transition"
          >
            Yeniden Deneyin
          </button> */}
        </div>
      </div>
    </div>
  )
}
