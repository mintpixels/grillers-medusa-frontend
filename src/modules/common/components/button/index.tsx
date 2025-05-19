import React from "react"

import { Spinner } from "@medusajs/icons"

export interface MyButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean
  children: React.ReactNode
}

export const Button: React.FC<MyButtonProps> = ({
  isLoading = false,
  disabled,
  children,
  className = "",
  ...props
}) => {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      className={className}
    >
      {isLoading ? <Spinner className="animate-spin" /> : children}
    </button>
  )
}

export default Button
