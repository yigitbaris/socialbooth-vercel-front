// app/components/SelfieBackgroundModal.tsx
"use client"
import React, { useState, useEffect } from "react"
import Image from "next/image"

interface BgModalProps {
  show: boolean
  onClose: () => void
  selectedFrame: string | null
  onSelect: (bgId: string | null) => void // allow null to clear
}

export default function BgModal({
  show,
  onClose,
  selectedFrame,
  onSelect,
}: BgModalProps) {
  const categories = [
    "Tümü",
    "Doğa",
    "Aşk",
    "Cumhuriyet",
    "Spor",
    "Deneme",
    "Kış",
    "Yaz",
    "Sonbahar",
    "Bahar",
  ]
  const [selectedCat, setSelectedCat] = useState<string>("Tümü")
  const [activeBg, setActiveBg] = useState<string | null>(null)

  // generate placeholders
  const allBackgrounds = Array.from({ length: 20 }).map((_, i) => ({
    id: (i + 1).toString(),
    category: categories[(i % (categories.length - 1)) + 1],
  }))

  const filtered = allBackgrounds.filter(
    (bg) => selectedCat === "Tümü" || bg.category === selectedCat
  )

  // sync when modal opens
  useEffect(() => {
    if (show) setActiveBg(selectedFrame)
  }, [show, selectedFrame])

  if (!show) return null

  return (
    <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white/50 backdrop-blur-md rounded-xl shadow-xl max-w-3xl w-full h-[80vh] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 px-8 py-4 ">
          <h2 className="text-2xl font-bold m-0">Arka Plan Seç</h2>
        </div>

        {/* Categories */}
        <div className="px-8 py-4 overflow-x-auto">
          <div className="flex gap-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
                  selectedCat === cat
                    ? "bg-pink-500 text-white font-semibold"
                    : "bg-white/30 text-gray-800 hover:bg-white/50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="px-8 pt-2 pb-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Always-first “clear” cell */}
            <div
              onClick={() => setActiveBg(null)}
              className={`h-32 rounded-lg cursor-pointer flex items-center justify-center font-bold transition ${
                activeBg === null
                  ? "ring-4 ring-pink-500 bg-red-100 text-red-600"
                  : "bg-gray-300 hover:ring-2 hover:ring-pink-300 text-gray-800"
              }`}
            >
              <img
                src="/icons/forbidden.png"
                alt="Kaldır Arka Plan"
                className="w-12 h-12 object-contain"
              />
            </div>

            {filtered.map((bg) => {
              const isActive = activeBg === bg.id
              return (
                <div
                  key={bg.id}
                  onClick={() => setActiveBg(bg.id)}
                  className={`h-32 rounded-lg cursor-pointer flex items-center justify-center font-bold transition ${
                    isActive
                      ? "ring-4 ring-pink-500 bg-gray-300 text-white"
                      : "bg-gray-300 hover:ring-2 hover:ring-pink-300 text-white"
                  }`}
                >
                  BG {bg.id}
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 flex justify-end gap-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition"
          >
            Kapat
          </button>
          <button
            onClick={() => onSelect(activeBg)}
            className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition"
          >
            Seç
          </button>
        </div>
      </div>
    </div>
  )
}
