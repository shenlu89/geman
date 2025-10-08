"use client";
import { HeaderNavLinks } from "@/data/meta-data";
import type { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Package from "@/package.json";
import logo from "@/public/logo.svg";

const Navbar: NextPage = () => {
  const pathname = usePathname();
  return (
    <header className="md:flex justify-between px-4 py-2 select-none hidden">
      <div className="flex space-x-2">
        <Image
          className="self-center"
          src={logo}
          alt={"Geman"}
          width={36}
          height={36}
          priority
        />
        <Link href={"/"} className="flex self-center text-2xl font-extrabold">
          Geman
        </Link>
        <Link href="/changelog">
          <sub>{`v${Package.version}`}</sub>
        </Link>
      </div>
      <nav className="flex text-lg">
        <ul className="flex flex-1 justify-center md:flex-row md:justify-start space-x-4 md:space-x-0">
          {HeaderNavLinks?.map((nav: any) => (
            <li key={nav?.title}>
              <Link
                className={`flex p-2 underline-offset-3 hover:underline
                ${pathname === nav?.href
                    ? "text-black underline"
                    : "text-slate-600 hover:text-black"
                  }`}
                href={nav?.href}
              >
                {nav?.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
};

export default Navbar;
