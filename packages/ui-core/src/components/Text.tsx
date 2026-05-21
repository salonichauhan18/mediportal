import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../lib/utils"

const textVariants = cva(
  "text-sm text-foreground",
  {
    variants: {
      variant: {
        default: "text-base",
        muted: "text-muted-foreground",
        lead: "text-xl text-muted-foreground",
        large: "text-lg font-semibold",
        small: "text-sm font-medium leading-none",
        tiny: "text-xs text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface TextProps
  extends React.HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof textVariants> {
  as?: "p" | "span" | "div"
}

export const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  ({ className, variant, as = "p", ...props }, ref) => {
    const Tag = as
    return (
      <Tag
        ref={ref}
        className={cn(textVariants({ variant, className }))}
        {...props}
      />
    )
  }
)
Text.displayName = "Text"
