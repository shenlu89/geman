import Link from "@/components/custom-link";
import { FaDiscord, FaGithub, FaWeixin, FaXTwitter } from "react-icons/fa6";

const SocialIcons = [
  {
    title: "Discord",
    href: "https://discord.gg/aeNbhwng4E",
    icon: <FaDiscord className="w-full" />,
  },
  {
    title: "X",
    href: "https://x.com/shenlu89",
    icon: <FaXTwitter className="w-full" />,
  },
  {
    title: "GitHub",
    href: "https://github.com/shenlu89/geman",
    icon: (
      <FaGithub className="size-8 fill-slate-600 !bg-white group-hover:fill-black" />
    ),
  },
];

export default function Footer() {
  return (
    <footer className="md:flex justify-between items-center p-4 select-none text-slate-600 hidden">
      <p className="underline-offset-3">
        © {new Date().getFullYear()} by Shen Lu
      </p>
      <div className="flex items-center gap-2">
        <ul className="flex justify-center items-center space-x-2">
          {SocialIcons.map((social) => (
            <Link
              className="flex size-8 justify-center items-center rounded-sm-full border bg-slate-600 hover:bg-black text-white group"
              title={social.title}
              key={social.title}
              href={social.href}
            >
              {social.icon}
            </Link>
          ))}
        </ul>
      </div>
    </footer>
  );
}
