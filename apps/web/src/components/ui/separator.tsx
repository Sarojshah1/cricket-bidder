import * as React from "react";

export const Separator = ({ className = "", ...props }: React.HTMLAttributes<HTMLHRElement>) => (
  <hr className={["my-4 border-white/10", className].join(" ")} {...props} />
);

export default Separator;
