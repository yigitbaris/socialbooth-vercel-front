// api.tsx with offline fallback support
import axios, { AxiosRequestConfig, AxiosResponse } from "axios"
import {
  isOffline,
  OFFLINE_BOOTH_CONFIG,
  OFFLINE_CATEGORIES,
  OFFLINE_BACKGROUNDS,
  OFFLINE_EFFECTS,
  createOfflineOrder,
  getOfflineOrder,
  saveOfflineOrder,
} from "./offlineData"

const axiosInstance = axios.create({
  baseURL: "/api/v1",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
})

// Offline response handler
const getOfflineResponse = (url: string, data?: any): any => {
  console.log("[Offline API] Handling:", url)

  // GET requests
  if (url.includes("/booth/config")) {
    return OFFLINE_BOOTH_CONFIG
  }
  if (url.includes("/categories/getAllCategories")) {
    return OFFLINE_CATEGORIES
  }
  if (url.includes("/backgrounds/getAllBackgrounds")) {
    return OFFLINE_BACKGROUNDS
  }
  if (url.includes("/effects/getAllFilters")) {
    return OFFLINE_EFFECTS
  }
  if (url.includes("/orders/getOrder/")) {
    const orderId = url.split("/orders/getOrder/")[1]
    return getOfflineOrder(orderId)
  }

  // POST requests
  if (url.includes("/orders/newOrder") && data) {
    const order = createOfflineOrder(data.categoryId, data.language || "Türkçe")
    saveOfflineOrder(order.data)
    return order
  }

  // Default fallback
  return { success: true, data: null, offline: true }
}

// Wrapped API with offline fallback
const api = {
  get: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    // Check if offline first
    if (isOffline()) {
      console.log("[Offline Mode] Returning mock data for:", url)
      return {
        data: getOfflineResponse(url) as T,
        status: 200,
        statusText: "OK (Offline)",
        headers: {},
        config: config || {},
      } as AxiosResponse<T>
    }

    // Try online request
    try {
      return await axiosInstance.get<T>(url, config)
    } catch (error) {
      console.warn("[API Error] Falling back to offline data:", url, error)
      return {
        data: getOfflineResponse(url) as T,
        status: 200,
        statusText: "OK (Fallback)",
        headers: {},
        config: config || {},
      } as AxiosResponse<T>
    }
  },

  post: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    // Check if offline first
    if (isOffline()) {
      console.log("[Offline Mode] Returning mock data for POST:", url)
      return {
        data: getOfflineResponse(url, data) as T,
        status: 200,
        statusText: "OK (Offline)",
        headers: {},
        config: config || {},
      } as AxiosResponse<T>
    }

    // Try online request
    try {
      return await axiosInstance.post<T>(url, data, config)
    } catch (error) {
      console.warn("[API Error] Falling back to offline data for POST:", url, error)
      return {
        data: getOfflineResponse(url, data) as T,
        status: 200,
        statusText: "OK (Fallback)",
        headers: {},
        config: config || {},
      } as AxiosResponse<T>
    }
  },

  put: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    // Check if offline first
    if (isOffline()) {
      console.log("[Offline Mode] Returning mock data for PUT:", url)
      return {
        data: { success: true, offline: true } as T,
        status: 200,
        statusText: "OK (Offline)",
        headers: {},
        config: config || {},
      } as AxiosResponse<T>
    }

    // Try online request
    try {
      return await axiosInstance.put<T>(url, data, config)
    } catch (error) {
      console.warn("[API Error] Falling back to offline data for PUT:", url, error)
      return {
        data: { success: true, offline: true } as T,
        status: 200,
        statusText: "OK (Fallback)",
        headers: {},
        config: config || {},
      } as AxiosResponse<T>
    }
  },

  delete: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    if (isOffline()) {
      console.log("[Offline Mode] Returning mock data for DELETE:", url)
      return {
        data: { success: true, offline: true } as T,
        status: 200,
        statusText: "OK (Offline)",
        headers: {},
        config: config || {},
      } as AxiosResponse<T>
    }

    try {
      return await axiosInstance.delete<T>(url, config)
    } catch (error) {
      console.warn("[API Error] Falling back to offline data for DELETE:", url, error)
      return {
        data: { success: true, offline: true } as T,
        status: 200,
        statusText: "OK (Fallback)",
        headers: {},
        config: config || {},
      } as AxiosResponse<T>
    }
  },

  patch: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    if (isOffline()) {
      console.log("[Offline Mode] Returning mock data for PATCH:", url)
      return {
        data: { success: true, offline: true } as T,
        status: 200,
        statusText: "OK (Offline)",
        headers: {},
        config: config || {},
      } as AxiosResponse<T>
    }

    try {
      return await axiosInstance.patch<T>(url, data, config)
    } catch (error) {
      console.warn("[API Error] Falling back to offline data for PATCH:", url, error)
      return {
        data: { success: true, offline: true } as T,
        status: 200,
        statusText: "OK (Fallback)",
        headers: {},
        config: config || {},
      } as AxiosResponse<T>
    }
  },

  // Keep raw axios for special cases
  raw: axiosInstance,
}

export default api

export const baseUrl = "http://localhost:3001"
export const apiUrl = "http://localhost:3001/api/v1"
