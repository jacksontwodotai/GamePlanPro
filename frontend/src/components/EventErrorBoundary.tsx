import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class EventErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Event Scheduler Error:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <Card className="max-w-2xl w-full border-red-200 shadow-xl bg-white">
            <CardHeader className="bg-red-50 border-b border-red-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <AlertCircle className="h-7 w-7 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-xl text-red-900">
                    Event Scheduler Error
                  </CardTitle>
                  <p className="text-sm text-red-600 mt-1">
                    Something went wrong while loading the event scheduler
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {this.state.error && (
                  <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg">
                    <p className="font-semibold text-zinc-900 mb-2">
                      Error Details:
                    </p>
                    <p className="text-sm text-zinc-700 font-mono">
                      {this.state.error.message}
                    </p>
                  </div>
                )}

                {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                  <details className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg">
                    <summary className="font-semibold text-zinc-900 cursor-pointer">
                      Stack Trace (Development Only)
                    </summary>
                    <pre className="mt-3 text-xs text-zinc-600 overflow-auto max-h-48">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}

                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-zinc-500">
                    Try refreshing the page or contact support if the problem persists
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => window.location.reload()}
                      className="border-zinc-300"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh Page
                    </Button>
                    <Button
                      onClick={this.handleReset}
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

export default EventErrorBoundary