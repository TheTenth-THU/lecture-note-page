import clsx from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  isActive?: boolean;
}

export function Button({ className, children, isActive, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      className={clsx([
        /* --- Base styles --- */
        // layout
        "flex items-center",
        // size, shape, background
        "min-h-9 rounded-lg px-3 border",
        {
          "bg-primary border-foreground": isActive,
          "bg-primary-b50 border-primary-b50": !isActive,
        },
        // font
        "text-sm font-medium text-foreground",
        /* --- Transition --- */
        // transition switches
        "transition-colors",
        /* --- State styles --- */
        // hover
        "hover:bg-primary-f75 hover:border-primary-f75",
        // focus
        "focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-primary-f50",
        // active
        "active:bg-primary-f75",
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
