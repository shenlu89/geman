import Link from "@/components/custom-link";
import { FaDiscord, FaGithub } from "react-icons/fa6";

export function SocialLinks() {
    return (
        <div className="flex flex-col items-center gap-3 text-slate-600 border-t border-slate-200 pt-6">
            <ul className="flex justify-center items-center gap-2">
                {[
                    { title: "Discord", href: "https://discord.gg/aeNbhwng4E", icon: <FaDiscord className="w-full" /> },
                    {
                        title: "GitHub", href: "https://github.com/shenlu89/geman", icon: (
                            <FaGithub className="size-8 fill-slate-600 !bg-white group-hover:fill-black" />
                        )
                    },
                ].map((social) => (
                    <Link
                        className="flex size-8 justify-center items-center rounded-full border bg-slate-600 hover:bg-black text-white group"
                        title={social.title}
                        key={social.title}
                        href={social.href}
                    >
                        {social.icon}
                    </Link>
                ))}
            </ul>
            <p className="text-sm">© {new Date().getFullYear()} by Shen Lu</p>
        </div>
    );
}