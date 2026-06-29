'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useGeolocation } from '@/lib/hooks/useGeolocation'
import { generateTerritoryGrid, findCellForPosition, type TerritoryCell } from '@/lib/utils/territory'


interface TerritoryOwnership {
  [cellId: string]: {
    owner_id: string
    dbId: string
    color: string
    bounds?: [number, number][]
  }
}

interface MapViewProps {
  roomId: string
  userId: string
  userColor: string
  isFinished?: boolean
}

export default function MapView({ roomId, userId, userColor, isFinished }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMapRef = useRef<import('leaflet').Map | null>(null)
  const polygonLayersRef = useRef<Record<string, import('leaflet').Polygon>>({})
  const playerMarkerRef = useRef<import('leaflet').CircleMarker | null>(null)
  const lastCapturedCell = useRef<string | null>(null)
  const gridIsFromGPS = useRef(false) // true once the grid is seeded from real GPS

  const [grid, setGrid] = useState<TerritoryCell[]>([])
  const [ownership, setOwnership] = useState<TerritoryOwnership>({})
  const [mapReady, setMapReady] = useState(false)
  const [capturing, setCapturing] = useState(false)
  const [captureMsg, setCaptureMsg] = useState<string | null>(null)

  const geo = useGeolocation(!isFinished)
  const supabase = createClient()

  // Initialize Leaflet map
  useEffect(() => {
    let isMounted = true

    const initMap = async () => {
      if (!mapRef.current || leafletMapRef.current) return

      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')

      if (!isMounted || !mapRef.current || leafletMapRef.current) return

      // Clean up Leaflet's internal id if it was orphaned by StrictMode
      if ((mapRef.current as any)._leaflet_id) {
        (mapRef.current as any)._leaflet_id = null
      }

      // Default to New York if no GPS yet, it will pan when GPS is found
      const defaultLat = geo.latitude ?? 40.7128
      const defaultLng = geo.longitude ?? -74.0060

      const map = L.map(mapRef.current, {
        center: [defaultLat, defaultLng],
        zoom: 17,
        zoomControl: false, // we will add it manually to bottomright
        attributionControl: true,
      })

      L.control.zoom({ position: 'bottomright' }).addTo(map)

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 19,
      }).addTo(map)

      leafletMapRef.current = map
      setMapReady(true)

      const generatedGrid = generateTerritoryGrid(defaultLat, defaultLng)
      setGrid(generatedGrid)
    }

    initMap()

    return () => {
      isMounted = false
      if (leafletMapRef.current) {
        leafletMapRef.current.remove()
        leafletMapRef.current = null
      }
    }
  }, [])

  // Update grid center when we get real GPS (overrides the New York fallback)
  useEffect(() => {
    if (isFinished) return
    if (!geo.latitude || !geo.longitude) return
    if (gridIsFromGPS.current) return // already seeded from GPS, no need to redo
    gridIsFromGPS.current = true
    // Clear old polygon layers since the grid is being regenerated
    Object.values(polygonLayersRef.current).forEach(p => p.remove())
    polygonLayersRef.current = {}
    lastCapturedCell.current = null
    const generatedGrid = generateTerritoryGrid(geo.latitude, geo.longitude)
    setGrid(generatedGrid)
    leafletMapRef.current?.setView([geo.latitude, geo.longitude], 17)
  }, [geo.latitude, geo.longitude, isFinished])

  // Load existing territory ownership from DB
  useEffect(() => {
    if (!mapReady) return
    const loadTerritories = async () => {
      const { data } = await supabase
        .from('territories')
        .select('id, owner_id, geojson_bounds, room_participants(color)')
        .eq('room_id', roomId)

      if (!data) return
      const map: TerritoryOwnership = {}
      for (const t of data) {
        const bounds = t.geojson_bounds as any
        if (bounds?.cellId) {
          const participant = (t.room_participants as { color: string }[] | null)?.[0] ?? null
          map[bounds.cellId] = {
            owner_id: t.owner_id,
            dbId: t.id,
            color: participant?.color ?? '#9CA3AF',
            bounds: bounds.coordinates?.[0]?.map((c: number[]) => [c[1], c[0]]) as [number, number][],
          }
        }
      }
      setOwnership(map)
    }
    loadTerritories()
  }, [mapReady, roomId])

  // Subscribe to realtime territory changes
  useEffect(() => {
    if (!mapReady || isFinished) return
    const channel = supabase
      .channel(`territories-${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'territories', filter: `room_id=eq.${roomId}` },
        async (payload) => {
          const record = payload.new as {
            id: string; owner_id: string; geojson_bounds: { cellId: string }
          }
          if (!record?.geojson_bounds?.cellId) return

          // Get owner color
          const { data: participant } = await supabase
            .from('room_participants')
            .select('color')
            .eq('room_id', roomId)
            .eq('user_id', record.owner_id)
            .single()

          setOwnership(prev => ({
            ...prev,
            [record.geojson_bounds.cellId]: {
              owner_id: record.owner_id,
              dbId: record.id,
              color: participant?.color ?? '#9CA3AF',
            },
          }))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [mapReady, roomId])

  // Render territory polygons on map
  useEffect(() => {
    const map = leafletMapRef.current
    if (!map) return
    if (!isFinished && grid.length === 0) return

    const applyPolygons = async () => {
      const L = (await import('leaflet')).default
      
      const itemsToRender = isFinished 
        ? Object.entries(ownership).map(([id, o]) => ({ id, color: o.color, bounds: o.bounds }))
        : grid.map(cell => {
            const owned = ownership[cell.id]
            return { id: cell.id, color: owned ? owned.color : 'transparent', bounds: cell.bounds }
          })

      let boundsToFit: import('leaflet').LatLngBounds | null = null

      itemsToRender.forEach(({ id, color, bounds }) => {
        if (!bounds) return
        
        const fillOpacity = color === 'transparent' ? 0 : 0.45
        const strokeColor = color === 'transparent' ? 'rgba(255,255,255,0.08)' : color
        const strokeOpacity = color === 'transparent' ? 0.3 : 0.8

        if (polygonLayersRef.current[id]) {
          polygonLayersRef.current[id].setStyle({
            fillColor: color,
            fillOpacity,
            color: strokeColor,
            opacity: strokeOpacity,
            weight: 1.5,
          })
        } else {
          const poly = L.polygon(bounds as [number, number][], {
            fillColor: color,
            fillOpacity,
            color: strokeColor,
            opacity: strokeOpacity,
            weight: 1.5,
            smoothFactor: 1.5,
            lineJoin: 'round',
            className: 'territory-polygon',
          }).addTo(map)
          polygonLayersRef.current[id] = poly
        }
        
        if (isFinished && color !== 'transparent') {
           if (!boundsToFit) {
             boundsToFit = L.latLngBounds(bounds as [number, number][])
           } else {
             boundsToFit.extend(bounds as [number, number][])
           }
        }
      })
      
      // Auto-fit bounds if we just loaded the finished map
      if (isFinished && boundsToFit && Object.keys(polygonLayersRef.current).length > 0 && !gridIsFromGPS.current) {
         gridIsFromGPS.current = true
         map.fitBounds(boundsToFit, { padding: [50, 50] })
      }
    }
    applyPolygons()
  }, [grid, ownership, isFinished])

  // Move player marker and trigger capture
  const handleCapture = useCallback(async (lat: number, lng: number) => {
    if (isFinished) return
    
    const map = leafletMapRef.current
    if (!map) return

    const L = (await import('leaflet')).default

    // Update/create player marker
    if (playerMarkerRef.current) {
      playerMarkerRef.current.setLatLng([lat, lng])
    } else {
      playerMarkerRef.current = L.circleMarker([lat, lng], {
        radius: 8,
        fillColor: userColor,
        fillOpacity: 1,
        color: '#fff',
        weight: 2,
      }).addTo(map)
    }

    // Find which cell player is in
    const cell = findCellForPosition(lat, lng, grid)
    if (!cell || cell.id === lastCapturedCell.current) return

    // Check ownership
    const currentOwner = ownership[cell.id]
    if (currentOwner?.owner_id === userId) return // already mine

    lastCapturedCell.current = cell.id
    setCapturing(true)

    try {
      const geojsonBounds = {
        cellId: cell.id,
        type: 'Polygon',
        coordinates: [cell.bounds.map(([lat, lng]) => [lng, lat])],
        centerLat: cell.centerLat,
        centerLng: cell.centerLng,
      }

      if (currentOwner) {
        // Update existing territory
        await supabase
          .from('territories')
          .update({ owner_id: userId, last_updated_at: new Date().toISOString() })
          .eq('id', currentOwner.dbId)
        setCaptureMsg('⚔️ Captured!')
      } else {
        // Insert new territory
        await supabase.from('territories').insert({
          room_id: roomId,
          owner_id: userId,
          geojson_bounds: geojsonBounds,
          area_size: 2500, // ~50m x 50m
        })
        setCaptureMsg('✅ Claimed!')
      }
    } catch {
      // silent fail
    } finally {
      setCapturing(false)
      setTimeout(() => setCaptureMsg(null), 1500)
    }
  }, [grid, ownership, userId, userColor, roomId])

  useEffect(() => {
    if (geo.latitude && geo.longitude && mapReady && grid.length > 0) {
      handleCapture(geo.latitude, geo.longitude)
    }
  }, [geo.latitude, geo.longitude, mapReady, grid.length, handleCapture])

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />

      {/* GPS status */}
      {!isFinished && (
        <div className="absolute top-4 left-4 z-[1000]">
          <div className={`bg-white rounded-full px-3 py-1.5 border shadow-sm text-xs font-semibold flex items-center gap-2 ${
            geo.latitude
              ? 'border-green-200 text-green-700'
              : geo.error
              ? 'border-red-200 text-red-600'
              : 'border-gray-200 text-gray-500'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              geo.latitude ? 'bg-green-500 animate-pulse' : geo.error ? 'bg-red-500' : 'bg-gray-300'
            }`} />
            {geo.latitude
              ? `GPS: ${geo.latitude.toFixed(5)}, ${geo.longitude?.toFixed(5)}`
              : geo.error
              ? 'GPS Error'
              : 'Acquiring GPS...'}
          </div>
        </div>
      )}

      {/* Capture message */}
      {captureMsg && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[1000] bg-white rounded-full px-4 py-2 border border-blue-200 shadow-md text-sm font-bold text-blue-700 animate-bounce flex items-center gap-2">
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          {captureMsg}
        </div>
      )}

      {/* Capturing indicator */}
      {capturing && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-white rounded-full px-4 py-2 border border-blue-200 shadow-sm text-xs font-medium text-blue-600 flex items-center gap-2">
           <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
           </svg>
          Capturing territory...
        </div>
      )}

      {/* Center on player button */}
      {!isFinished && geo.latitude && (
        <button
          onClick={() => leafletMapRef.current?.setView([geo.latitude!, geo.longitude!], 17)}
          className="absolute bottom-6 right-4 z-[1000] w-10 h-10 bg-white rounded-full border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-colors shadow-md"
          title="Center on me"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
        </button>
      )}
    </div>
  )
}
