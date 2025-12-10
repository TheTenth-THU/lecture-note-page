import Link from "next/link";
import { ComponentProps } from "react";

import { ArrowTopRightOnSquareIcon, EnvelopeOpenIcon, LinkIcon } from "@heroicons/react/24/outline";

export default function InlineLink({
  children,
  href,
  ...props
}: ComponentProps<"a">) {
  const linkContent = (
    <span className="text-[#660974] hover:underline hover:font-bold dark:text-[#ef8bff]">
      {children}
    </span>
  );

  if (href && href.startsWith("/")) {
    // Internal link
    return (
      <Link
        href={href}
        {...props}>
        {linkContent}
        <LinkIcon className="inline-block mx-1 h-[1em] w-[1em] align-[-0.125em]" />
      </Link>
    );
  } else if (href && href.startsWith("mailto:")) {
    // Email link
    return (
      <a
        href={href}
        {...props}>
        {linkContent}
        <EnvelopeOpenIcon className="inline-block mx-1 h-[1em] w-[1em] align-[-0.125em]" />
      </a>
    );
  } else {
    // External link
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        {...props}>
        {linkContent}
        <ArrowTopRightOnSquareIcon className="inline-block mx-1 h-[1em] w-[1em] align-[-0.125em]" />
      </a>
    );
  }
}
  