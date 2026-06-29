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
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://trash2treasure.co.in/#organization",
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
      },
      {
        "@type": "WebSite",
        "@id": "https://trash2treasure.co.in/#website",
        "url": "https://trash2treasure.co.in",
        "name": "Trash2Treasure",
        "description": "Turn Trash into Rewards & Save the Planet",
        "publisher": {
          "@id": "https://trash2treasure.co.in/#organization"
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://trash2treasure.co.in/?q={search_term_string}"
          },
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "WebApplication",
        "@id": "https://trash2treasure.co.in/#webapplication",
        "name": "Trash2Treasure",
        "url": "https://trash2treasure.co.in",
        "image": "https://trash2treasure.co.in/icon.png",
        "description": "Gamified waste management and recycling rewards platform.",
        "applicationCategory": "BusinessApplication, Environment",
        "operatingSystem": "All",
        "author": {
          "@id": "https://trash2treasure.co.in/#organization"
        }
      },
      {
        "@type": "FAQPage",
        "@id": "https://trash2treasure.co.in/#faq",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What is Trash2Treasure?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Trash2Treasure is a gamified waste management and recycling rewards platform. It enables citizens in Telangana to recycle responsibly and earn reward points that can be redeemed for partner brand vouchers."
            }
          },
          {
            "@type": "Question",
            "name": "How does Trash2Treasure work?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "It works in three simple steps: 1. Collect & Sort your recyclables (plastics, paper, metal, electronics). 2. Upload a photo of the sorted waste inside the app where our ML model and admin team verifies it. 3. Earn points and redeem them for exciting rewards."
            }
          },
          {
            "@type": "Question",
            "name": "What kind of rewards can I earn?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "You can redeem your points for premium partner vouchers, including food & dining vouchers (Starbucks, McDonald's, Domino's), OTT subscriptions, and eco-friendly products like bamboo items."
            }
          },
          {
            "@type": "Question",
            "name": "Where is Trash2Treasure active?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Trash2Treasure is active as part of Telangana's green revolution in India, promoting clean communities, reducing municipal landfill waste, and driving local recycling efforts."
            }
          }
        ]
      }
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
