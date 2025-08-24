import * as React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", ...props }, ref) => (
    <input
      ref={ref}
      className={[
        "flex h-10 w-full rounded-md border border-white/20 bg-white px-3 py-2 text-sm",
        "text-black placeholder:text-gray-500",
        "focus:outline-none focus:ring-2 focus:ring-yellow-300",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      ].join(" ")}
      {...props}
    />
  )
);
Input.displayName = "Input";

export default Input;
