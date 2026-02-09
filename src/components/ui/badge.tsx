import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "subtle" | "strong";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

export function Badge({ className, variant = "subtle", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "badge",
        variant === "strong" ? "badge-strong" : "",
        className,
      )}
      {...props}
    />
  );
}
