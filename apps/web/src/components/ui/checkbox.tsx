import * as React from "react";

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox: React.FC<Props> = ({ className = "", onCheckedChange, checked, defaultChecked, ...props }) => {
  const [internal, setInternal] = React.useState<boolean>(Boolean(defaultChecked));
  const isControlled = typeof checked !== "undefined";
  const value = isControlled ? Boolean(checked) : internal;

  return (
    <input
      type="checkbox"
      checked={value}
      onChange={(e) => {
        const next = e.target.checked;
        if (!isControlled) setInternal(next);
        onCheckedChange?.(next);
      }}
      className={[
        "h-4 w-4 rounded border border-white/30 bg-white",
        "text-black accent-yellow-300",
        className,
      ].join(" ")}
      {...props}
    />
  );
};

export default Checkbox;
