import { forwardRef } from 'react'
import { Check } from 'lucide-react'

export interface CheckboxProps {
  checked?: boolean
  disabled?: boolean
  onChange?: (checked: boolean) => void
  className?: string
  id?: string
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ checked = false, disabled = false, onChange, className = '', id, ...props }, ref) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!disabled && onChange) {
        onChange(event.target.checked)
      }
    }

    return (
      <div className="relative inline-flex items-center">
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={handleChange}
          id={id}
          className="sr-only"
          {...props}
        />
        <div
          className={`
            w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center cursor-pointer
            ${checked
              ? 'bg-blue-600 border-blue-600 text-white'
              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-blue-400'
            }
            ${disabled
              ? 'opacity-50 cursor-not-allowed'
              : 'cursor-pointer'
            }
            ${className}
          `}
          onClick={() => !disabled && onChange && onChange(!checked)}
        >
          {checked && (
            <Check className="w-3 h-3" strokeWidth={3} />
          )}
        </div>
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'

export { Checkbox }