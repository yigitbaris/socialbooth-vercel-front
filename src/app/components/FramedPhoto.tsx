import React from "react"

type Insets = { top: string; right: string; bottom: string; left: string }

const FRAME_INSETS: Insets = {
  top: "3.1%",
  right: "4.7%",
  bottom: "23.5%",
  left: "5%",
}

export default function FramedPhoto({
  src,
  alt = "Photo",
  insets = FRAME_INSETS,
  fit = "cover",
}: {
  src: string
  alt?: string
  insets?: Insets
  fit?: "cover" | "contain"
}) {
  return (
    <div className="relative w-[60%] aspect-[1181/1772] mx-auto">
      {/* Fotoğraf bölgesi: inset'lerle konumlandır, içinde img %100 doldursun */}
      <div
        className="absolute"
        style={{
          top: insets.top,
          right: insets.right,
          bottom: insets.bottom,
          left: insets.left,
          //borderRadius: "12px",
          overflow: "hidden",
          zIndex: 0,
        }}
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-center"
          style={{ objectFit: fit }}
        />
      </div>

      {/* Çerçeve üstte kalsın */}
      <img
        src="/assets/frame.png"
        alt="Frame"
        className="absolute inset-0 w-full h-full pointer-events-none select-none"
        style={{ zIndex: -1 }}
        draggable={false}
      />
    </div>
  )
}
