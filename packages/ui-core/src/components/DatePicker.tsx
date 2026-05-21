import * as React from "react"
import { cn } from "../lib/utils"

export interface DatePickerProps extends React.HTMLAttributes<HTMLDivElement> {}

export const DatePicker = React.forwardRef<HTMLDivElement, DatePickerProps>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("base-datepicker-classes", className)} {...props}>
        DatePicker Component
      </div>
    )
  }
)
DatePicker.displayName = "DatePicker"
