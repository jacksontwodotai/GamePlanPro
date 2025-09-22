import React from 'react'

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export interface AlertDescriptionProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`relative w-full rounded-lg border p-4 ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Alert.displayName = 'Alert'

export const AlertDescription = React.forwardRef<HTMLDivElement, AlertDescriptionProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`text-sm [&_p]:leading-relaxed ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)
AlertDescription.displayName = 'AlertDescription'