import * as React from "react"
import { cn } from "../lib/utils"

export interface TooltipProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("base-tooltip-classes", className)} {...props}>
        Tooltip Component
      </div>
    )
  }
)
Tooltip.displayName = "Tooltip"
