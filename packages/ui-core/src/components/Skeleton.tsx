import * as React from "react"
import { cn } from "../lib/utils"

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("base-skeleton-classes", className)} {...props}>
        Skeleton Component
      </div>
    )
  }
)
Skeleton.displayName = "Skeleton"
