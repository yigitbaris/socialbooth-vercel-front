// app/components/SelfieEffectModal.tsx
"use client"
import React, { useState, useEffect } from "react"
import Image from "next/image"

interface SelfieEffectModalProps {
  show: boolean
  onClose: () => void
  selectedEffect: string | null
  onSelect: (effectId: string | null) => void
}

export default function SelfieEffectModal({
  show,
  onClose,
  selectedEffect,
  onSelect,
}: SelfieEffectModalProps) {
  // placeholder effect list
  const effects = [
    { id: "parlak", name: "Parlak" },
    { id: "sepya", name: "Sepya" },
    { id: "negatif", name: "Negatif" },
    { id: "monokrom", name: "Monokrom" },
    { id: "vintage", name: "Vintage" },
    { id: "canli", name: "Canlı Renkler" },
    { id: "solgun", name: "Solgun" },
    { id: "isi-haritası", name: "Isı Haritası" },
    { id: "gölge", name: "Gölge" },
    { id: "pürüzsüz", name: "Pürüzsüzleştirme" },
  ]

  const [activeEffect, setActiveEffect] = useState<string | null>(null)

  // sync when opening
  useEffect(() => {
    if (show) setActiveEffect(selectedEffect)
  }, [show, selectedEffect])

  if (!show) return null

  return (
    <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white/50 backdrop-blur-md rounded-xl shadow-xl max-w-3xl w-full h-[80vh] flex flex-col">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10  px-8 py-4">
          <h2 className="text-2xl font-bold m-0">Efekt Seç</h2>
        </div>

        {/* Effects Grid (vertical scroll) */}
        <div className="px-8 pt-2 pb-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* 1) “No Effect” cell */}
            <div
              onClick={() => setActiveEffect(null)}
              className={`h-32 rounded-lg cursor-pointer flex flex-col items-center justify-center transition ${
                activeEffect === null
                  ? "ring-4 ring-pink-500 bg-gray-100 text-pink-600"
                  : "bg-gray-300 hover:ring-2 hover:ring-pink-300 text-gray-800"
              }`}
            >
              <img
                src="/icons/forbidden.png"
                alt="Efektsiz"
                className="w-10 h-10 mb-2"
              />
              <span className="font-semibold">Efekt Yok</span>
            </div>

            {/* 2) Effect cells */}
            {effects.map((ef) => {
              const isActive = activeEffect === ef.id
              return (
                <div
                  key={ef.id}
                  onClick={() => setActiveEffect(ef.id)}
                  className={`h-32 rounded-lg cursor-pointer flex items-center justify-center text-center p-2 transition ${
                    isActive
                      ? "ring-4 ring-pink-500 bg-white text-pink-600 font-semibold"
                      : "bg-gray-300 hover:ring-2 hover:ring-pink-300 text-white"
                  }`}
                >
                  {ef.name}
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
            onClick={() => onSelect(activeEffect)}
            className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition"
          >
            Seç
          </button>
        </div>
      </div>
    </div>
  )
}
