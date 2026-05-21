import * as React from "react"
import { cn } from "../lib/utils"

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("base-spinner-classes", className)} {...props}>
        Spinner Component
      </div>
    )
  }
)
Spinner.displayName = "Spinner"
