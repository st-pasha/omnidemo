import { cn } from "~/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "mr-2 h-5 w-5 rounded-full border-2 border-solid border-stone-500 " +
          "animate-spin border-r-transparent",
        className
      )}
    />
  );
}
