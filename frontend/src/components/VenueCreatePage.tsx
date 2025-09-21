import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import VenueForm from './VenueForm'

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

export default function VenueCreatePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (venueData: VenueFormData) => {
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

      const response = await fetch('/api/venues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `Failed to create venue (${response.status})`)
      }

      // Success - the form component will handle navigation

    } catch (error) {
      console.error('Error creating venue:', error)
      throw error // Re-throw to let the form component handle the error display
    } finally {
      setLoading(false)
    }
  }

  return (
    <VenueForm
      mode="create"
      onSubmit={handleSubmit}
      loading={loading}
    />
  )
}