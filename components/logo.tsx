import { Home } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Logo({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center gap-2.5", className)} {...props}>
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Home className="size-6" strokeWidth={2.5} />
      </div>
      <div className="flex flex-col items-start leading-tight">
        <h1 className="text-xl font-black tracking-tight text-foreground">
          Tecma
          <span className="text-primary">.</span>
        </h1>
      </div>
    </div>
  );
}
