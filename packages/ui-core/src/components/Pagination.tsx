import * as React from "react"
import { cn } from "../lib/utils"

export interface PaginationProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Pagination = React.forwardRef<HTMLDivElement, PaginationProps>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("base-pagination-classes", className)} {...props}>
        Pagination Component
      </div>
    )
  }
)
Pagination.displayName = "Pagination"
