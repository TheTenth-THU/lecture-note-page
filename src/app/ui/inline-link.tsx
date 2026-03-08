import Link from "next/link";
import { ComponentProps } from "react";

import {
  ArrowTopRightOnSquareIcon,
  EnvelopeOpenIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";

export default function InlineLink({
  children,
  href,
  ...props
}: ComponentProps<"a">) {
  const linkContent = (
    <span className="text-secondary-f25 hover:font-bold hover:underline">
      {children}
    </span>
  );

  if (href && href.startsWith("/")) {
    // Internal link
    return (
      <Link className="inline" href={href} {...props}>
        {linkContent}
        <LinkIcon className="text-foreground mx-1 inline-block h-[1em] w-[1em] align-[-0.125em]" />
      </Link>
    );
  } else if (href && href.startsWith("mailto:")) {
    // Email link
    return (
      <a href={href} {...props}>
        {linkContent}
        <EnvelopeOpenIcon className="text-foreground mx-1 inline-block h-[1em] w-[1em] align-[-0.125em]" />
      </a>
    );
  } else {
    // External link
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
        {linkContent}
        <ArrowTopRightOnSquareIcon className="text-foreground mx-1 inline-block h-[1em] w-[1em] align-[-0.125em]" />
      </a>
    );
  }
}
