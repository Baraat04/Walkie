'use client'

import { useEffect, useRef, useState } from 'react'

export interface GeolocationState {
  latitude: number | null
  longitude: number | null
  accuracy: number | null
  error: string | null
  loading: boolean
}

export function useGeolocation(enabled = true) {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: true,
  })

  const watchId = useRef<number | null>(null)

  useEffect(() => {
    if (!enabled) return

    if (!navigator.geolocation) {
      setState({
        latitude: null,
        longitude: null,
        accuracy: null,
        error: 'Geolocation is not supported by this browser',
        loading: false,
      })
      return
    }

    const onSuccess = (pos: GeolocationPosition) => {
      console.log('GPS SUCCESS', pos.coords)

      setState({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        error: null,
        loading: false,
      })
    }

    const onError = (err: GeolocationPositionError) => {
      console.error('GPS ERROR')
      console.error('Code:', err.code)
      console.error('Message:', err.message)

      let message = err.message

      switch (err.code) {
        case 1:
          message = 'Location permission denied'
          break
        case 2:
          message = 'Location unavailable'
          break
        case 3:
          message = 'Location request timed out'
          break
      }

      setState(prev => ({
        ...prev,
        error: message,
        loading: false,
      }))
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 0,
    }

    // First get one position
    navigator.geolocation.getCurrentPosition(
      onSuccess,
      onError,
      options
    )

    // Then start watching
    watchId.current = navigator.geolocation.watchPosition(
      onSuccess,
      onError,
      options
    )

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current)
      }
    }
  }, [enabled])

  return state
}