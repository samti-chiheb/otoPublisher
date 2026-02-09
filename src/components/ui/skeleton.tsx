import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("rounded-md bg-[rgba(15,23,42,0.08)]", className)} style={{ minHeight: 16 }} />;
}
