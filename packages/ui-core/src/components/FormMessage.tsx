import * as React from "react"
import { cn } from "../lib/utils"

export interface FormMessageProps extends React.HTMLAttributes<HTMLDivElement> {}

export const FormMessage = React.forwardRef<HTMLDivElement, FormMessageProps>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("base-formmessage-classes", className)} {...props}>
        FormMessage Component
      </div>
    )
  }
)
FormMessage.displayName = "FormMessage"
