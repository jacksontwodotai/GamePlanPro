import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { CreditCard, Lock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { useApi } from '../hooks/useApi'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_...')

interface PaymentFormProps {
  amount: number
  programRegistrationId: string
  programName: string
  onSuccess: (paymentResult: any) => void
  onError: (error: string) => void
}

const PaymentFormContent = ({ amount, programRegistrationId, programName, onSuccess, onError }: PaymentFormProps) => {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [clientSecret, setClientSecret] = useState('')
  const [paymentIntentId, setPaymentIntentId] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [cardComplete, setCardComplete] = useState(false)
  const [cardError, setCardError] = useState('')
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  const { loading: createIntentLoading, execute } = useApi<any>()

  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  useEffect(() => {
    createPaymentIntent()
  }, [amount, programRegistrationId])

  const createPaymentIntent = async () => {
    try {
      const response = await execute('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          amount,
          program_registration_id: programRegistrationId
        })
      })

      setClientSecret(response.client_secret)
      setPaymentIntentId(response.payment_intent_id)
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to initialize payment'
      setErrorMessage(errorMsg)
      onError(errorMsg)
    }
  }

  // Handle card input changes for real-time validation
  const handleCardChange = (event: any) => {
    setCardComplete(event.complete)
    setCardError(event.error?.message || '')

    // Clear general error when user starts typing
    if (errorMessage && event.complete) {
      setErrorMessage('')
    }
  }

  // Enhanced form validation
  const validateForm = () => {
    if (!stripe || !elements) {
      setErrorMessage('Payment system not loaded. Please refresh and try again.')
      return false
    }

    if (!clientSecret) {
      setErrorMessage('Payment not initialized. Please refresh and try again.')
      return false
    }

    if (!cardComplete) {
      setErrorMessage('Please complete your card information.')
      return false
    }

    if (cardError) {
      setErrorMessage(cardError)
      return false
    }

    return true
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    // Enhanced form validation
    if (!validateForm()) {
      return
    }

    setIsProcessing(true)
    setErrorMessage('')
    setCardError('')

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      setErrorMessage('Payment form not loaded properly. Please refresh and try again.')
      setIsProcessing(false)
      return
    }

    try {
      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        }
      })

      if (error) {
        // Enhanced error handling with user-friendly messages
        let userFriendlyMessage = error.message || 'Payment failed'

        switch (error.code) {
          case 'card_declined':
            userFriendlyMessage = 'Your card was declined. Please try a different payment method or contact your bank.'
            break
          case 'expired_card':
            userFriendlyMessage = 'Your card has expired. Please use a different card.'
            break
          case 'incorrect_cvc':
            userFriendlyMessage = 'Your card security code is incorrect. Please check and try again.'
            break
          case 'processing_error':
            userFriendlyMessage = 'An error occurred while processing your card. Please try again.'
            break
          case 'insufficient_funds':
            userFriendlyMessage = 'Your card has insufficient funds. Please try a different payment method.'
            break
          default:
            userFriendlyMessage = error.message || 'Payment failed. Please try again.'
        }

        setErrorMessage(userFriendlyMessage)
        onError(userFriendlyMessage)
      } else if (paymentIntent?.status === 'succeeded') {
        // Show success state briefly before confirming with backend
        setPaymentSuccess(true)

        // Confirm payment with backend
        const confirmResponse = await execute('/api/payments/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({
            payment_intent_id: paymentIntentId,
            program_registration_id: programRegistrationId
          })
        })

        onSuccess({
          paymentIntent,
          payment: confirmResponse.payment,
          message: confirmResponse.message || 'Payment completed successfully'
        })
      } else {
        setErrorMessage('Payment was not completed. Please try again.')
        onError('Payment was not completed. Please try again.')
      }
    } catch (err: any) {
      let errorMsg = 'Payment confirmation failed. Please try again.'

      // Handle specific API errors
      if (err.status === 400) {
        errorMsg = 'Invalid payment information. Please check your details and try again.'
      } else if (err.status === 404) {
        errorMsg = 'Registration not found. Please refresh and try again.'
      } else if (err.status >= 500) {
        errorMsg = 'Server error occurred. Please try again in a moment.'
      } else if (err.message) {
        errorMsg = err.message
      }

      setErrorMessage(errorMsg)
      onError(errorMsg)
      setPaymentSuccess(false)
    } finally {
      setIsProcessing(false)
    }
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  }

  if (createIntentLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2">Initializing payment...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Information
        </CardTitle>
        <CardDescription>
          Complete your registration for {programName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Summary */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Program Fee:</span>
            <span className="font-medium">${amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total:</span>
            <span>${amount.toFixed(2)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Card Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Card Information
            </label>
            <div className={`border rounded-md p-3 bg-white transition-colors ${
              cardError ? 'border-red-300 bg-red-50' :
              cardComplete ? 'border-green-300 bg-green-50' : 'border-gray-300'
            }`}>
              <CardElement
                options={cardElementOptions}
                onChange={handleCardChange}
              />
            </div>

            {/* Real-time card validation feedback */}
            {cardError && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-red-600 text-sm"
              >
                <AlertCircle className="h-4 w-4" />
                <span>{cardError}</span>
              </motion.div>
            )}

            {cardComplete && !cardError && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-green-600 text-sm"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Card information looks good</span>
              </motion.div>
            )}
          </div>

          {/* Security Notice */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Lock className="h-4 w-4" />
            <span>Your payment information is secure and encrypted</span>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-md"
            >
              <AlertCircle className="h-4 w-4" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className={`w-full transition-all ${
              paymentSuccess ? 'bg-green-600 hover:bg-green-700' : ''
            }`}
            disabled={!stripe || isProcessing || !clientSecret || !cardComplete || !!cardError}
          >
            {paymentSuccess ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Payment Successful!
              </>
            ) : isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {paymentSuccess ? 'Confirming Payment...' : 'Processing Payment...'}
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Pay ${amount.toFixed(2)}
              </>
            )}
          </Button>

          {/* Enhanced button state messages */}
          {!cardComplete && !isProcessing && (
            <p className="text-center text-sm text-gray-500">
              Complete your card information to continue
            </p>
          )}

          {cardComplete && !cardError && !isProcessing && (
            <p className="text-center text-sm text-green-600">
              Ready to process payment
            </p>
          )}
        </form>

        {/* Powered by Stripe */}
        <div className="text-center text-xs text-gray-500">
          Powered by Stripe
        </div>
      </CardContent>
    </Card>
  )
}

export default function PaymentForm(props: PaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentFormContent {...props} />
    </Elements>
  )
}