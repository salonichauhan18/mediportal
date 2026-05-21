import * as React from "react"
import { cn } from "../lib/utils"

export interface AccessibleImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  alt: string;
}

export const AccessibleImage = React.forwardRef<HTMLImageElement, AccessibleImageProps>(
  ({ className, alt, ...props }, ref) => {
    return (
      <img
        ref={ref}
        className={cn("max-w-full h-auto", className)}
        alt={alt}
        {...props}
      />
    )
  }
)
AccessibleImage.displayName = "AccessibleImage"
