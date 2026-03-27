import { LoaderCircle } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export function Spinner({ className }: { className?: string }) {
  return <LoaderCircle className={cn("h-5 w-5 animate-spin", className)} />;
}
