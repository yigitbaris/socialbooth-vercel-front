// Offline Mock Data for PWA

// Generate unique ID for offline orders
export const generateOfflineId = () => `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

// Büyülü Selfie Category Mock
export const OFFLINE_CATEGORY = {
  _id: "offline_category_buyulu_selfie",
  name: [
    { lang: "tr", value: "Büyülü Selfie" },
    { lang: "en", value: "Magic Selfie" },
    { lang: "de", value: "Magisches Selfie" },
    { lang: "fr", value: "Selfie Magique" },
    { lang: "ar", value: "سيلفي سحري" },
  ],
  price: 50,
  photoCount: 1,
  isActive: true,
}

// Booth Config Mock (simulates /booth/config response)
export const OFFLINE_BOOTH_CONFIG = {
  success: true,
  booth: {
    id: 1,
    name: "Offline Booth",
    isAct1: true,
    isAct2: false,
    isAct3: false,
    isAct4: false,
    isAct5: false,
    isCash: true,
    isCreditCard: false,
    isQrcode: false,
    isActive: true,
    isPrinterActive: true,
  },
  activities: [
    {
      key: "isAct1",
      active: true,
      label: "Büyülü Selfie",
      category: OFFLINE_CATEGORY,
    },
  ],
  payments: {
    cash: true,
    creditCard: false,
    qrcode: false,
  },
}

// Categories Mock (simulates /categories/getAllCategories response)
export const OFFLINE_CATEGORIES = {
  success: true,
  data: [OFFLINE_CATEGORY],
}

// Backgrounds Mock - using actual files from public/backgrounds
export const OFFLINE_BACKGROUNDS = {
  success: true,
  categories: ["Doğa", "Şehir", "Çocuk", "Fantastik", "Futbol", "Safari", "Renkler", "Grafik"],
  data: [
    // Nature
    { _id: "bg_nature_01", category: "Doğa", imageLink: "/backgrounds/nature/background_01.jpg" },
    { _id: "bg_nature_04", category: "Doğa", imageLink: "/backgrounds/nature/background_04.jpg" },
    { _id: "bg_nature_05", category: "Doğa", imageLink: "/backgrounds/nature/background_05.jpg" },
    { _id: "bg_nature_07", category: "Doğa", imageLink: "/backgrounds/nature/background_07.jpg" },
    // City
    { _id: "bg_city_03", category: "Şehir", imageLink: "/backgrounds/city/background_03.jpg" },
    { _id: "bg_city_22", category: "Şehir", imageLink: "/backgrounds/city/background_22.jpg" },
    { _id: "bg_city_23", category: "Şehir", imageLink: "/backgrounds/city/background_23.jpg" },
    // Kids
    { _id: "bg_kids_06", category: "Çocuk", imageLink: "/backgrounds/kids/background_06.jpg" },
    { _id: "bg_kids_11", category: "Çocuk", imageLink: "/backgrounds/kids/background_11.jpg" },
    // Fantastic
    { _id: "bg_fantastic_10", category: "Fantastik", imageLink: "/backgrounds/fantastic/background_10.jpg" },
    { _id: "bg_fantastic_18", category: "Fantastik", imageLink: "/backgrounds/fantastic/background_18.jpg" },
    // Football
    { _id: "bg_football_13", category: "Futbol", imageLink: "/backgrounds/football/background_13.jpg" },
    { _id: "bg_football_14", category: "Futbol", imageLink: "/backgrounds/football/background_14.jpg" },
    // Safari
    { _id: "bg_safari_02", category: "Safari", imageLink: "/backgrounds/safari/background_02.jpg" },
    { _id: "bg_safari_29", category: "Safari", imageLink: "/backgrounds/safari/background_29.jpg" },
    // Colors
    { _id: "bg_colors_55", category: "Renkler", imageLink: "/backgrounds/colors/background_55.jpg" },
    { _id: "bg_colors_56", category: "Renkler", imageLink: "/backgrounds/colors/background_56.jpg" },
    // Graphic
    { _id: "bg_graphic_09", category: "Grafik", imageLink: "/backgrounds/graphic/background_09.jpg" },
  ],
}

// Effects/Filters Mock - using actual files from public/filters
export const OFFLINE_EFFECTS = {
  success: true,
  data: [
    { _id: "filter01", name: "Filter 1", imageLink: "/filters/filter01.png", translations: { tr: "Filtre 1", en: "Filter 1" } },
    { _id: "filter02", name: "Filter 2", imageLink: "/filters/filter02.png", translations: { tr: "Filtre 2", en: "Filter 2" } },
    { _id: "filter03", name: "Filter 3", imageLink: "/filters/filter03.png", translations: { tr: "Filtre 3", en: "Filter 3" } },
  ],
}

// Order Creation Mock (simulates /orders/newOrder response)
export const createOfflineOrder = (categoryId: string, language: string) => ({
  success: true,
  data: {
    _id: generateOfflineId(),
    categoryId: OFFLINE_CATEGORY,
    language,
    status: "pending",
    createdAt: new Date().toISOString(),
    isOffline: true,
  },
})

// Get Order Mock (simulates /orders/getOrder/:orderId response)
export const getOfflineOrder = (orderId: string) => ({
  success: true,
  data: {
    _id: orderId,
    categoryId: OFFLINE_CATEGORY,
    language: "Türkçe",
    status: "pending",
    totalAmount: OFFLINE_CATEGORY.price,
    createdAt: new Date().toISOString(),
    isOffline: orderId.startsWith("offline_"),
  },
})

// Check if we're offline
export const isOffline = () => typeof navigator !== "undefined" && !navigator.onLine

// Store offline orders for later sync
const OFFLINE_ORDERS_KEY = "sb:offline:orders"

export const saveOfflineOrder = (order: any) => {
  try {
    const existing = JSON.parse(localStorage.getItem(OFFLINE_ORDERS_KEY) || "[]")
    existing.push(order)
    localStorage.setItem(OFFLINE_ORDERS_KEY, JSON.stringify(existing))
  } catch (e) {
    console.warn("Failed to save offline order", e)
  }
}

export const getOfflineOrders = () => {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_ORDERS_KEY) || "[]")
  } catch {
    return []
  }
}

export const clearOfflineOrders = () => {
  localStorage.removeItem(OFFLINE_ORDERS_KEY)
}
