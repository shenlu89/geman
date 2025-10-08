const HeaderNavLinks = [
  {
    title: "About",
    href: "/about",
  },
];

const HomePage = {
  metadata: {
    metadataBase: new URL("https://mathcheap.xyz"),
    title: {
      default: "Mathcheap - An AI-powered, free alternative to Mathpix Snip.",
      template: `%s | Mathcheap`,
    },
    description: "An AI-powered, free alternative to Mathpix Snip.",
    keywords: [
      "Mathcheap",
      "Mathcheap OCR",
      "Mathcheap LaTeX Editor",
      "Math Editor",
      "Equation Editor",
      "Formula Editor",
      "Online Math Editor",
      "Online Equation Editor",
      "LaTeX Editor",
      "Typst OCR",
      "Math OCR",
      "Math Image to LaTeX",
      "Math Image to Typst",
      "Mathpix Alternative",
      "Free Math Editor",
      "AI Math Tool",
      "Convert Math Image",
      "Convert Handwritten Math",
      "Math Handwriting OCR",
      "Math Photo to LaTeX",
    ],
    openGraph: {
      title: "Mathcheap",
      description: "An AI-powered, free alternative to Mathpix Snip.",
      url: "https://mathcheap.xyz",
      siteName: "Mathcheap",
      locale: "en-US",
      type: "website",
    },
    twitter: {
      title: "Mathcheap",
      card: "summary_large_image",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-snippet": -1,
      },
    },
  },
  title: "Mathcheap",
  description: "An AI-powered, free alternative to Mathpix Snip.",
  url: "https://mathcheap.xyz",
  avatar_url: "/images/logo.svg",
};

const AboutPage = {
  metadata: { title: "About", description: "That is all about Mathcheap" },
};

export { HomePage, AboutPage, HeaderNavLinks };
