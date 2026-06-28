import type { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "Trash2Treasure | Turn Trash into Rewards & Save the Planet",
  description: "Gamified waste management platform that rewards users for responsible recycling. Join Telangana's green revolution today!",
  alternates: {
    canonical: "https://trash2treasure.co.in",
  },
};

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Trash2Treasure",
    "url": "https://trash2treasure.co.in",
    "logo": "https://trash2treasure.co.in/icon.png",
    "description": "Gamified waste management platform that rewards users for responsible recycling.",
    "sameAs": [
      "https://www.facebook.com/t2tindia",
      "https://www.instagram.com/t2t_india",
      "https://x.com/t2t_india",
      "https://www.linkedin.com/in/trash-2-treasure-2614223b3"
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClient />
    </>
  );
}
