import * as React from "react"
import { cn } from "../lib/utils"

export interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

export const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("base-radiogroup-classes", className)} {...props}>
        RadioGroup Component
      </div>
    )
  }
)
RadioGroup.displayName = "RadioGroup"
