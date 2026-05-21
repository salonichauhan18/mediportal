import * as React from "react"
import { cn } from "../lib/utils"

export interface CheckboxProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Checkbox = React.forwardRef<HTMLDivElement, CheckboxProps>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("base-checkbox-classes", className)} {...props}>
        Checkbox Component
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"
