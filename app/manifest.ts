import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SpeakQL — Professional Communication & Language Learning",
    short_name: "SpeakQL",
    description: "Adaptive professional communication and language learning platform practiced in realistic workplace contexts.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#060919",
    theme_color: "#060919",
    orientation: "any",
    categories: ["education", "productivity"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
