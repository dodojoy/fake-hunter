import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fake Hunter",
    short_name: "Fake Hunter",
    description:
      "Jogo educativo: seja o checador de fatos de Vale Verde e aprenda a identificar desinformação.",
    lang: "pt-BR",
    start_url: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#1b2a41",
    theme_color: "#1b2a41",
    categories: ["education", "games"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
