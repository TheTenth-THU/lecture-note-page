import clsx from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function Button({ children, className, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      className={clsx([
        /* --- Base styles --- */
        // layout
        "flex items-center",
        // size, shape, background
        "h-10 rounded-lg bg-purple-500 px-4",
        // font
        "text-sm font-medium text-white",
        /* --- Transition --- */
        // transition switches
        "transition-colors",
        /* --- State styles --- */
        // hover
        "hover:bg-purple-400",
        // focus
        "focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-purple-500",
        // active
        "active:bg-purple-600",
        // disabled
        "disabled:cursor-not-allowed disabled:opacity-50",
        // aria-disabled
        "aria-disabled:cursor-not-allowed aria-disabled:opacity-50",
        className,
      ])}
    >
      {children}
    </button>
  );
}
