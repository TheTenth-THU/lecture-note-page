import clsx from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  isCurrent?: boolean;
  bgColor?: string;
  currentBgColor?: string;
}

export function Button({
  className,
  children,
  isCurrent,
  bgColor,
  currentBgColor,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      className={clsx(
        className,
        /* --- Base styles --- */
        "flex items-center",
        "min-h-9 rounded-full border px-3",
        isCurrent ?
          `border-foreground bg-primary-b75 border-2 font-bold`
        : `border-foreground border-[0.5px] bg-transparent`,
        "text-foreground text-shadow-background text-sm text-shadow-sm",
        "transition-colors",
        /* --- State styles --- */
        "hover:bg-primary-f75 hover:border-primary-f75",
        "focus-visible:outline-primary-f50 focus-visible:outline focus-visible:outline-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-disabled:cursor-not-allowed aria-disabled:opacity-50",
      )}>
      {children}
    </button>
  );
}
