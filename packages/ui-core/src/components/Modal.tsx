import * as React from "react"
import { cn } from "../lib/utils"

export interface ModalProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("base-modal-classes", className)} {...props}>
        Modal Component
      </div>
    )
  }
)
Modal.displayName = "Modal"
