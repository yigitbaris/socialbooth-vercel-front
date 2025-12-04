import { Locale } from "./translations"

export const testType = {
  name: String,
}

export interface Category {
  _id: string
  name: string | Array<Record<Locale, string>>
  description: string
  price: number
  priceUSD?: number
  priceEUR?: number
  isActive: boolean
}
