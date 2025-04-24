import localFont from "next/font/local"

export const rexton = localFont({
  variable: "--font-rexton",
  src: [{ path: "./Rexton/rexton-bold.otf", weight: "700", style: "normal" }],
  display: "swap",
})

export const maisonNeue = localFont({
  variable: "--font-maison-neue",
  src: [
    {
      path: "./MaisonNeue/Maison_Neue_Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "./MaisonNeue/Maison_Neue_Book.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./MaisonNeue/Maison_Neue_Light.ttf",
      weight: "300",
      style: "normal",
    },
  ],
  display: "swap",
})

export const maisonNeueMono = localFont({
  variable: "--font-maison-neue-mono",
  src: [
    {
      path: "./MaisonNeue/Maison_Neue_Mono.ttf",
      weight: "400",
      style: "normal",
    },
  ],
  display: "swap",
})
