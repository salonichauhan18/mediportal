import * as React from "react"
import { cn } from "../lib/utils"

export interface SwitchProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Switch = React.forwardRef<HTMLDivElement, SwitchProps>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("base-switch-classes", className)} {...props}>
        Switch Component
      </div>
    )
  }
)
Switch.displayName = "Switch"
