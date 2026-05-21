import * as React from "react"
import { cn } from "../lib/utils"

export interface TextareaProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Textarea = React.forwardRef<HTMLDivElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("base-textarea-classes", className)} {...props}>
        Textarea Component
      </div>
    )
  }
)
Textarea.displayName = "Textarea"
