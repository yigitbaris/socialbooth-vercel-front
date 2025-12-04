// eski api.tsx
/*
import axios from "axios"

const api = axios.create({
  baseURL: "http://localhost:3001/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
})

export default api
*/

import axios from "axios"

const api = axios.create({
  baseURL: "/api/v1", // relative! (proxy çalışsın diye)
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // çerez kullanıyorsan
})

export default api

export const baseUrl = "http://74.234.77.71:27020"
//export const apiUrl = "http://localhost:3000/api/v1"
export const apiUrl = "http://74.234.77.71:27020/api/v1"
