import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'

interface FeeSummaryProps {
  flowState: any
  onNext: (data?: any) => void
  onBack: () => void
  onUpdateFlowState: (updates: any) => void
}

export default function FeeSummary({ flowState, onNext, onBack, onUpdateFlowState }: FeeSummaryProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Fee Summary</CardTitle>
          <CardDescription>Review your registration fees before proceeding to payment</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">Fee summary component placeholder</p>
          <div className="flex justify-between">
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button onClick={() => onNext({ feesConfirmed: true })}>
              Proceed to Payment
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}