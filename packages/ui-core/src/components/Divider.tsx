import * as React from "react"
import { cn } from "../lib/utils"

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Divider = React.forwardRef<HTMLDivElement, DividerProps>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("base-divider-classes", className)} {...props}>
        Divider Component
      </div>
    )
  }
)
Divider.displayName = "Divider"
