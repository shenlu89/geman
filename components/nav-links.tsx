'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HeaderNavLinks } from '../data/meta-data';

export function NavLinks() {
  const pathname = usePathname();

  return (
    <ul className="flex items-center w-full md:w-auto justify-between">
      <li className="flex">
        <Link
          href={'/'}
          className="flex md:px-3 px-0 md:py-2 py-0 items-center space-x-2 hover:text-gray-600 justify-center outline-none"
        >
          <span className="md:hidden flex">Account</span>
        </Link>
      </li>
      {HeaderNavLinks?.map((nav) => {
        const Icon = nav.icon;
        const isActive = pathname === nav.href;

        return (
          <li key={nav.title} className="flex">
            <Link
              href={nav.href}
              className={`flex md:px-3 px-0 md:py-2 py-0 items-center space-x-1 hover:text-black justify-center outline-none ${isActive ? 'text-black' : 'text-gray-600'
                }`}
            >
              <Icon
                className={`size-5 ${isActive ? 'text-black' : 'text-gray-600'}`}
                fill={isActive ? 'currentColor' : 'none'}
              />
              <span>{nav.title}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
