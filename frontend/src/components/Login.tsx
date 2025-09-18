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
    <div className="min-h-screen bg-gradient-to-br from-gray-100/10 to-gray-400/20 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-200/20 to-gray-500/20"></div>
      <div className="absolute top-32 left-20 w-32 h-32 bg-green-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-32 right-20 w-32 h-32 bg-gray-600/10 rounded-full blur-3xl"></div>

      <div className="max-w-md w-full relative z-10">
        {/* Logo and Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-green-700 rounded-xl flex items-center justify-center shadow-lg glow-border floating-element">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-2">GamePlan Pro</h1>
          <p className="text-sm text-muted-foreground">
            {isSignUp ? 'Create a new account' : 'Sign in to your account'}
          </p>
        </div>

        {/* Form */}
        <div className="glass-card glass-card-hover p-8 animate-slide-up">
          <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-6">
            {/* Sign In Form */}
            {!isSignUp ? (
              <>
                {/* Role Selection */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-foreground">I am signing in as:</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'user' })}
                      className={`py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                        formData.role === 'user'
                          ? 'bg-green-100 text-green-700 border-2 border-green-500 shadow-md'
                          : 'bg-background border-2 border-border text-foreground hover:bg-secondary hover:shadow-md'
                      }`}
                    >
                      User
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'admin' })}
                      className={`py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                        formData.role === 'admin'
                          ? 'bg-green-100 text-green-700 border-2 border-green-500 shadow-md'
                          : 'bg-background border-2 border-border text-foreground hover:bg-secondary hover:shadow-md'
                      }`}
                    >
                      Admin
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="organization" className="block text-sm font-medium text-foreground">
                    Organization
                  </label>
                  <select
                    name="organization"
                    value={formData.organization}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-200"
                  >
                    <option value="">Choose an organization...</option>
                    <option value="northside-dragons">Northside Dragons</option>
                    <option value="maroochydore-clippers">Maroochydore Clippers</option>
                    <option value="gameplan-pro">GamePlan Pro</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-foreground">
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
                    className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-200"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label htmlFor="password" className="block text-sm font-medium text-foreground">
                      Password
                    </label>
                    <button
                      type="button"
                      className="text-sm text-green-600 hover:text-green-700 transition-colors duration-200"
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
                      className="w-full px-4 py-3 pr-12 rounded-lg border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    className="button-primary w-full py-4 text-base font-semibold"
                  >
                    <span>Sign in</span>
                  </button>
                </div>
              </>
            ) : (
              /* Sign Up Form */
              <>
                {/* Role Selection for Sign Up */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-foreground">I want to register as:</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'user' })}
                      className={`py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                        formData.role === 'user'
                          ? 'bg-green-100 text-green-700 border-2 border-green-500 shadow-md'
                          : 'bg-background border-2 border-border text-foreground hover:bg-secondary hover:shadow-md'
                      }`}
                    >
                      User
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'admin' })}
                      className={`py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                        formData.role === 'admin'
                          ? 'bg-green-100 text-green-700 border-2 border-green-500 shadow-md'
                          : 'bg-background border-2 border-border text-foreground hover:bg-secondary hover:shadow-md'
                      }`}
                    >
                      Admin
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="organization" className="block text-sm font-medium text-foreground">
                    Organization
                  </label>
                  <select
                    name="organization"
                    value={formData.organization}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-200"
                  >
                    <option value="">Choose an organization...</option>
                    <option value="northside-dragons">Northside Dragons</option>
                    <option value="maroochydore-clippers">Maroochydore Clippers</option>
                    <option value="gameplan-pro">GamePlan Pro</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="firstName" className="block text-sm font-medium text-foreground">
                      First name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="First name"
                      required
                      className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="lastName" className="block text-sm font-medium text-foreground">
                      Last name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Last name"
                      required
                      className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-foreground">
                    Email address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="name@example.com"
                    required
                    className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-200"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium text-foreground">
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
                      className="w-full px-4 py-3 pr-12 rounded-lg border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
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
                      className="w-full px-4 py-3 pr-12 rounded-lg border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    className="button-primary w-full py-4 text-base font-semibold"
                  >
                    <span>Create account</span>
                  </button>
                </div>
              </>
            )}
          </form>

          {/* Toggle between Sign In and Sign Up */}
          <div className="mt-8 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-green-600 hover:text-green-700 font-medium transition-colors duration-200"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>

          {/* Terms and Privacy */}
          <div className="mt-6 text-center text-xs text-muted-foreground">
            By {isSignUp ? 'creating an account' : 'signing in'}, you agree to our{' '}
            <a href="#" className="text-green-600 hover:text-green-700 transition-colors duration-200">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-green-600 hover:text-green-700 transition-colors duration-200">Privacy Policy</a>
          </div>
        </div>
      </div>
    </div>
  )
}