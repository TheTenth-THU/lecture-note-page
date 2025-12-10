'use client';

import {
  HomeIcon,
  AcademicCapIcon,
  UserGroupIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import clsx from "clsx";
import { usePathname } from "next/navigation";

const links = [
  {
    name: "Home",
    href: "/",
    icon: HomeIcon,
  },
  {
    name: "Schoolwork",
    href: "/schoolwork",
    icon: AcademicCapIcon,
  },
  {
    name: "Publications",
    href: "/publications",
    icon: DocumentTextIcon,
  },
  {
    name: "Projects",
    href: "/projects",
    icon: UserGroupIcon,
  },
];

/**
 * Navigation links for the dashboard.
 * @param isShrunk - Boolean indicating if the header is in shrunk state.
 * @returns JSX.Element, containing an array of navigation links.
 */
export default function NavLinks({ isShrunk }: { isShrunk: boolean }) {
  const pathname = usePathname();
  return (
    <>
      {links.map((link) => {
        const LinkIcon = link.icon;
        return (
          <Link
            key={link.name}
            href={link.href}
            className={clsx(
              /* --- Base styles --- */
              "flex grow items-center justify-center",
              "mr-2 h-10 gap-2 rounded-md p-2 bg-[#1e293944] border border-gray-400",
              "text-sm font-medium text-gray-400",
              {
                "bg-[#1e293988] text-white": pathname === link.href,
              },
              /* --- State styles --- */
              "transition-all duration-200 ease-in-out",
              "hover:bg-purple-200 hover:text-[#660974] hover:dark:bg-[#660974] hover:dark:text-purple-200",
              "md:flex-none md:justify-start md:px-3",
            )}>
            <LinkIcon className="w-6" />
            <p className={clsx(
              isShrunk ? "hidden" : "block"
            )}>{link.name}</p>
          </Link>
        );
      })}
    </>
  );
}
