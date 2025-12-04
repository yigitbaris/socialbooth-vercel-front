"use client"
import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  Dispatch,
  SetStateAction,
} from "react"
import { Locale } from "../utils/translations"

// --- Context Value Tipi ---
type GlobalContextType = {
  lang: Locale
  setLang: Dispatch<SetStateAction<Locale>>
}

// --- Varsayılan Context Değeri ---
const defaultContext: GlobalContextType = {
  lang: "tr",
  setLang: () => {}, // placeholder, provider ile değişecek
}

// --- Context ---
const GlobalContext = createContext<GlobalContextType>(defaultContext)

// --- Provider ---
export const GlobalContextProvider = ({
  children,
}: {
  children: ReactNode
}) => {
  const [lang, setLang] = useState<Locale>("tr")

  const value: GlobalContextType = { lang, setLang }

  return (
    <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>
  )
}

// --- Hook ile Kolay Erişim ---
export const useGlobalContext = () => useContext(GlobalContext)
