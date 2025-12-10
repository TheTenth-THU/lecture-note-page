import localFont from "next/font/local";

/* --- Latin fonts --- */

export const stoneSerif = localFont({
  variable: "--font-stone-serif",
  src: [
    {
      path: "../../../public/fonts/StoneSerifITCProMedium.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../../public/fonts/StoneSerifITCProMediumIt.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "../../../public/fonts/StoneSerifITCProSemiBd.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../../public/fonts/StoneSerifITCProSemiBdIt.woff2",
      weight: "600",
      style: "italic",
    },
    {
      path: "../../../public/fonts/StoneSerifITCProBold.woff2",
      weight: "800",
      style: "normal",
    },
    {
      path: "../../../public/fonts/StoneSerifITCProBoldIt.woff2",
      weight: "800",
      style: "italic",
    },
  ],
});

/* --- Chinese font --- */

export const wenHeiSans = localFont({
  variable: "--font-wen-hei-sans",
  src: [
    {
      path: "../../../public/fonts/汉仪文黑-45W.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../../public/fonts/汉仪文黑-45W.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "../../../public/fonts/汉仪文黑-85W.woff2",
      weight: "800",
      style: "normal",
    },
    {
      path: "../../../public/fonts/汉仪文黑-85W.woff2",
      weight: "800",
      style: "italic",
    },
  ],
});

export const runYuanSerif = localFont({
  variable: "--font-run-yuan-serif",
  src: [
    {
      path: "../../../public/fonts/汉仪润圆-45W.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../../public/fonts/汉仪润圆-45W.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "../../../public/fonts/汉仪润圆-75W.woff2",
      weight: "800",
      style: "normal",
    },
    {
      path: "../../../public/fonts/汉仪润圆-75W.woff2",
      weight: "800",
      style: "italic",
    },
  ],
});
