import * as React from "react"
import { cn } from "../lib/utils"

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {}

export const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("base-formfield-classes", className)} {...props}>
        FormField Component
      </div>
    )
  }
)
FormField.displayName = "FormField"
