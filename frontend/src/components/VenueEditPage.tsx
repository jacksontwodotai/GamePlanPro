import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import VenueForm from './VenueForm'
import { AlertTriangle, Building2 } from 'lucide-react'
import { Button } from './ui/button'

interface Venue {
  id: string
  name: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  capacity?: number
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface VenueFormData {
  name: string
  address: string
  city: string
  state: string
  zip_code: string
  capacity: string
  description: string
  is_active: boolean
}

export default function VenueEditPage() {
  const navigate = useNavigate()
  const { venueId } = useParams<{ venueId: string }>()

  const [venue, setVenue] = useState<Venue | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch venue data
  useEffect(() => {
    if (!venueId) {
      setError('No venue ID provided')
      setFetchLoading(false)
      return
    }

    fetchVenue()
  }, [venueId])

  const fetchVenue = async () => {
    try {
      setFetchLoading(true)
      setError(null)

      const response = await fetch(`/api/venues/${venueId}`)

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Venue not found')
        }
        throw new Error(`Failed to fetch venue (${response.status})`)
      }

      const venueData = await response.json()
      setVenue(venueData)

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch venue'
      setError(message)
      console.error('Error fetching venue:', error)
    } finally {
      setFetchLoading(false)
    }
  }

  const handleSubmit = async (venueData: VenueFormData) => {
    if (!venueId) {
      throw new Error('No venue ID available for update')
    }

    try {
      setLoading(true)

      // Prepare the data for API submission
      const submitData = {
        name: venueData.name,
        address: venueData.address,
        city: venueData.city,
        state: venueData.state,
        zip_code: venueData.zip_code,
        capacity: parseInt(venueData.capacity),
        description: venueData.description || undefined,
        is_active: venueData.is_active
      }

      const response = await fetch(`/api/venues/${venueId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `Failed to update venue (${response.status})`)
      }

      // Success - the form component will handle navigation

    } catch (error) {
      console.error('Error updating venue:', error)
      throw error // Re-throw to let the form component handle the error display
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    fetchVenue()
  }

  const handleBackToList = () => {
    navigate('/dashboard/venues')
  }

  // Loading state
  if (fetchLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading venue...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Error Loading Venue</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <div className="flex justify-center space-x-4">
            <Button
              onClick={handleRetry}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={handleBackToList}
              className="border-zinc-600 text-gray-300 hover:bg-zinc-700"
            >
              Back to Venues
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Venue not found
  if (!venue) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Venue Not Found</h3>
          <p className="text-gray-400 mb-4">The venue you're looking for doesn't exist or has been deleted.</p>
          <Button
            onClick={handleBackToList}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            Back to Venues
          </Button>
        </div>
      </div>
    )
  }

  // Render form with venue data
  return (
    <VenueForm
      mode="edit"
      venue={venue}
      onSubmit={handleSubmit}
      loading={loading}
    />
  )
}