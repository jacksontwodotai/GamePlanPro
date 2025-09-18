import { useState, useEffect } from 'react'
import { Shield, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    organization: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    confirmPassword: '',
    role: 'user'
  })

  useEffect(() => {
    if (!isSignUp && formData.email) {
      const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement
      if (emailInput) {
        emailInput.focus()
      }
    }
  }, [isSignUp])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organization: formData.organization,
          email: formData.email,
          password: formData.password,
          role: formData.role
        })
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(data.user))
        window.location.href = '/dashboard'
      } else {
        alert(`Login failed: ${data.error}`)
      }
    } catch (error) {
      console.error('Login error:', error)
      alert('Login failed. Please try again.')
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!')
      return
    }

    try {
      const response = await fetch('/api/create-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organization: formData.organization,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          role: formData.role
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert(`Account created successfully! Welcome, ${formData.firstName}!`)
        setIsSignUp(false)
        setFormData({
          organization: '',
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          confirmPassword: '',
          role: 'user'
        })
      } else {
        alert(`Account creation failed: ${data.error}`)
      }
    } catch (error) {
      console.error('Account creation error:', error)
      alert('Account creation failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-green-700 rounded flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">GamePlan Pro</h1>
          <p className="mt-2 text-sm text-gray-600">
            {isSignUp ? 'Create a new account' : 'Sign in to your account'}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-8">
          <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-6">
            {/* Sign In Form */}
            {!isSignUp ? (
              <>
                {/* Role Selection */}
                <div>
                  <label className="basecamp-label">I am signing in as:</label>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'user' })}
                      className={`py-2 px-4 border rounded text-sm font-medium transition-colors ${
                        formData.role === 'user'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      User
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'admin' })}
                      className={`py-2 px-4 border rounded text-sm font-medium transition-colors ${
                        formData.role === 'admin'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Admin
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="organization" className="basecamp-label">
                    Organization
                  </label>
                  <select
                    name="organization"
                    value={formData.organization}
                    onChange={handleInputChange}
                    required
                    className="basecamp-select mt-1"
                  >
                    <option value="">Choose an organization...</option>
                    <option value="northside-dragons">Northside Dragons</option>
                    <option value="maroochydore-clippers">Maroochydore Clippers</option>
                    <option value="gameplan-pro">GamePlan Pro</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="email" className="basecamp-label">
                    Email address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="name@example.com"
                    required
                    autoFocus
                    className="basecamp-input mt-1"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="password" className="basecamp-label">
                      Password
                    </label>
                    <button
                      type="button"
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter your password"
                      required
                      className="basecamp-input pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    className="basecamp-button w-full"
                  >
                    Sign in
                  </button>
                </div>
              </>
            ) : (
              /* Sign Up Form */
              <>
                {/* Role Selection for Sign Up */}
                <div>
                  <label className="basecamp-label">I want to register as:</label>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'user' })}
                      className={`py-2 px-4 border rounded text-sm font-medium transition-colors ${
                        formData.role === 'user'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      User
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'admin' })}
                      className={`py-2 px-4 border rounded text-sm font-medium transition-colors ${
                        formData.role === 'admin'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Admin
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="organization" className="basecamp-label">
                    Organization
                  </label>
                  <select
                    name="organization"
                    value={formData.organization}
                    onChange={handleInputChange}
                    required
                    className="basecamp-select mt-1"
                  >
                    <option value="">Choose an organization...</option>
                    <option value="northside-dragons">Northside Dragons</option>
                    <option value="maroochydore-clippers">Maroochydore Clippers</option>
                    <option value="gameplan-pro">GamePlan Pro</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="basecamp-label">
                      First name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="First name"
                      required
                      className="basecamp-input mt-1"
                    />
                  </div>

                  <div>
                    <label htmlFor="lastName" className="basecamp-label">
                      Last name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Last name"
                      required
                      className="basecamp-input mt-1"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="basecamp-label">
                    Email address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="name@example.com"
                    required
                    className="basecamp-input mt-1"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="basecamp-label">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Create a password"
                      required
                      className="basecamp-input pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="basecamp-label">
                    Confirm password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm your password"
                      required
                      className="basecamp-input pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    className="basecamp-button w-full"
                  >
                    Create account
                  </button>
                </div>
              </>
            )}
          </form>

          {/* Toggle between Sign In and Sign Up */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>

          {/* Terms and Privacy */}
          <div className="mt-6 text-center text-xs text-gray-500">
            By {isSignUp ? 'creating an account' : 'signing in'}, you agree to our{' '}
            <a href="#" className="text-blue-600 hover:text-blue-800">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-blue-600 hover:text-blue-800">Privacy Policy</a>
          </div>
        </div>
      </div>
    </div>
  )
}