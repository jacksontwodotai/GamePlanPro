import { useState, useCallback } from 'react'

interface ApiResponse<T> {
  data: T | null
  loading: boolean
  error: string | null
}

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  body?: any
}

interface UseApiReturn<T> {
  data: T | null
  loading: boolean
  error: string | null
  execute: (url: string, options?: ApiOptions) => Promise<T>
  reset: () => void
}

export function useApi<T = any>(): UseApiReturn<T> {
  const [state, setState] = useState<ApiResponse<T>>({
    data: null,
    loading: false,
    error: null
  })

  const execute = useCallback(async (url: string, options: ApiOptions = {}): Promise<T> => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const {
        method = 'GET',
        headers = {},
        body
      } = options

      const config: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      }

      if (body && method !== 'GET') {
        config.body = typeof body === 'string' ? body : JSON.stringify(body)
      }

      const response = await fetch(url, config)

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`

        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch {
          // If response is not JSON, use the default error message
        }

        throw new Error(errorMessage)
      }

      const result = await response.json()

      setState({
        data: result,
        loading: false,
        error: null
      })

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'

      setState({
        data: null,
        loading: false,
        error: errorMessage
      })

      throw err
    }
  }, [])

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null
    })
  }, [])

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    execute,
    reset
  }
}

// Convenience hook for common API patterns
export function useApiWithState<T = any>(initialData: T | null = null) {
  const { data, loading, error, execute, reset } = useApi<T>()
  const [localData, setLocalData] = useState<T | null>(initialData)

  const executeAndUpdate = useCallback(async (url: string, options?: ApiOptions) => {
    try {
      const result = await execute(url, options)
      setLocalData(result)
      return result
    } catch (err) {
      throw err
    }
  }, [execute])

  const updateLocalData = useCallback((newData: T | null) => {
    setLocalData(newData)
  }, [])

  return {
    data: data || localData,
    loading,
    error,
    execute: executeAndUpdate,
    reset: () => {
      reset()
      setLocalData(initialData)
    },
    updateLocalData
  }
}