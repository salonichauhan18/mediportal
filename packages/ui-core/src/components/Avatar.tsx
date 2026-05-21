import * as React from "react"
import { cn } from "../lib/utils"

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("base-avatar-classes", className)} {...props}>
        Avatar Component
      </div>
    )
  }
)
Avatar.displayName = "Avatar"
