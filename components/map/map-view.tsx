'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Field, FieldLabel, FieldGroup } from '@/components/ui/field'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const MapComponent = dynamic(
  () => import('./MapComponent').then((mod) => mod.MapComponent),
  { ssr: false, loading: () => <div className="h-[70vh] bg-surface-high flex items-center justify-center text-on-surface">Cargando mapa satelital...</div> }
)

export interface MapPoint {
  lat: number
  lng: number
  nota?: string // Permitimos que el punto guarde una nota de texto
}

interface Cultivo {
  tipo_cultivo_id: number
  nombre: string
}

export function MapView() {
  const [currentPoints, setCurrentPoints] = useState<MapPoint[]>([])
  const [markers, setMarkers] = useState<MapPoint[]>([])
  const [mode, setMode] = useState<'view' | 'polygon' | 'marker'>('view')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [parcels, setParcels] = useState<any[]>([])
  const [cultivos, setCultivos] = useState<Cultivo[]>([])
  const [newParcelData, setNewParcelData] = useState({ name: '', cropType: '', ubicacion_nombre: '' })
  const [showMarkerDialog, setShowMarkerDialog] = useState(false)
  const [tempMarkerCoords, setTempMarkerCoords] = useState<MapPoint | null>(null)
  const [markerDescription, setMarkerDescription] = useState('')

  // Cargar catálogo de cultivos desde el Backend
  useEffect(() => {
    const obtenerCultivos = async () => {
      try {
        const sessionData = localStorage.getItem('agro-control-user')
        if (!sessionData) return
        const { token } = JSON.parse(sessionData)

        const response = await fetch('http://localhost:4000/api/cultivos', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (response.ok) {
          const resultado = await response.json()
          setCultivos(resultado.data || resultado)
        }
      } catch (error) {
        console.error("Error al cargar el catálogo de cultivos:", error)
      }
    }
    obtenerCultivos()
  }, [])

  const calculateArea = (points: MapPoint[]): number => {
    if (points.length < 3) return 0
    let area = 0
    const factorMetros = 111320
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length
      const x1 = points[i].lng * factorMetros * Math.cos(points[i].lat * (Math.PI / 180))
      const y1 = points[i].lat * factorMetros
      const x2 = points[j].lng * factorMetros * Math.cos(points[j].lat * (Math.PI / 180))
      const y2 = points[j].lat * factorMetros
      area += x1 * y2 - x2 * y1
    }
    return Math.abs(area / 2) / 10000
  }

  const handleCreateParcel = async () => {
    if (!newParcelData.name || !newParcelData.cropType || !newParcelData.ubicacion_nombre || currentPoints.length < 3) return

    try {
      const sessionData = localStorage.getItem('agro-control-user')
      if (!sessionData) return
      const { token, usuario_id } = JSON.parse(sessionData)
      const area = calculateArea(currentPoints)

      const coordenadasGeoJSON = [
        ...currentPoints.map(p => [p.lng, p.lat]),
        [currentPoints[0].lng, currentPoints[0].lat]
      ]

      const cuerpoPeticion = {
        usuario_id: usuario_id || "99e26b65-2367-418b-8f14-09bdd8c0dabc",
        nombre: newParcelData.name,
        ubicacion_nombre: newParcelData.ubicacion_nombre,
        tipo_cultivo_id: parseInt(newParcelData.cropType),
        area_hectareas: parseFloat(area.toFixed(2)),
        geometria: { type: "Polygon", coordinates: [coordenadasGeoJSON] }
      }

      const response = await fetch('http://localhost:4000/api/parcelas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(cuerpoPeticion)
      })

      const resultado = await response.json()

      if (response.ok) {
        setParcels([...parcels, {
          id: resultado.data.parcela_id,
          name: newParcelData.name,
          cropType: newParcelData.cropType,
          ubicacion_nombre: newParcelData.ubicacion_nombre,
          area: area,
          coordinates: currentPoints
        }])
        setCurrentPoints([])
        setNewParcelData({ name: '', cropType: '', ubicacion_nombre: '' })
        setShowCreateDialog(false)
        setMode('view')
      }
    } catch (error) {
      console.error("Error al conectar con la API:", error)
    }
  }

  const handleMapClickForMarker = (coords: MapPoint) => {
    setTempMarkerCoords(coords)
    setShowMarkerDialog(true)
  }

  return (
    <div className="space-y-6">
      <header className="pt-4">
        <div>
          <p className="text-on-surface-variant text-sm font-medium uppercase tracking-wider mb-2">
            Herramienta Satelital CIAT
          </p>
          <h1 className="text-display-md text-on-surface">Mapa de Parcelas</h1>
        </div>
      </header>

      {/* Barra de herramientas responsiva */}
      <Card className="bg-surface-lowest shadow-ambient border-0">
        <CardContent className="p-4 grid grid-cols-2 gap-3 md:flex md:flex-wrap md:items-center">
          <Button
            variant={mode === 'view' ? 'default' : 'outline'} size="sm" onClick={() => setMode('view')}
            className={mode === 'view' ? 'bg-[var(--primary)] text-[var(--on-primary)] border-0 w-full md:w-auto' : 'bg-surface-high border-0 w-full md:w-auto'}
          >
            <span className="material-symbols-outlined text-lg mr-1">pan_tool</span> Ver Mapa
          </Button>
          
          <Button
            variant={mode === 'polygon' ? 'default' : 'outline'} size="sm" onClick={() => setMode('polygon')}
            className={mode === 'polygon' ? 'bg-[var(--tertiary)] text-[var(--on-tertiary-fixed)] border-0 w-full md:w-auto' : 'bg-surface-high border-0 w-full md:w-auto'}
          >
            <span className="material-symbols-outlined text-lg mr-1">polyline</span> Dibujar Parcela
          </Button>

          <Button
            variant={mode === 'marker' ? 'default' : 'outline'} size="sm" onClick={() => setMode('marker')}
            className={mode === 'marker' ? 'bg-amber-600 text-white border-0 w-full md:w-auto' : 'bg-surface-high border-0 w-full md:w-auto'}
          >
            <span className="material-symbols-outlined text-lg mr-1">location_on</span> Punto Referencia
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => { setCurrentPoints([]); setMarkers([]); }} className="bg-surface-high border-0 w-full md:w-auto">
            <span className="material-symbols-outlined text-lg mr-1">delete</span> Limpiar Todo
          </Button>

          {currentPoints.length >= 3 && (
            <Button
              size="sm" onClick={() => setShowCreateDialog(true)}
              className="bg-[var(--tertiary)] text-[var(--on-tertiary-fixed)] border-0 col-span-2 md:ml-auto md:w-auto"
            >
              <span className="material-symbols-outlined text-lg mr-1">check</span> Guardar Parcela
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Contenedor del Mapa */}
      <Card className="bg-surface-lowest shadow-ambient border-0 overflow-hidden relative">
        <MapComponent 
          mode={mode} 
          currentPoints={currentPoints} 
          setCurrentPoints={setCurrentPoints} 
          markers={markers}
          onAddMarker={handleMapClickForMarker} // 📝 Conectado a la función de control
          parcels={parcels}
          cultivos={cultivos}
        />
      </Card>

      {/* 🌾 Diálogo 1: Registrar Parcela */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md border-0 shadow-elevated z-[10000]">
          <DialogHeader>
            <DialogTitle>Registrar Nueva Parcela</DialogTitle>
            <DialogDescription>
              Superficie estimada: <span className="font-bold text-[var(--tertiary)]">{calculateArea(currentPoints).toFixed(2)} ha</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <FieldGroup>
              <Field>
                <FieldLabel>Nombre del Lote</FieldLabel>
                <Input placeholder="Ej: Lote Soya Norte" value={newParcelData.name} onChange={(e) => setNewParcelData({ ...newParcelData, name: e.target.value })} />
              </Field>
              <Field>
                <FieldLabel>Municipio / Ubicación</FieldLabel>
                <Input placeholder="Ej: Montero, San Pedro" value={newParcelData.ubicacion_nombre} onChange={(e) => setNewParcelData({ ...newParcelData, ubicacion_nombre: e.target.value })} />
              </Field>
              <Field>
                <FieldLabel>Tipo de Cultivo</FieldLabel>
                <Select value={newParcelData.cropType} onValueChange={(val) => setNewParcelData({ ...newParcelData, cropType: val })}>
                  <SelectTrigger><SelectValue placeholder="Seleccione cultivo" /></SelectTrigger>
                  <SelectContent className="z-[10005]">
                    {cultivos.length > 0 ? (
                      cultivos.map((c) => (
                        <SelectItem key={c.tipo_cultivo_id} value={c.tipo_cultivo_id.toString()}>{c.nombre}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>No se cargaron cultivos</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreateParcel} className="bg-[var(--tertiary)] text-[var(--on-tertiary-fixed)] border-0">Guardar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 📍 Diálogo 2: Registrar Nota del Punto de Referencia */}
      <Dialog open={showMarkerDialog} onOpenChange={setShowMarkerDialog}>
        <DialogContent className="sm:max-w-xs border-0 shadow-elevated z-[10000]">
          <DialogHeader>
            <DialogTitle>Nota del Punto</DialogTitle>
            <DialogDescription>Asigna una etiqueta rápida para este lugar.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Field>
              <FieldLabel>Descripción</FieldLabel>
              <Input 
                placeholder="Ej: Entrada, Pozo, Maquinaria..." 
                value={markerDescription} 
                onChange={(e) => setMarkerDescription(e.target.value)} 
              />
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => { setShowMarkerDialog(false); setMarkerDescription(''); }}>Cancelar</Button>
            <Button 
              size="sm" className="bg-amber-600 text-white border-0"
              onClick={() => {
                if (tempMarkerCoords && markerDescription.trim()) {
                  setMarkers(prev => [...prev, { ...tempMarkerCoords, nota: markerDescription }])
                  setShowMarkerDialog(false)
                  setTempMarkerCoords(null)
                  setMarkerDescription('')
                }
              }}
            >
              Aceptar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}