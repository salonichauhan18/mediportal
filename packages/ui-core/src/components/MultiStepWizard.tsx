import * as React from "react"
import { cn } from "../lib/utils"

export interface MultiStepWizardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const MultiStepWizard = React.forwardRef<HTMLDivElement, MultiStepWizardProps>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("base-multistepwizard-classes", className)} {...props}>
        MultiStepWizard Component
      </div>
    )
  }
)
MultiStepWizard.displayName = "MultiStepWizard"
