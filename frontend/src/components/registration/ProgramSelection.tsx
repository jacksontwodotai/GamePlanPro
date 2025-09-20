import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'

interface ProgramSelectionProps {
  flowState: any
  onNext: (data?: any) => void
  onBack: () => void
  onUpdateFlowState: (updates: any) => void
}

export default function ProgramSelection({ flowState, onNext, onBack, onUpdateFlowState }: ProgramSelectionProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Select Program</CardTitle>
          <CardDescription>Choose from available programs to register for</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">Program selection component placeholder</p>
          <div className="flex justify-between">
            <Button variant="outline" onClick={onBack} disabled>
              Back
            </Button>
            <Button onClick={() => onNext({ programId: 'sample-program' })}>
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}