import { motion } from 'framer-motion'
import { CheckCircle, Download, Home, Calendar, CreditCard } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Link } from 'react-router-dom'

interface PaymentConfirmationProps {
  paymentResult: {
    paymentIntent: any
    payment: any
    message: string
  }
  programName: string
  playerName: string
  amount: number
  onDownloadReceipt?: () => void
}

const containerVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut",
      staggerChildren: 0.1
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

export default function PaymentConfirmation({
  paymentResult,
  programName,
  playerName,
  amount,
  onDownloadReceipt
}: PaymentConfirmationProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const transactionId = paymentResult.paymentIntent.id
  const paymentMethod = paymentResult.paymentIntent.payment_method
  const createdDate = paymentResult.paymentIntent.created

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-6">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full max-w-2xl space-y-6"
      >
        {/* Success Header */}
        <motion.div variants={itemVariants} className="text-center">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>
          <p className="text-gray-600 text-lg">
            Your registration has been confirmed
          </p>
        </motion.div>

        {/* Payment Details Card */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Receipt
              </CardTitle>
              <CardDescription>
                Transaction completed on {formatDate(createdDate)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Transaction Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Program</label>
                    <p className="text-lg font-semibold">{programName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Player Name</label>
                    <p className="text-lg font-semibold">{playerName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Amount Paid</label>
                    <p className="text-2xl font-bold text-green-600">${amount.toFixed(2)}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Transaction ID</label>
                    <p className="text-sm font-mono bg-gray-100 p-2 rounded break-all">
                      {transactionId}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Payment Method</label>
                    <p className="text-lg">•••• •••• •••• (Card)</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-green-600 font-medium">Confirmed</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <hr className="border-gray-200" />

              {/* Next Steps */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  What's Next?
                </h3>
                <ul className="space-y-2 text-blue-800">
                  <li>• You will receive a confirmation email shortly</li>
                  <li>• Program details and schedule will be sent via email</li>
                  <li>• Check your account dashboard for updates</li>
                  <li>• Contact support if you have any questions</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center">
          {onDownloadReceipt && (
            <Button
              variant="outline"
              onClick={onDownloadReceipt}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Receipt
            </Button>
          )}
          <Link to="/dashboard">
            <Button className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Go to Dashboard
            </Button>
          </Link>
        </motion.div>

        {/* Footer */}
        <motion.div variants={itemVariants} className="text-center text-sm text-gray-500">
          <p>Need help? Contact our support team</p>
          <p className="mt-1">support@gameplanpro.com • (555) 123-4567</p>
        </motion.div>
      </motion.div>
    </div>
  )
}