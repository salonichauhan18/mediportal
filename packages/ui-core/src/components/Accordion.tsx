import * as React from "react"
import { cn } from "../lib/utils"

export interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("base-accordion-classes", className)} {...props}>
        Accordion Component
      </div>
    )
  }
)
Accordion.displayName = "Accordion"
