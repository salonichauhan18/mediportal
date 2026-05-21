import * as React from "react"
import { cn } from "../lib/utils"

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("base-tabs-classes", className)} {...props}>
        Tabs Component
      </div>
    )
  }
)
Tabs.displayName = "Tabs"
