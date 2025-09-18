import { useState, useEffect } from 'react'
import { Shield, Eye, EyeOff, ArrowRight, Users, Zap, UserCheck, ShieldCheck, Sparkles, Trophy, TrendingUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const
      }
    }
  } as const

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  } as const

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900" />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-r from-pink-500/30 to-purple-500/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -bottom-40 -right-40 w-96 h-96 bg-gradient-to-r from-orange-500/30 to-pink-500/30 rounded-full blur-3xl"
        />
        <div className="absolute inset-0 backdrop-blur-[1px]" />
      </div>

      {/* Left Side - Branding */}
      <motion.div
        initial={{ opacity: 0, x: -100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="hidden lg:flex lg:w-1/2 relative z-10"
      >
        <div className="glass-card glass-card-hover m-8 rounded-3xl p-12 flex flex-col justify-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="text-white"
          >
            <motion.div variants={fadeInUp} className="mb-8">
              <div className="flex items-center mb-8">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                  className="w-14 h-14 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center mr-4 shadow-2xl"
                >
                  <Shield className="w-7 h-7 text-white" />
                </motion.div>
                <h1 className="text-4xl font-black gradient-text">GamePlan Pro</h1>
              </div>
              <h2 className="text-5xl font-black mb-6 leading-tight">
                Welcome to the
                <span className="block gradient-text">Future of Team Management</span>
              </h2>
              <p className="text-xl text-white/80 mb-12 leading-relaxed">
                Streamline your workflow, boost productivity, and achieve your goals with our comprehensive platform.
              </p>
            </motion.div>

            <motion.div variants={containerVariants} className="space-y-8">
              {[
                { icon: Users, title: 'Team Collaboration', desc: 'Work together seamlessly with real-time updates' },
                { icon: Zap, title: 'Lightning Fast', desc: 'Experience blazing-fast performance' },
                { icon: Trophy, title: 'Track Success', desc: 'Monitor performance and celebrate wins' }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  variants={fadeInUp}
                  whileHover={{ x: 10 }}
                  className="flex items-center group"
                >
                  <motion.div
                    animate={{
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: index * 0.3
                    }}
                    className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center mr-4 group-hover:bg-white/20 transition-colors"
                  >
                    <feature.icon className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <h3 className="font-bold text-lg">{feature.title}</h3>
                    <p className="text-white/60 text-sm">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Floating Elements */}
            <motion.div
              animate={{
                y: [0, -20, 0],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-20 right-20"
            >
              <Sparkles className="w-8 h-8 text-yellow-400/50" />
            </motion.div>
            <motion.div
              animate={{
                y: [0, 20, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute bottom-20 left-20"
            >
              <TrendingUp className="w-8 h-8 text-green-400/50" />
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Right Side - Auth Forms */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={isSignUp ? 'signup' : 'signin'}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4, type: "spring", stiffness: 100 }}
            className="w-full max-w-md"
          >
            {/* Sign In Form */}
            {!isSignUp ? (
              <motion.div className="glass-card rounded-3xl p-10 card-shadow">
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={containerVariants}
                >
                  <motion.div variants={fadeInUp} className="text-center mb-8">
                    <div className="lg:hidden mb-6">
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                        className="w-16 h-16 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl"
                      >
                        <Shield className="w-8 h-8 text-white" />
                      </motion.div>
                      <h1 className="text-3xl font-black gradient-text">GamePlan Pro</h1>
                    </div>
                    <h2 className="text-4xl font-black text-white mb-3">Welcome back</h2>
                    <p className="text-white/60">Enter your credentials to access your account</p>
                  </motion.div>

                  <form onSubmit={handleLogin} className="space-y-6">
                    {/* Role Selection */}
                    <motion.div variants={fadeInUp} className="mb-6">
                      <label className="block text-sm font-semibold text-white/80 mb-3">
                        I am signing in as:
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setFormData({ ...formData, role: 'user' })}
                          className={`relative px-4 py-3.5 rounded-xl border-2 transition-all duration-200 ${
                            formData.role === 'user'
                              ? 'border-orange-500 bg-gradient-to-br from-orange-500/20 to-pink-500/20 text-white'
                              : 'border-white/20 bg-white/5 hover:bg-white/10 text-white/60'
                          }`}
                        >
                          <div className="flex items-center justify-center">
                            <UserCheck className="w-5 h-5 mr-2" />
                            <span className="font-medium">User</span>
                          </div>
                          {formData.role === 'user' && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full"
                            />
                          )}
                        </motion.button>
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setFormData({ ...formData, role: 'admin' })}
                          className={`relative px-4 py-3.5 rounded-xl border-2 transition-all duration-200 ${
                            formData.role === 'admin'
                              ? 'border-orange-500 bg-gradient-to-br from-orange-500/20 to-pink-500/20 text-white'
                              : 'border-white/20 bg-white/5 hover:bg-white/10 text-white/60'
                          }`}
                        >
                          <div className="flex items-center justify-center">
                            <ShieldCheck className="w-5 h-5 mr-2" />
                            <span className="font-medium">Admin</span>
                          </div>
                          {formData.role === 'admin' && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full"
                            />
                          )}
                        </motion.button>
                      </div>
                    </motion.div>

                    <motion.div variants={fadeInUp}>
                      <label htmlFor="organization" className="block text-sm font-semibold text-white/80 mb-2">
                        Organization
                      </label>
                      <select
                        name="organization"
                        value={formData.organization}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3.5 border border-white/20 rounded-xl text-white bg-white/10 backdrop-blur-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200 hover:bg-white/15"
                      >
                        <option value="" className="bg-slate-800">Choose an organization...</option>
                        <option value="northside-dragons" className="bg-slate-800">Northside Dragons</option>
                        <option value="maroochydore-clippers" className="bg-slate-800">Maroochydore Clippers</option>
                        <option value="gameplan-pro" className="bg-slate-800">GamePlan Pro</option>
                      </select>
                    </motion.div>

                    <motion.div variants={fadeInUp}>
                      <label htmlFor="email" className="block text-sm font-semibold text-white/80 mb-2">
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
                        className="w-full px-4 py-3.5 border border-white/20 rounded-xl text-white placeholder-white/40 bg-white/10 backdrop-blur-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200 hover:bg-white/15"
                      />
                    </motion.div>

                    <motion.div variants={fadeInUp}>
                      <div className="flex justify-between items-center mb-2">
                        <label htmlFor="password" className="block text-sm font-semibold text-white/80">
                          Password
                        </label>
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          className="text-sm text-white/60 hover:text-orange-400 transition-colors font-medium"
                        >
                          Forgot password?
                        </motion.button>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          placeholder="Enter your password"
                          required
                          className="w-full px-4 py-3.5 pr-12 border border-white/20 rounded-xl text-white placeholder-white/40 bg-white/10 backdrop-blur-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200 hover:bg-white/15"
                        />
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </motion.button>
                      </div>
                    </motion.div>

                    <motion.button
                      type="submit"
                      variants={fadeInUp}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="button-primary w-full flex items-center justify-center group"
                    >
                      <span>Sign in to your account</span>
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                  </form>

                  <motion.div variants={fadeInUp} className="text-center mt-8">
                    <button
                      onClick={() => setIsSignUp(true)}
                      className="text-white/60 hover:text-orange-400 transition-colors font-medium"
                    >
                      Don't have an account? <span className="text-orange-400 font-semibold">Sign up</span>
                    </button>
                  </motion.div>

                  <motion.div variants={fadeInUp} className="text-center mt-6 text-xs text-white/40">
                    By signing in, you agree to our{' '}
                    <a href="#" className="text-orange-400 hover:underline font-medium">Terms of Service</a>
                    {' '}and{' '}
                    <a href="#" className="text-orange-400 hover:underline font-medium">Privacy Policy</a>
                  </motion.div>
                </motion.div>
              </motion.div>
            ) : (
              /* Sign Up Form */
              <motion.div className="glass-card rounded-3xl p-10 card-shadow">
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={containerVariants}
                >
                  <motion.div variants={fadeInUp} className="text-center mb-8">
                    <div className="lg:hidden mb-6">
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                        className="w-16 h-16 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl"
                      >
                        <Shield className="w-8 h-8 text-white" />
                      </motion.div>
                      <h1 className="text-3xl font-black gradient-text">GamePlan Pro</h1>
                    </div>
                    <h2 className="text-4xl font-black text-white mb-3">Create your account</h2>
                    <p className="text-white/60">Join thousands of teams already using GamePlan Pro</p>
                  </motion.div>

                  <form onSubmit={handleSignUp} className="space-y-6">
                    {/* Role Selection for Sign Up */}
                    <motion.div variants={fadeInUp} className="mb-6">
                      <label className="block text-sm font-semibold text-white/80 mb-3">
                        I want to register as:
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setFormData({ ...formData, role: 'user' })}
                          className={`relative px-4 py-3.5 rounded-xl border-2 transition-all duration-200 ${
                            formData.role === 'user'
                              ? 'border-orange-500 bg-gradient-to-br from-orange-500/20 to-pink-500/20 text-white'
                              : 'border-white/20 bg-white/5 hover:bg-white/10 text-white/60'
                          }`}
                        >
                          <div className="flex items-center justify-center">
                            <UserCheck className="w-5 h-5 mr-2" />
                            <span className="font-medium">User</span>
                          </div>
                          {formData.role === 'user' && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full"
                            />
                          )}
                        </motion.button>
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setFormData({ ...formData, role: 'admin' })}
                          className={`relative px-4 py-3.5 rounded-xl border-2 transition-all duration-200 ${
                            formData.role === 'admin'
                              ? 'border-orange-500 bg-gradient-to-br from-orange-500/20 to-pink-500/20 text-white'
                              : 'border-white/20 bg-white/5 hover:bg-white/10 text-white/60'
                          }`}
                        >
                          <div className="flex items-center justify-center">
                            <ShieldCheck className="w-5 h-5 mr-2" />
                            <span className="font-medium">Admin</span>
                          </div>
                          {formData.role === 'admin' && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full"
                            />
                          )}
                        </motion.button>
                      </div>
                    </motion.div>

                    <motion.div variants={fadeInUp}>
                      <label htmlFor="organization" className="block text-sm font-semibold text-white/80 mb-2">
                        Organization
                      </label>
                      <select
                        name="organization"
                        value={formData.organization}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3.5 border border-white/20 rounded-xl text-white bg-white/10 backdrop-blur-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200 hover:bg-white/15"
                      >
                        <option value="" className="bg-slate-800">Choose an organization...</option>
                        <option value="northside-dragons" className="bg-slate-800">Northside Dragons</option>
                        <option value="maroochydore-clippers" className="bg-slate-800">Maroochydore Clippers</option>
                        <option value="gameplan-pro" className="bg-slate-800">GamePlan Pro</option>
                      </select>
                    </motion.div>

                    <motion.div variants={fadeInUp} className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-semibold text-white/80 mb-2">
                          First name
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          placeholder="Enter first name"
                          required
                          className="w-full px-4 py-3.5 border border-white/20 rounded-xl text-white placeholder-white/40 bg-white/10 backdrop-blur-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200 hover:bg-white/15"
                        />
                      </div>

                      <div>
                        <label htmlFor="lastName" className="block text-sm font-semibold text-white/80 mb-2">
                          Last name
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          placeholder="Enter last name"
                          required
                          className="w-full px-4 py-3.5 border border-white/20 rounded-xl text-white placeholder-white/40 bg-white/10 backdrop-blur-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200 hover:bg-white/15"
                        />
                      </div>
                    </motion.div>

                    <motion.div variants={fadeInUp}>
                      <label htmlFor="email" className="block text-sm font-semibold text-white/80 mb-2">
                        Email address
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="name@example.com"
                        required
                        className="w-full px-4 py-3.5 border border-white/20 rounded-xl text-white placeholder-white/40 bg-white/10 backdrop-blur-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200 hover:bg-white/15"
                      />
                    </motion.div>

                    <motion.div variants={fadeInUp}>
                      <label htmlFor="password" className="block text-sm font-semibold text-white/80 mb-2">
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
                          className="w-full px-4 py-3.5 pr-12 border border-white/20 rounded-xl text-white placeholder-white/40 bg-white/10 backdrop-blur-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200 hover:bg-white/15"
                        />
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </motion.button>
                      </div>
                    </motion.div>

                    <motion.div variants={fadeInUp}>
                      <label htmlFor="confirmPassword" className="block text-sm font-semibold text-white/80 mb-2">
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
                          className="w-full px-4 py-3.5 pr-12 border border-white/20 rounded-xl text-white placeholder-white/40 bg-white/10 backdrop-blur-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200 hover:bg-white/15"
                        />
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </motion.button>
                      </div>
                    </motion.div>

                    <motion.button
                      type="submit"
                      variants={fadeInUp}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="button-primary w-full flex items-center justify-center group"
                    >
                      <span>Create your account</span>
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                  </form>

                  <motion.div variants={fadeInUp} className="text-center mt-8">
                    <button
                      onClick={() => setIsSignUp(false)}
                      className="text-white/60 hover:text-orange-400 transition-colors font-medium"
                    >
                      Already have an account? <span className="text-orange-400 font-semibold">Sign in</span>
                    </button>
                  </motion.div>

                  <motion.div variants={fadeInUp} className="text-center mt-6 text-xs text-white/40">
                    By creating an account, you agree to our{' '}
                    <a href="#" className="text-orange-400 hover:underline font-medium">Terms of Service</a>
                    {' '}and{' '}
                    <a href="#" className="text-orange-400 hover:underline font-medium">Privacy Policy</a>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}