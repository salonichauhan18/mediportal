import * as React from "react"
import { cn } from "../lib/utils"

export interface SliderProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("base-slider-classes", className)} {...props}>
        Slider Component
      </div>
    )
  }
)
Slider.displayName = "Slider"
