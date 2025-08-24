import * as React from "react";

export const Label = ({ className = "", ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={["text-sm font-medium", className].join(" ")} {...props} />
);

export default Label;
