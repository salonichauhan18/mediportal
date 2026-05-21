import * as React from "react"
import { cn } from "../lib/utils"

export interface TableProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Table = React.forwardRef<HTMLDivElement, TableProps>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("base-table-classes", className)} {...props}>
        Table Component
      </div>
    )
  }
)
Table.displayName = "Table"
