import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../lib/utils"

const headingVariants = cva(
  "font-bold tracking-tight text-foreground",
  {
    variants: {
      level: {
        h1: "text-4xl sm:text-5xl lg:text-6xl",
        h2: "text-3xl sm:text-4xl",
        h3: "text-2xl sm:text-3xl",
        h4: "text-xl sm:text-2xl",
        h5: "text-lg sm:text-xl",
        h6: "text-base sm:text-lg",
      },
    },
    defaultVariants: {
      level: "h2",
    },
  }
)

export interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
}

export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, level, as, ...props }, ref) => {
    const Tag = as || level || "h2"
    return (
      <Tag
        ref={ref}
        className={cn(headingVariants({ level, className }))}
        {...props}
      />
    )
  }
)
Heading.displayName = "Heading"
