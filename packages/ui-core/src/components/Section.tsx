import * as React from "react"
import { cn } from "../lib/utils"

export interface SectionProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Section = React.forwardRef<HTMLDivElement, SectionProps>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("base-section-classes", className)} {...props}>
        Section Component
      </div>
    )
  }
)
Section.displayName = "Section"
