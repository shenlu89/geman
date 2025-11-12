import { LayoutDashboard, KeySquare, TestTubeDiagonal } from "lucide-react";

const HeaderNavLinks = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "API Keys",
    href: "/keys",
    icon: KeySquare,
  },
  {
    title: "Playground",
    href: "/playground",
    icon: TestTubeDiagonal,
  },
];

const HomePage = {
  metadata: {
    metadataBase: new URL("https://geman.shenlu.me"),
    title: {
      default: "Geman - Gemini API proxy and load balancing service",
      template: `%s | Geman`,
    },
    description: "Gemini API proxy and load balancing service",
  },
  title: "Geman",
  description: "Gemini API proxy and load balancing service",
  url: "https://geman.shenlu.me",
};

export { HomePage, HeaderNavLinks };
