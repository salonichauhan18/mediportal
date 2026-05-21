import * as React from "react"
import { cn } from "../lib/utils"

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("base-toast-classes", className)} {...props}>
        Toast Component
      </div>
    )
  }
)
Toast.displayName = "Toast"
