import type { NextPage } from "next";
import Link from "@/components/custom-link";
import { FaXTwitter, FaGithub, FaDiscord } from "react-icons/fa6";

export const Footer: NextPage = () => {
  return (
    <footer className="max-w-6xl container mx-auto md:flex hidden h-16">
      <div className="flex justify-between w-full mx-4 py-4 border border-x-0 border-b-0 border-t-slate-200">
        <div className="flex items-center bg-gray-50 text-gray-500 w-full justify-between max-w-6xl mx-auto">
          <p>
            {`© ${new Date().getFullYear()} `}
            <Link
              className="hover:text-gray-800 hover:underline underline-offset-2"
              href={"https://shenlu.me"}
              title="Shen Lu"
            >
              Shen Lu
            </Link>
            {`. All the rights reserved.`}
          </p>
          <ul className="flex items-center space-x-2">
            <Link
              href={"https://x.com/shenlu89"}
              title="X"
            >
              <FaXTwitter className="size-6" />
            </Link>
            <Link
              href={"https://discord.gg/aeNbhwng4E"}
              title="Discord"
            >
              <FaDiscord className="size-6" />
            </Link>
            <Link
              href={"https://github.com/shenlu89/geman"}
              title="GitHub"
            >
              <FaGithub className="size-6" />
            </Link>
          </ul>
        </div>
      </div>
    </footer>
  );
};
