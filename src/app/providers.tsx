// app/providers.tsx
"use client"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <>
      {children}
      <ToastContainer
        position="top-right"
        newestOnTop
        theme="dark"
        closeOnClick
        pauseOnHover
      />
    </>
  )
}
