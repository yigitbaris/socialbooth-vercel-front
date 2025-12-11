"use client"

import React, { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import api from "./utils/api"
import { toast } from "react-toastify"
import { Category } from "./utils/types"
import { useGlobalContext } from "./context/GlobalContext"
import { translations, Locale } from "./utils/translations"
import { getTranslatedName } from "./utils/text"

// moved to utils/text.ts and imported above

// Types for Booth Config
type BoothActivity = {
  key: string
  active: boolean
  label: string
  category: Category | null
}

type BoothConfigResponse = {
  success: boolean
  booth: {
    id: number
    name: string
    isAct1: boolean
    isAct2: boolean
    isAct3: boolean
    isAct4: boolean
    isAct5: boolean
    isCash: boolean
    isCreditCard: boolean
    isQrcode: boolean
    isActive: boolean
    isPrinterActive: boolean
  }
  activities: BoothActivity[]
  payments: {
    cash: boolean
    creditCard: boolean
    qrcode: boolean
  }
}


function PhotoLauncherPageContent() {
  const router = useRouter()
  const params = useSearchParams()
  const orderId = params.get("orderId") ?? ""
  const { lang, setLang } = useGlobalContext()

  const languages = [
    { code: "tr", name: "Türkçe", flag: "https://flagcdn.com/tr.svg" },
    { code: "en", name: "English", flag: "https://flagcdn.com/us.svg" },
    { code: "es", name: "Español", flag: "https://flagcdn.com/es.svg" },
  ]
  // Para birimi geçici olarak sadece TRY kullanılacak
  // Para birimi geçici olarak sadece TRY kullanılacak
  // const currencies = [
  //   { code: "try", symbol: "₺", label: "TRY" },
  //   // { code: "usd", symbol: "$", label: "USD" },
  //   // { code: "eur", symbol: "€", label: "EUR" },
  // ]

  // // your categories + extra options
  // const options = [
  //   {
  //     id: "selfie",
  //     name: "Selfie",
  //     icon: "/icons/camera.png",
  //     route: "selfie",
  //   },
  //   {
  //     id: "phone",
  //     name: "Phone to Print",
  //     icon: "/icons/print.png",
  //     route: "phoneToPrint",
  //   },
  //   {
  //     id: "roll",
  //     name: "Photo Roll",
  //     icon: "/icons/roll.png",
  //     route: "photoRoll",
  //   },
  //   {
  //     id: "print",
  //     name: "Baskı Al",
  //     icon: "/icons/print-large.png",
  //     route: "print",
  //   },
  //   {
  //     id: "postcard",
  //     name: "Postcard",
  //     icon: "/icons/postcard.png",
  //     route: "postcard",
  //   },
  //   {
  //     id: "biometric",
  //     name: "Biometric",
  //     icon: "/icons/fingerprint.png",
  //     route: "biometric",
  //   },
  // ]

  // const [cur, setCur] = useState(currencies[0].code)
  
  // New State for Booth Config
  const [boothConfig, setBoothConfig] = useState<BoothConfigResponse | null>(null)
  const [isLoadingConfig, setIsLoadingConfig] = useState<boolean>(true)
  
  const [selected, setSelected] = useState<Category | null>(null)
  const [showKVKK, setShowKVKK] = useState(false)
  const [remaining, setRemaining] = useState(60)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // start countdown when modal opens
  useEffect(() => {
    if (!showKVKK) return
    setRemaining(60)
    timerRef.current = setInterval(() => {
      setRemaining((t) => t - 1)
    }, 1000)
    return () => {
      clearInterval(timerRef.current!)
    }
  }, [showKVKK])

  // auto‐close on zero
  useEffect(() => {
    if (remaining <= 0) {
      setShowKVKK(false)
    }
  }, [remaining])

  const handleClick = (opt: Category) => {
    setSelected(opt)
    setShowKVKK(true)
  }

  const onCancel = () => {
    setShowKVKK(false)
  }

  const onAccept = async () => {
    try {
      const boothId = "6825db80c30aaa768bc2e621" // geçici, backend'de olan gerçek bir boothId

      const languageName = languages.find((l) => l.code === lang)?.name
      // const currencyLabel = currencies.find((c) => c.code === cur)?.label

      const response = await api.post("/orders/newOrder", {
        boothId,
        language: languageName,
        categoryId: selected?._id,
        // currency: "TRY",
      })

      if (response.data.success) {
        const createdOrder = response.data.data
        const orderId = createdOrder._id
        console.log("Sipariş başarıyla oluşturuldu:", createdOrder)

        const translatedName = getTranslatedName(selected?.name ?? [], lang)
        router.push(
          `/photoCount?category=${translatedName}&categoryId=${selected?._id}&orderId=${orderId}`
        )
      } else {
        toast.error(response.data.msg)
      }
    } catch (error) {
      console.error("Sipariş oluşturulamadı:", error)
      toast.error("Bir hata oluştu.")
    }
  }

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setIsLoadingConfig(true)
        const res = await api.get("/booth/config")
        if (res.data.success) {
            setBoothConfig(res.data)
        }
      } catch (error) {
        console.error("Booth config alınamadı:", error)
        toast.error("Konfigürasyon yüklenemedi.")
      } finally {
        setIsLoadingConfig(false)
      }
    }

    fetchConfig()
  }, [])

  // Clear photo storage when returning to home (start of new session)
  useEffect(() => {
    localStorage.removeItem("capturedPhotos")
    localStorage.removeItem("printCount")
  }, [])

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-orange-500 to-orange-300 flex flex-col items-center p-6 space-y-4">
      {/* — Language & Currency */}
      <div className="bg-white/30 backdrop-blur-md rounded-xl shadow-lg p-6 flex flex-col items-center space-y-4">
        <h1 className="text-white text-2xl font-bold">
          {translations[lang].title}
        </h1>

        <div className="flex flex-wrap gap-3 justify-center">
          {[
            { code: "tr", name: "Türkçe", flag: "https://flagcdn.com/tr.svg" },
            { code: "en", name: "English", flag: "https://flagcdn.com/us.svg" },
            { code: "de", name: "Deutsch", flag: "https://flagcdn.com/de.svg" },
            {
              code: "fr",
              name: "Français",
              flag: "https://flagcdn.com/fr.svg",
            },
            { code: "ar", name: "العربية", flag: "https://flagcdn.com/sa.svg" },
          ].map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code as Locale)}
              className={`
          flex items-center space-x-2 px-3 py-1 rounded-full border-2 transition
          ${
            lang === l.code
              ? "bg-white/40 border-white"
              : "bg-white/30 border-transparent hover:bg-white/50"
          }
        `}
            >
              <img src={l.flag} alt={l.name} className="w-6 h-4 rounded-sm" />
              <span className="text-sm font-medium text-white">{l.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* — Category Carousel */}
      <div className="w-[90%] flex-1 flex items-center justify-center overflow-x-auto   ">
        <div className="flex min-w-[85%] justify-center space-x-6 py-4 px-6 mx-auto">
          {isLoadingConfig
            ? Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={`skeleton-${idx}`}
                  className="flex-shrink-0 w-64 bg-white/20 backdrop-blur-md rounded-2xl p-6 min-h-[45vh] animate-pulse"
                >
                  <div className="p-10 bg-white/40 rounded-lg flex items-center justify-center mb-4">
                    <div className="w-20 h-20 bg-white/60 rounded" />
                  </div>
                  <div className="h-7 w-40 bg-white/40 rounded mb-3" />
                  <div className="h-6 w-24 bg-white/30 rounded" />
                </div>
              ))
            : boothConfig?.activities
                .filter((act) => act.active && act.category)
                .map((act) => {
                  const opt = act.category!
                  // Use the label from Booth Config if desired, or the one from Category object.
                  // User requested "Büyüle Selfie" etc. based on flags. The implementation in Node maps these labels.
                  // However, the Category Object also has `name` (which might be an object {tr:..., en:...}).
                  // Let's use `getTranslatedName(opt.name)` as before to support multi-lang, 
                  // but we are filtering by the Admin Flag.
                  const displayName = getTranslatedName(opt.name, lang)

                  return (
                    <button
                      key={act.key} // use act.key (isAct1 etc) or opt._id
                      onClick={() => handleClick(opt)}
                      className="flex-shrink-0 w-64  bg-white/30 backdrop-blur-md rounded-2xl p-6 hover:scale-105 transition-transform flex flex-col items-center justify-center min-h-[45vh]"
                    >
                      <div className="p-10 bg-white/50 rounded-lg flex items-center justify-center mb-4">
                        <img
                          src={"/icons/camera.png"}
                          alt={displayName}
                          className="w-20 h-20"
                        />
                      </div>
                      <span className="text-3xl font-semibold text-white mb-1">
                        {displayName}
                      </span>
                      {(() => {
                        const symbol = "₺"
                        const value: number = opt.price
                        return (
                          <span className="text-2xl text-white">
                            {symbol} {value}
                          </span>
                        )
                      })()}
                    </button>
                  )
                })}
        </div>
      </div>
      {/* — KVKK Modal (tabsız sürüm) */}
      {showKVKK && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[999]">
          <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-[60%] p-6 flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-2xl font-bold">
                  {translations[lang].modalTitle}
                </h2>
                <p className="text-sm text-gray-600">
                  6698 sayılı KVKK kapsamındaki Aydınlatma Metni ve Açık Rıza
                  Beyanı
                </p>
              </div>
              {/* countdown badge */}
              <div className="bg-orange-600 text-white text-2xl rounded-xl px-4 py-2 flex items-center justify-center font-mono shrink-0 whitespace-nowrap">
                {translations[lang].remainingTime} {remaining}s
              </div>
            </div>

            {/* Content */}
            <div className="h-[50vh] overflow-y-auto rounded-lg  p-4 text-gray-800 text-sm leading-relaxed">
              <article className="space-y-6">
                {/* Aydınlatma Metni */}
                <section>
                  <h3 className="text-base font-semibold mb-2">
                    Kişisel Verilerin İşlenmesine İlişkin Aydınlatma Yükümlülüğü
                  </h3>
                  <p>
                    SYMTECH Teknoloji Hiz. Tic. A.Ş. veri güvenliğine büyük önem
                    vermektedir. Bu metin, 6698 sayılı Kişisel Verilerin
                    Korunması Kanunu (KVKK) m.10 kapsamındaki aydınlatma
                    yükümlülüğünü yerine getirmek amacıyla hazırlanmıştır.
                    Aydınlatma metni, yürürlükteki mevzuatta yapılabilecek
                    değişiklikler çerçevesinde güncellenebilecektir.
                  </p>
                </section>

                <section>
                  <h4 className="font-medium mb-1">
                    İşleme Amaçları ve Aktarım
                  </h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      AVM’de kullanılan cihaz aracılığıyla işlenen e-posta
                      adresiniz ve fotoğraflarınız herhangi bir yere aktarılmaz;
                      yalnızca tarafınıza iletilmek amacıyla işlenir.
                    </li>
                    <li>
                      Yasal yükümlülüklerimizi yerine getirebilmek ve mevzuattan
                      doğan haklarımızı kullanabilmek amacıyla, gerekli hallerde
                      yetkili mercilere aktarım yapılabilir.
                    </li>
                    <li>
                      Üçüncü kişilerle paylaşım; aydınlatma yükümlülüğü yerine
                      getirilerek ve açık rızanız alınarak, izin çerçevesinde
                      gerçekleştirilir.
                    </li>
                    <li>
                      İşlenen kişisel verileriniz <strong>1 gün</strong> sonra
                      otomatik olarak silinir/imha edilir.
                    </li>
                  </ul>
                </section>

                <section>
                  <h4 className="font-medium mb-1">
                    Toplama Yöntemi ve Hukuki Sebep
                  </h4>
                  <p className="mb-2">
                    Fotoğraf içeren kişisel verileriniz elektronik ortamda,
                    cihaz üzerindeki yazılım aracılığıyla toplanır.
                  </p>
                  <p className="mb-2">
                    İş Kanunu, İş Sağlığı ve Güvenliği mevzuatı, İnternet
                    Ortamında Yapılan Yayınların Düzenlenmesi Hakkında Kanun,
                    Türk Ticaret Kanunu, Türk Borçlar Kanunu ve 6698 sayılı KVKK
                    gibi ilgili mevzuat kapsamında; veri sorumlusunun meşru
                    menfaati veya diğer hukuki sebeplere dayanılarak işlenir.
                  </p>
                </section>

                <section>
                  <h4 className="font-medium mb-1">Veri Güvenliği ve Haklar</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      Kişisel veriler hukuka uygun şekilde işlenir ve korunur.
                    </li>
                    <li>
                      KVKK m.11 uyarınca; verilerinizin işlenip işlenmediğini
                      öğrenme, işleme amacını ve aktarım yapılan üçüncü kişileri
                      öğrenme, eksik/yanlış işlenmişse düzeltilmesini talep
                      etme, silinmesini veya yok edilmesini isteme gibi haklara
                      sahipsiniz.
                    </li>
                  </ul>
                </section>

                <section>
                  <h4 className="font-medium mb-2">
                    Veri Sorumlusu ve İletişim
                  </h4>
                  <dl className="grid grid-cols-12 gap-y-1">
                    <dt className="col-span-3 text-gray-600">Unvan</dt>
                    <dd className="col-span-9">
                      SYMTECH Teknoloji Hiz. Tic. A.Ş.
                    </dd>

                    <dt className="col-span-3 text-gray-600">Adres</dt>
                    <dd className="col-span-9">
                      Kavacık Mah. Devran Sk. No:10 Beykoz / İSTANBUL
                    </dd>

                    <dt className="col-span-3 text-gray-600">E-Posta</dt>
                    <dd className="col-span-9">
                      <a
                        href="mailto:info@socialboothturkey.com"
                        className="underline hover:no-underline"
                      >
                        info@socialboothturkey.com
                      </a>
                    </dd>
                  </dl>
                </section>

                <hr className="border-gray-200" />

                {/* Açık Rıza Beyanı */}
                <section>
                  <h3 className="text-base font-semibold mb-2">
                    6698 SAYILI KANUN UYARINCA AÇIK RIZA BEYANI
                  </h3>
                  <p className="mb-2">
                    6698 sayılı KVKK gereği şirketimiz veri sorumlusudur. AVM
                    müşterisi olmanız ve bu cihazı kullanmanız sebebiyle,
                    kişisel verilerin kullanımı konusunda “Aydınlatma Metni” ile
                    bilgilendirildiniz.
                  </p>
                  <h4 className="font-medium mb-1">
                    Açık Rızası Talep Edilen Veriler
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 mb-2">
                    <li>İletişim bilgisi (e-posta adresi)</li>
                    <li>
                      Fotoğraf (duruma göre özel nitelikli kişisel veri
                      sayılabilir)
                    </li>
                  </ul>
                  <h4 className="font-medium mb-1">Amaç ve Saklama Süresi</h4>
                  <ul className="list-disc pl-5 space-y-1 mb-2">
                    <li>
                      Fotoğrafınızın işlenerek tarafınıza iletilmesi amacıyla
                      e-posta bilginiz ve fotoğrafınız işlenir.
                    </li>
                    <li>
                      Veriler KVKK ve ilgili mevzuata uygun olarak işlenir.
                    </li>
                  </ul>
                  <h4 className="font-medium mb-1">Bilinçli Onay</h4>
                  <p>
                    Fotoğraf kabinini kullandığınızda, belirtilen amaçlar için
                    bazı kişisel verilerinizin kullanılmasına özgür iradenizle
                    açık rıza vermiş olursunuz.
                  </p>
                </section>
              </article>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-gray-200 rounded-xl hover:bg-gray-300 transition"
              >
                {translations[lang].cancelButton}
              </button>
              <button
                onClick={onAccept}
                className="px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition disabled:opacity-60"
              >
                {translations[lang].acceptButton}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PhotoLauncherPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-orange-500 to-orange-300 flex items-center justify-center">
          <div className="text-white text-xl">Loading...</div>
        </div>
      }
    >
      <PhotoLauncherPageContent />
    </Suspense>
  )
}
