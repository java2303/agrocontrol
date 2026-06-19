'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/lib/app-context'
import type { Parcel } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export function ParcelsView() {
  // 🗺️ Solo usamos navigate del contexto global, los datos vienen de PostgreSQL
  const { navigate } = useApp()
  
  const [parcelas, setParcelas] = useState<Parcel[]>([])
  const [cargando, setCargando] = useState(true)

  const [searchTerm, setSearchTerm] = useState('')
  const [filterCrop, setFilterCrop] = useState<string>('all')
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [parcelToDelete, setParcelToDelete] = useState<string | null>(null)
  
  const [editData, setEditData] = useState({
    name: '',
    cropType: '' as Parcel['cropType'],
    soilStatus: '' as Parcel['soilStatus'],
  })

  // 📡 Cargar las parcelas al iniciar la pantalla
  useEffect(() => {
    const obtenerParcelas = async () => {
      try {
        const sessionData = localStorage.getItem('agro-control-user')
        if (!sessionData) return
        const { token } = JSON.parse(sessionData)

        const response = await fetch('http://localhost:4000/api/parcelas', {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          const resultado = await response.json()
          const parcelasReales = resultado.data.map((p: any) => {
            let coords: any[] = []
            if (p.geom) {
              try {
                const geomObj = typeof p.geom === 'string' ? JSON.parse(p.geom) : p.geom
                if (geomObj && geomObj.coordinates && geomObj.coordinates[0]) {
                  coords = geomObj.coordinates[0].map((coord: any) => ({
                    lat: coord[1],
                    lng: coord[0]
                  }))
                  // Remove closing duplicate point from GeoJSON polygon if present
                  if (coords.length > 1 && coords[0].lat === coords[coords.length - 1].lat && coords[0].lng === coords[coords.length - 1].lng) {
                    coords.pop()
                  }
                }
              } catch (e) {
                console.error("Error parsing geom coordinates:", e)
              }
            }
            return {
              id: p.id,
              name: p.nombre, 
              cropType: p.cropType === 1 ? 'soya' : p.cropType === 2 ? 'maiz' : p.cropType === 3 ? 'trigo' : 'otros',
              area: parseFloat(p.area),
              soilStatus: 'optimo', 
              coordinates: coords, 
              createdAt: p.createdAt || new Date().toISOString() 
            }
          })
          setParcelas(parcelasReales)
        }
      } catch (error) {
        console.error("Error al cargar tus parcelas:", error)
      } finally {
        setCargando(false)
      }
    }

    obtenerParcelas()
  }, [])

  const filteredParcels = parcelas.filter((parcel) => {
    const matchesSearch = parcel.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCrop = filterCrop === 'all' || parcel.cropType === filterCrop
    return matchesSearch && matchesCrop
  })

  const getStatusStyles = (status: Parcel['soilStatus']) => {
    switch (status) {
      case 'optimo': return 'bg-[var(--tertiary-container)] text-[var(--tertiary)]'
      case 'alerta': return 'bg-warning-container text-[var(--warning)]'
      case 'critico': return 'bg-error-container text-[var(--error)]'
    }
  }

  const getCropIcon = (crop: Parcel['cropType']) => {
    switch (crop) {
      case 'soya': return 'nutrition'
      case 'maiz': return 'grass'
      case 'trigo': return 'grain'
      default: return 'eco'
    }
  }

  const getCropStyles = (crop: Parcel['cropType']) => {
    switch (crop) {
      case 'soya': return 'bg-[var(--tertiary)]/12 text-on-surface'
      case 'maiz': return 'bg-[var(--warning)]/12 text-on-surface'
      case 'trigo': return 'bg-[var(--warning)]/20 text-on-surface'
      default: return 'bg-[var(--success)]/12 text-on-surface'
    }
  }

  const handleEditParcel = (parcel: Parcel) => {
    setSelectedParcel(parcel)
    setEditData({
      name: parcel.name,
      cropType: parcel.cropType,
      soilStatus: parcel.soilStatus,
    })
    setShowEditDialog(true)
  }

  // ✏️ Función conectada al backend para EDITAR
  const handleSaveEdit = async () => {
    if (!selectedParcel) return

    try {
      const sessionData = localStorage.getItem('agro-control-user')
      if (!sessionData) return
      const { token } = JSON.parse(sessionData)

      const response = await fetch(`http://localhost:4000/api/parcelas/${selectedParcel.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          name: editData.name,
          cropType: editData.cropType
        })
      })

      if (response.ok) {
        // Actualizamos la pantalla instantáneamente
        setParcelas(parcelas.map(p => 
          p.id === selectedParcel.id 
            ? { ...p, name: editData.name, cropType: editData.cropType, soilStatus: editData.soilStatus } 
            : p
        ))
        setShowEditDialog(false)
        setSelectedParcel(null)
      }
    } catch (error) {
      console.error("Error al actualizar la parcela:", error)
    }
  }

  // 🗑️ Función conectada al backend para ELIMINAR
  const handleDeleteConfirm = async () => {
    if (!parcelToDelete) return

    try {
      const sessionData = localStorage.getItem('agro-control-user')
      if (!sessionData) return
      const { token } = JSON.parse(sessionData)

      const response = await fetch(`http://localhost:4000/api/parcelas/${parcelToDelete}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        // Quitamos la parcela de la lista en pantalla
        setParcelas(parcelas.filter(p => p.id !== parcelToDelete))
        setParcelToDelete(null)
        setShowDeleteDialog(false)
      }
    } catch (error) {
      console.error("Error al eliminar la parcela:", error)
    }
  }

  const totalArea = parcelas.reduce((sum, p) => sum + p.area, 0)

  if (cargando) {
    return <div className="flex justify-center items-center h-64 text-on-surface-variant font-medium">Cargando tus parcelas...</div>
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="pt-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="text-on-surface-variant text-sm font-medium uppercase tracking-wider mb-2">
              Administración
            </p>
            <h1 className="text-display-md text-on-surface">Parcelas</h1>
          </div>
          <Button
            onClick={() => navigate('map')}
            className="bg-[var(--tertiary)] text-[var(--on-tertiary-fixed)] hover:bg-[var(--tertiary-fixed-dim)] h-12 px-6 rounded-xl font-semibold shadow-ambient hover:shadow-elevated transition-smooth border-0"
          >
            <span className="material-symbols-outlined text-lg mr-2">add</span>
            Nueva Parcela
          </Button>
        </div>
      </header>

      {/* Stats Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="bg-surface-lowest shadow-ambient border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--tertiary)]/12 flex items-center justify-center">
                <span className="material-symbols-outlined text-on-surface text-2xl">grid_view</span>
              </div>
              <div>
                <p className="text-display-md text-on-surface leading-none">{parcelas.length}</p>
                <p className="text-sm text-on-surface-variant font-medium mt-1">Total Parcelas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-surface-lowest shadow-ambient border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success-container flex items-center justify-center">
                <span className="material-symbols-outlined text-[var(--success)] text-2xl">landscape</span>
              </div>
              <div>
                <p className="text-display-md text-on-surface leading-none">{totalArea.toFixed(1)}</p>
                <p className="text-sm text-on-surface-variant font-medium mt-1">Hectáreas Totales</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-surface-lowest shadow-ambient border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success-container flex items-center justify-center">
                <span className="material-symbols-outlined text-[var(--success)] text-2xl">check_circle</span>
              </div>
              <div>
                <p className="text-display-md text-on-surface leading-none">
                  {parcelas.filter((p) => p.soilStatus === 'optimo').length}
                </p>
                <p className="text-sm text-on-surface-variant font-medium mt-1">Estado Óptimo</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-surface-lowest shadow-ambient border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-warning-container flex items-center justify-center">
                <span className="material-symbols-outlined text-[var(--warning)] text-2xl">warning</span>
              </div>
              <div>
                <p className="text-display-md text-on-surface leading-none">
                  {parcelas.filter((p) => p.soilStatus !== 'optimo').length}
                </p>
                <p className="text-sm text-on-surface-variant font-medium mt-1">Requieren Atención</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Filters */}
      <Card className="bg-surface-lowest shadow-ambient border-0">
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                search
              </span>
              <Input
                placeholder="Buscar parcelas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-surface-high border-0 h-11 rounded-lg"
              />
            </div>
            <Select value={filterCrop} onValueChange={setFilterCrop}>
              <SelectTrigger className="w-full md:w-48 bg-surface-high border-0 h-11 rounded-lg">
                <SelectValue placeholder="Filtrar por cultivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los cultivos</SelectItem>
                <SelectItem value="soya">Soya</SelectItem>
                <SelectItem value="maiz">Maíz</SelectItem>
                <SelectItem value="trigo">Trigo</SelectItem>
                <SelectItem value="otros">Otros</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Parcels Grid */}
      {filteredParcels.length > 0 ? (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredParcels.map((parcel) => (
            <Card
              key={parcel.id}
              className="bg-surface-lowest shadow-ambient border-0 hover:shadow-elevated transition-smooth group"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl ${getCropStyles(parcel.cropType)} flex items-center justify-center`}>
                      <span className="material-symbols-outlined text-2xl">{getCropIcon(parcel.cropType)}</span>
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-on-surface">{parcel.name}</CardTitle>
                      <CardDescription className="capitalize text-on-surface-variant">{parcel.cropType}</CardDescription>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-sm ${getStatusStyles(parcel.soilStatus)}`}>
                    {parcel.soilStatus === 'optimo' ? 'Óptimo' : parcel.soilStatus === 'alerta' ? 'Alerta' : 'Crítico'}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-surface-low rounded-lg p-4">
                      <p className="text-xs text-on-surface-variant font-medium">Área</p>
                      <p className="text-xl font-bold text-on-surface mt-1">{parcel.area.toFixed(2)} ha</p>
                    </div>
                    <div className="bg-surface-low rounded-lg p-4">
                      <p className="text-xs text-on-surface-variant font-medium">Puntos GPS</p>
                      <p className="text-xl font-bold text-on-surface mt-1">GeoJSON</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-base">calendar_today</span>
                    <span>Creada: {new Date(parcel.createdAt).toLocaleDateString('es-ES')}</span>
                  </div>

                  <div className="flex gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-smooth">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('map')}
                      className="flex-1 bg-surface-high border-0 hover:bg-surface-container"
                    >
                      <span className="material-symbols-outlined text-base mr-1">map</span>
                      Ver en Mapa
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditParcel(parcel)}
                      className="bg-surface-high border-0 hover:bg-surface-container"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setParcelToDelete(parcel.id)
                        setShowDeleteDialog(true)
                      }}
                      className="bg-surface-high border-0 hover:bg-error-container hover:text-[var(--error)]"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      ) : (
        <Card className="bg-surface-lowest shadow-ambient border-0">
          <CardContent className="py-16">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-5">
                <span className="material-symbols-outlined text-on-surface-variant text-4xl">landscape</span>
              </div>
              <h3 className="text-headline text-on-surface mb-2">
                {searchTerm || filterCrop !== 'all' ? 'No se encontraron parcelas' : 'Sin parcelas registradas'}
              </h3>
              <p className="text-on-surface-variant mb-6">
                {searchTerm || filterCrop !== 'all'
                  ? 'Intenta con otros filtros de búsqueda'
                  : 'Comienza creando tu primera parcela en el mapa'}
              </p>
              {!searchTerm && filterCrop === 'all' && (
                <Button
                  onClick={() => navigate('map')}
                  className="bg-[var(--tertiary)] text-[var(--on-tertiary-fixed)] hover:bg-[var(--tertiary-fixed-dim)] h-12 px-6 rounded-xl font-semibold shadow-ambient hover:shadow-elevated transition-smooth border-0"
                >
                  <span className="material-symbols-outlined text-lg mr-2">add</span>
                  Crear Primera Parcela
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md border-0 shadow-elevated">
          <DialogHeader>
            <DialogTitle className="text-headline text-on-surface">Editar Parcela</DialogTitle>
            <DialogDescription className="text-on-surface-variant">Modifica los datos de tu parcela</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">Nombre</label>
              <Input
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="bg-surface-high border-0 h-11 rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">Tipo de Cultivo</label>
              <Select
                value={editData.cropType}
                onValueChange={(value) => setEditData({ ...editData, cropType: value as Parcel['cropType'] })}
              >
                <SelectTrigger className="bg-surface-high border-0 h-11 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="soya">Soya</SelectItem>
                  <SelectItem value="maiz">Maíz</SelectItem>
                  <SelectItem value="trigo">Trigo</SelectItem>
                  <SelectItem value="otros">Otros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">Estado del Suelo</label>
              <Select
                value={editData.soilStatus}
                onValueChange={(value) => setEditData({ ...editData, soilStatus: value as Parcel['soilStatus'] })}
              >
                <SelectTrigger className="bg-surface-high border-0 h-11 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="optimo">Óptimo</SelectItem>
                  <SelectItem value="alerta">Alerta</SelectItem>
                  <SelectItem value="critico">Crítico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowEditDialog(false)} className="bg-surface-high border-0">
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEdit}
              className="bg-[var(--tertiary)] text-[var(--on-tertiary-fixed)] hover:bg-[var(--tertiary-fixed-dim)] rounded-xl border-0"
            >
              Guardar Cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="border-0 shadow-elevated">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-headline text-on-surface">¿Eliminar parcela?</AlertDialogTitle>
            <AlertDialogDescription className="text-on-surface-variant">
              Esta acción no se puede deshacer. La parcela y todos sus datos serán eliminados permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-surface-high border-0">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-[var(--error)] hover:bg-[var(--error)]/90 border-0"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}