// eski api.tsx
import axios from "axios"

const api = axios.create({
  baseURL: "/api/v1", // relative! (proxy çalışsın diye)
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // çerez kullanıyorsan
})

export default api

export const baseUrl = "http://booth-api.cloud.solucharger.com"
// export const apiUrl = "http://localhost:3000/api/v1"
export const apiUrl = "http://booth-api.cloud.solucharger.com/api/v1"
