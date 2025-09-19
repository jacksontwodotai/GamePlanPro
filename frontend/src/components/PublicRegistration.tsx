import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Users, Calendar, Trophy, ArrowRight, Star } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
}

const features = [
  {
    icon: Users,
    title: "Expert Coaching",
    description: "Learn from experienced coaches dedicated to player development"
  },
  {
    icon: Calendar,
    title: "Flexible Scheduling",
    description: "Multiple program times to fit your busy schedule"
  },
  {
    icon: Trophy,
    title: "Competitive Play",
    description: "Opportunities for tournament and league participation"
  }
]

export default function PublicRegistration() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-6 py-12">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="space-y-12"
        >
          {/* Hero Section */}
          <motion.div variants={itemVariants} className="text-center space-y-6">
            <h1 className="text-5xl font-bold text-gray-900">
              Join Our Sports Programs
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover exciting sports programs designed for all skill levels.
              Build skills, make friends, and have fun in a supportive environment.
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/register">
                <Button size="lg" className="text-lg px-8 py-6">
                  Start Registration
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Features Grid */}
          <motion.div variants={itemVariants} className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -5 }}
                className="bg-white rounded-lg shadow-lg overflow-hidden"
              >
                <Card className="h-full border-0">
                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                      <feature.icon className="h-8 w-8 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Registration Process */}
          <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Easy Registration Process
              </h2>
              <p className="text-gray-600">
                Get started in just three simple steps
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="mx-auto w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">
                  1
                </div>
                <h3 className="text-lg font-semibold mb-2">Choose Your Program</h3>
                <p className="text-gray-600">
                  Browse available programs and select the one that's right for you
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">
                  2
                </div>
                <h3 className="text-lg font-semibold mb-2">Complete Your Information</h3>
                <p className="text-gray-600">
                  Fill out player details and emergency contact information
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">
                  3
                </div>
                <h3 className="text-lg font-semibold mb-2">Confirm & Pay</h3>
                <p className="text-gray-600">
                  Review your registration and complete payment to secure your spot
                </p>
              </div>
            </div>
          </motion.div>

          {/* Testimonials */}
          <motion.div variants={itemVariants} className="text-center space-y-8">
            <h2 className="text-3xl font-bold text-gray-900">
              What Our Players Say
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  name: "Sarah Johnson",
                  role: "Parent",
                  content: "My daughter loves the soccer program! The coaches are amazing and she's improved so much.",
                  rating: 5
                },
                {
                  name: "Mike Chen",
                  role: "Player",
                  content: "Great facilities and excellent coaching. I've made so many friends here!",
                  rating: 5
                },
                {
                  name: "Lisa Rodriguez",
                  role: "Parent",
                  content: "Professional organization and clear communication. Highly recommend!",
                  rating: 5
                }
              ].map((testimonial, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                >
                  <Card className="h-full">
                    <CardContent className="p-6">
                      <div className="flex mb-3">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <p className="text-gray-600 mb-4 italic">
                        "{testimonial.content}"
                      </p>
                      <div>
                        <p className="font-semibold">{testimonial.name}</p>
                        <p className="text-sm text-gray-500">{testimonial.role}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Call to Action */}
          <motion.div variants={itemVariants} className="text-center bg-blue-600 text-white rounded-xl p-12">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join hundreds of players who have already signed up for our programs
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/register">
                <Button
                  size="lg"
                  variant="secondary"
                  className="text-lg px-8 py-6 bg-white text-blue-600 hover:bg-gray-100"
                >
                  Register Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}