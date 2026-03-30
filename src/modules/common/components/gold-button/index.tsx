import React from "react"
import { clx } from "@medusajs/ui"

type GoldButtonProps = {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  isLoading?: boolean
  type?: "button" | "submit" | "reset"
  className?: string
  variant?: "primary" | "outline" | "secondary"
  size?: "sm" | "md" | "lg"
  "data-testid"?: string
}

const GoldButton: React.FC<GoldButtonProps> = ({
  children,
  onClick,
  disabled = false,
  isLoading = false,
  type = "button",
  className,
  variant = "primary",
  size = "md",
  "data-testid": dataTestId,
}) => {
  const baseStyles = "inline-flex items-center justify-center font-rexton font-bold uppercase tracking-wide rounded-[5px] border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
  
  const sizeStyles = {
    sm: "px-4 py-2 text-xs",
    md: "px-[42px] py-[18px] text-h6",
    lg: "px-12 py-5 text-h5",
  }

  const variantStyles = {
    primary: "border-Charcoal bg-Gold text-Charcoal hover:bg-Gold/90 active:bg-Gold/80",
    outline: "border-Charcoal bg-transparent text-Charcoal hover:bg-Charcoal hover:text-white",
    secondary: "border-gray-300 bg-gray-100 text-Charcoal hover:bg-gray-200",
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={clx(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      data-testid={dataTestId}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  )
}

export default GoldButton
