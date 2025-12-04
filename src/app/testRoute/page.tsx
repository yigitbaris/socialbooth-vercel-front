"use client"
import { useState, useEffect } from "react"

export default function Home() {
  const [status, setStatus] = useState("Bekleniyor…")

  const handleTestRequest = async () => {
    if (!navigator.onLine) {
      setStatus("Offline modda; istek kuyruğa eklendi.")
      return
    }
    try {
      const res = await fetch("http://localhost:3001/api/v1/test", {
        method: "GET",
        credentials: "include",
      })

      // Eğer HTTP 200 değilse, BG-Sync kuyruğa alındığını varsayıp mesaj göster
      if (!res.ok) {
        setStatus("İstek kuyruğa alındı, ağ gelince gönderilecek.")
        return
      }

      // Sadece bir kez json() çağırın
      const { message } = await res.json()
      setStatus(`Sunucudan dönen mesaj: "${message}"`)
    } catch (err) {
      console.warn(
        "Fetch başarısız, muhtemelen offline ve queue’ya alındı.",
        err
      )
      setStatus("Offline modda; istek kuyruğa eklendi.")
    }
  }

  // Ağ geri geldiğinde durumu sıfırlayıp kuyruğu işletebilirsiniz
  useEffect(() => {
    const onOnline = async () => {
      setStatus("Ağ geri geldi; isteği yeniden deniyoruz…")
      try {
        const res = await fetch("http://localhost:3001/api/v1/test", {
          method: "GET",
          credentials: "include",
        })
        if (res.ok) {
          setStatus("API isteği başarıyla çekildi.")
        } else {
          setStatus("Sunucudan beklenmeyen yanıt geldi.")
        }
      } catch {
        setStatus("Yine başarısız oldu; offline olabilir.")
      }
    }

    window.addEventListener("online", onOnline)
    return () => window.removeEventListener("online", onOnline)
  }, [])

  return (
    <div style={{ padding: 20 }}>
      <h1>API Test route</h1>
      <button className="bg-red-500 p-5" onClick={handleTestRequest}>
        Test route’a isteği gönder
      </button>
      <button
        className="bg-blue-500 p-5"
        onClick={() => setStatus("Bekleniyor…")}
      >
        sıfırla
      </button>
      <p>Status: {status}</p>
    </div>
  )
}
