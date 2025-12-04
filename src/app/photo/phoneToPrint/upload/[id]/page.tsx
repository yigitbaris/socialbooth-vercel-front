"use client"
import React, { useMemo, useState } from "react"
import { useParams } from "next/navigation"

export default function UploadFromPhone() {
  const { id: slotId } = useParams() as { id: string }
  const [files, setFiles] = useState<FileList | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Debug: Log slot ID
  console.log("Slot ID from params:", slotId)

  const previews = useMemo(() => {
    if (!files) return []
    return Array.from(files).map((f) => ({
      file: f,
      url: URL.createObjectURL(f),
    }))
  }, [files])

  const onUpload = async () => {
    if (!files?.length || !slotId) {
      console.error("Upload failed: missing files or slotId", {
        files: files?.length,
        slotId,
      })
      setError("Dosya veya slot ID eksik")
      return
    }

    setBusy(true)
    setError(null)

    try {
      const fd = new FormData()
      Array.from(files).forEach((f) => fd.append("files", f))

      const apiUrl = `http://booth-api.cloud.solucharger.com/api/v1/uploads/${slotId}`
      console.log("Uploading to:", apiUrl)
      console.log(
        "Files:",
        Array.from(files).map((f) => ({ name: f.name, size: f.size }))
      )

      const res = await fetch(apiUrl, {
        method: "POST",
        body: fd,
      })

      console.log("Upload response status:", res.status)
      const json = await res.json()
      console.log("Upload response:", json)

      if (!json?.success) throw new Error(json?.msg || "Yükleme başarısız")
      setDone(true)
    } catch (e: any) {
      console.error("Upload error:", e)
      setError(e?.message || "Bir şeyler ters gitti")
    } finally {
      setBusy(false)
    }
  }

  const reset = () => {
    setFiles(null)
    setDone(false)
    setError(null)
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-orange-500 to-orange-300">
      <div className="bg-white/70 rounded-2xl p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">
          Fotoğraf Yükle
        </h1>
        <p className="text-gray-600 text-center mb-4">
          Slot: <span className="font-mono">{slotId || "Yükleniyor..."}</span>
        </p>
        {!slotId && (
          <p className="text-red-600 text-center mb-4 text-sm">
            ⚠️ Slot ID bulunamadı. URL'yi kontrol edin.
          </p>
        )}

        {!done ? (
          <>
            <label className="block">
              <input
                type="file"
                accept="image/*"
                multiple
                // mobilde direkt kamera açılmasını istersen:
                // capture="environment"
                onChange={(e) => setFiles(e.target.files)}
                className="hidden"
                id="filePicker"
              />
              <div className="w-full text-center">
                <button
                  className="px-5 py-3 rounded-xl bg-white text-orange-600 shadow hover:shadow-md"
                  onClick={() => document.getElementById("filePicker")?.click()}
                >
                  Fotoğraf Seç / Çek
                </button>
              </div>
            </label>

            {previews.length > 0 && (
              <>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {previews.map((p, i) => (
                    <div
                      key={i}
                      className="bg-white/80 rounded-lg overflow-hidden"
                    >
                      <img
                        src={p.url}
                        alt={`preview-${i}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <button
                    onClick={reset}
                    className="px-4 py-2 rounded-xl bg-white/40 text-gray-800"
                  >
                    Temizle
                  </button>
                  <button
                    disabled={busy}
                    onClick={onUpload}
                    className="px-5 py-2 rounded-xl bg-orange-500 text-white disabled:opacity-60"
                  >
                    {busy ? "Yükleniyor…" : "Yükle"}
                  </button>
                </div>
              </>
            )}

            {error && (
              <p className="mt-4 text-center text-red-700 bg-red-50 rounded-lg p-2">
                {error}
              </p>
            )}
          </>
        ) : (
          <div className="text-center">
            <div className="text-green-700 font-semibold mb-2">
              Yükleme tamam ✅
            </div>
            <p className="text-gray-700 mb-4">
              Kiosk ekranında önizlemeyi görebilirsin. Gerekirse tekrar
              yükleyebilirsin.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={reset}
                className="px-5 py-2 rounded-xl bg-white text-orange-600"
              >
                Başka Fotoğraf Yükle
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
