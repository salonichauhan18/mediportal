import * as React from "react"
import { cn } from "../lib/utils"

export interface SelectProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("base-select-classes", className)} {...props}>
        Select Component
      </div>
    )
  }
)
Select.displayName = "Select"
