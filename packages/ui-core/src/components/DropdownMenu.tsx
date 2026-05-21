import * as React from "react"
import { cn } from "../lib/utils"

export interface DropdownMenuProps extends React.HTMLAttributes<HTMLDivElement> {}

export const DropdownMenu = React.forwardRef<HTMLDivElement, DropdownMenuProps>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("base-dropdownmenu-classes", className)} {...props}>
        DropdownMenu Component
      </div>
    )
  }
)
DropdownMenu.displayName = "DropdownMenu"
