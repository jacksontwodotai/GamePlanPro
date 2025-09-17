import { useState, useEffect } from 'react'
import { Shield, Eye, EyeOff, ArrowRight, Users, Zap, UserCheck, ShieldCheck } from 'lucide-react'

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
    role: 'user' // Default to user role
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
          confirmPassword: ''
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600 to-orange-800"></div>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold">GamePlan Pro</h1>
            </div>
            <h2 className="text-4xl font-bold mb-4 leading-tight">
              Welcome to the future of team management
            </h2>
            <p className="text-xl text-orange-100 mb-8 leading-relaxed">
              Streamline your workflow, boost productivity, and achieve your goals with our comprehensive platform.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center mr-4">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Team Collaboration</h3>
                <p className="text-orange-100 text-sm">Work together seamlessly with real-time updates</p>
              </div>
            </div>

            <div className="flex items-center">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center mr-4">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Lightning Fast</h3>
                <p className="text-orange-100 text-sm">Experience blazing-fast performance and responsiveness</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Forms */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Sign In Form */}
          {!isSignUp ? (
            <div className="bg-white/95 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl p-8">
              <div className="text-center mb-8">
                <div className="lg:hidden mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-800 mb-2">GamePlan Pro</h1>
                </div>
                <h2 className="text-3xl font-bold text-slate-800 mb-3">Welcome back</h2>
                <p className="text-slate-600">Enter your credentials to access your account</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                {/* Role Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    I am signing in as:
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'user' })}
                      className={`relative px-4 py-3.5 rounded-xl border-2 transition-all duration-200 ${
                        formData.role === 'user'
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-slate-200 bg-white/50 hover:bg-white/70 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        <UserCheck className="w-5 h-5 mr-2" />
                        <span className="font-medium">User</span>
                      </div>
                      {formData.role === 'user' && (
                        <div className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full"></div>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'admin' })}
                      className={`relative px-4 py-3.5 rounded-xl border-2 transition-all duration-200 ${
                        formData.role === 'admin'
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-slate-200 bg-white/50 hover:bg-white/70 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 mr-2" />
                        <span className="font-medium">Admin</span>
                      </div>
                      {formData.role === 'admin' && (
                        <div className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full"></div>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="organization" className="block text-sm font-semibold text-slate-700 mb-2">
                    Organization
                  </label>
                  <select
                    name="organization"
                    value={formData.organization}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3.5 border border-slate-200 rounded-xl text-slate-800 bg-white/50 backdrop-blur-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all duration-200 hover:bg-white/70"
                  >
                    <option value="">Choose an organization...</option>
                    <option value="northside-dragons">Northside Dragons</option>
                    <option value="maroochydore-clippers">Maroochydore Clippers</option>
                    <option value="gameplan-pro">GamePlan Pro</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
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
                    className="w-full px-4 py-3.5 border border-slate-200 rounded-xl text-slate-800 bg-white/50 backdrop-blur-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all duration-200 hover:bg-white/70"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                      Password
                    </label>
                    <button
                      type="button"
                      className="text-sm text-slate-500 hover:text-orange-500 transition-colors font-medium"
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
                      className="w-full px-4 py-3.5 pr-12 border border-slate-200 rounded-xl text-slate-800 bg-white/50 backdrop-blur-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all duration-200 hover:bg-white/70"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center group"
                >
                  Sign in to your account
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
              </form>

              <div className="text-center mt-8">
                <button
                  onClick={() => setIsSignUp(true)}
                  className="text-slate-600 hover:text-orange-500 transition-colors font-medium"
                >
                  Don't have an account? <span className="text-orange-500 font-semibold">Sign up</span>
                </button>
              </div>

              <div className="text-center mt-6 text-xs text-slate-500">
                By signing in, you agree to our{' '}
                <a href="#" className="text-orange-500 hover:underline font-medium">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-orange-500 hover:underline font-medium">Privacy Policy</a>
              </div>
            </div>
          ) : (
            /* Sign Up Form */
            <div className="bg-white/95 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl p-8">
              <div className="text-center mb-8">
                <div className="lg:hidden mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-800 mb-2">GamePlan Pro</h1>
                </div>
                <h2 className="text-3xl font-bold text-slate-800 mb-3">Create your account</h2>
                <p className="text-slate-600">Join thousands of teams already using GamePlan Pro</p>
              </div>

              <form onSubmit={handleSignUp} className="space-y-6">
                {/* Role Selection for Sign Up */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    I want to register as:
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'user' })}
                      className={`relative px-4 py-3.5 rounded-xl border-2 transition-all duration-200 ${
                        formData.role === 'user'
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-slate-200 bg-white/50 hover:bg-white/70 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        <UserCheck className="w-5 h-5 mr-2" />
                        <span className="font-medium">User</span>
                      </div>
                      {formData.role === 'user' && (
                        <div className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full"></div>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'admin' })}
                      className={`relative px-4 py-3.5 rounded-xl border-2 transition-all duration-200 ${
                        formData.role === 'admin'
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-slate-200 bg-white/50 hover:bg-white/70 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 mr-2" />
                        <span className="font-medium">Admin</span>
                      </div>
                      {formData.role === 'admin' && (
                        <div className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full"></div>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="organization" className="block text-sm font-semibold text-slate-700 mb-2">
                    Organization
                  </label>
                  <select
                    name="organization"
                    value={formData.organization}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3.5 border border-slate-200 rounded-xl text-slate-800 bg-white/50 backdrop-blur-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all duration-200 hover:bg-white/70"
                  >
                    <option value="">Choose an organization...</option>
                    <option value="northside-dragons">Northside Dragons</option>
                    <option value="maroochydore-clippers">Maroochydore Clippers</option>
                    <option value="gameplan-pro">GamePlan Pro</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-semibold text-slate-700 mb-2">
                      First name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="Enter first name"
                      required
                      className="w-full px-4 py-3.5 border border-slate-200 rounded-xl text-slate-800 bg-white/50 backdrop-blur-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all duration-200 hover:bg-white/70"
                    />
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-semibold text-slate-700 mb-2">
                      Last name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Enter last name"
                      required
                      className="w-full px-4 py-3.5 border border-slate-200 rounded-xl text-slate-800 bg-white/50 backdrop-blur-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all duration-200 hover:bg-white/70"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                    Email address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="name@example.com"
                    required
                    className="w-full px-4 py-3.5 border border-slate-200 rounded-xl text-slate-800 bg-white/50 backdrop-blur-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all duration-200 hover:bg-white/70"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Create a strong password"
                      required
                      className="w-full px-4 py-3.5 pr-12 border border-slate-200 rounded-xl text-slate-800 bg-white/50 backdrop-blur-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all duration-200 hover:bg-white/70"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 mb-2">
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
                      className="w-full px-4 py-3.5 pr-12 border border-slate-200 rounded-xl text-slate-800 bg-white/50 backdrop-blur-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all duration-200 hover:bg-white/70"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center group"
                >
                  Create your account
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
              </form>

              <div className="text-center mt-8">
                <button
                  onClick={() => setIsSignUp(false)}
                  className="text-slate-600 hover:text-orange-500 transition-colors font-medium"
                >
                  Already have an account? <span className="text-orange-500 font-semibold">Sign in</span>
                </button>
              </div>

              <div className="text-center mt-6 text-xs text-slate-500">
                By creating an account, you agree to our{' '}
                <a href="#" className="text-orange-500 hover:underline font-medium">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-orange-500 hover:underline font-medium">Privacy Policy</a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}