import * as React from "react"
import { cn } from "@/lib/utils"

function Textarea({ className, ...props }) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[60px] w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white",
        "placeholder:text-slate-500",
        "focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "transition-all",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
