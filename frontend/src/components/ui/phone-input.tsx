import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { COUNTRIES, Country, DEFAULT_COUNTRY } from '../../data/countries'
import { cn } from '../../lib/utils'

export interface PhoneInputValue {
  countryCode: string
  dialCode: string
  phoneNumber: string
  fullNumber: string
}

interface PhoneInputProps {
  value?: PhoneInputValue
  onChange?: (value: PhoneInputValue) => void
  placeholder?: string
  disabled?: boolean
  error?: boolean
  className?: string
  defaultCountry?: string
}

export function PhoneInput({
  value,
  onChange,
  placeholder = "Phone number",
  disabled = false,
  error = false,
  className,
  defaultCountry = 'US'
}: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country>(() => {
    if (value?.countryCode) {
      return COUNTRIES.find(c => c.code === value.countryCode) || DEFAULT_COUNTRY
    }
    return COUNTRIES.find(c => c.code === defaultCountry) || DEFAULT_COUNTRY
  })

  const [phoneNumber, setPhoneNumber] = useState(value?.phoneNumber || '')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filteredCountries = COUNTRIES.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.dialCode.includes(searchTerm) ||
    country.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (onChange) {
      const fullNumber = phoneNumber ? `${selectedCountry.dialCode}${phoneNumber}` : ''
      onChange({
        countryCode: selectedCountry.code,
        dialCode: selectedCountry.dialCode,
        phoneNumber,
        fullNumber
      })
    }
  }, [selectedCountry, phoneNumber, onChange])

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country)
    setIsDropdownOpen(false)
    setSearchTerm('')
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '') // Only allow numbers
    setPhoneNumber(value)
  }

  return (
    <div className={cn("relative", className)}>
      <div className={cn(
        "flex rounded-lg border bg-background",
        error ? "border-red-500" : "border-border",
        disabled ? "opacity-50 cursor-not-allowed" : "",
        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
      )}>
        {/* Country Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => !disabled && setIsDropdownOpen(!isDropdownOpen)}
            disabled={disabled}
            className={cn(
              "flex items-center gap-2 px-3 py-2 border-r border-border bg-muted/50 rounded-l-lg hover:bg-muted transition-colors",
              disabled ? "cursor-not-allowed" : "cursor-pointer"
            )}
          >
            <span className="text-lg">{selectedCountry.flag}</span>
            <span className="text-sm font-medium text-muted-foreground">
              {selectedCountry.dialCode}
            </span>
            <ChevronDown className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              isDropdownOpen ? "rotate-180" : ""
            )} />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 z-50 w-80 mt-1 bg-background border border-border rounded-lg shadow-lg">
              {/* Search Input */}
              <div className="p-2 border-b border-border">
                <input
                  type="text"
                  placeholder="Search countries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Countries List */}
              <div className="max-h-60 overflow-y-auto">
                {filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    onClick={() => handleCountrySelect(country)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted transition-colors",
                      selectedCountry.code === country.code ? "bg-muted" : ""
                    )}
                  >
                    <span className="text-lg">{country.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {country.name}
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {country.dialCode}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Phone Number Input */}
        <input
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneChange}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "flex-1 px-3 py-2 bg-transparent border-0 focus:outline-none focus:ring-0 rounded-r-lg",
            "placeholder:text-muted-foreground text-foreground",
            disabled ? "cursor-not-allowed" : ""
          )}
        />
      </div>
    </div>
  )
}

export default PhoneInput