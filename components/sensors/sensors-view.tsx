'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/lib/app-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface SensorReading {
  id: string
  parcelId: string
  parcelName: string
  type: 'humidity' | 'temperature' | 'ph' | 'nitrogen'
  value: number
  unit: string
  status: 'optimo' | 'alerta' | 'critico'
  lastUpdate: Date
  history: number[]
}

const sensorConfig = {
  humidity: {
    label: 'Humedad',
    icon: 'water_drop',
    unit: '%',
    min: 0,
    max: 100,
    optimal: { min: 40, max: 70 },
    warning: { min: 30, max: 80 },
  },
  temperature: {
    label: 'Temperatura',
    icon: 'thermostat',
    unit: '°C',
    min: 0,
    max: 50,
    optimal: { min: 18, max: 28 },
    warning: { min: 12, max: 35 },
  },
  ph: {
    label: 'pH del Suelo',
    icon: 'science',
    unit: '',
    min: 0,
    max: 14,
    optimal: { min: 6, max: 7.5 },
    warning: { min: 5.5, max: 8 },
  },
  nitrogen: {
    label: 'Nitrógeno (N)',
    icon: 'eco',
    unit: 'ppm',
    min: 0,
    max: 200,
    optimal: { min: 80, max: 150 },
    warning: { min: 50, max: 180 },
  },
}

export function SensorsView() {
  const { state } = useApp()
  const [sensors, setSensors] = useState<SensorReading[]>([])
  const [selectedParcel, setSelectedParcel] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')

  // Initialize sensors for each parcel
  useEffect(() => {
    const initialSensors: SensorReading[] = []
    const parcels = state.parcels.length > 0 ? state.parcels : [
      { id: 'demo-1', name: 'Parcela Demo Norte' },
      { id: 'demo-2', name: 'Parcela Demo Sur' },
      { id: 'demo-3', name: 'Parcela Demo Este' },
    ]

    parcels.forEach((parcel) => {
      Object.keys(sensorConfig).forEach((type) => {
        const config = sensorConfig[type as keyof typeof sensorConfig]
        const baseValue = (config.optimal.min + config.optimal.max) / 2
        const history = Array.from({ length: 10 }, () => 
          baseValue + (Math.random() - 0.5) * (config.optimal.max - config.optimal.min)
        )
        
        initialSensors.push({
          id: `${parcel.id}-${type}`,
          parcelId: parcel.id,
          parcelName: parcel.name,
          type: type as SensorReading['type'],
          value: history[history.length - 1],
          unit: config.unit,
          status: 'optimo',
          lastUpdate: new Date(),
          history,
        })
      })
    })

    setSensors(initialSensors)
  }, [state.parcels])

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSensors((prev) =>
        prev.map((sensor) => {
          const config = sensorConfig[sensor.type]
          const variation = (Math.random() - 0.5) * ((config.optimal.max - config.optimal.min) * 0.2)
          let newValue = sensor.value + variation
          
          // Keep within bounds
          newValue = Math.max(config.min, Math.min(config.max, newValue))
          
          // Determine status
          let status: SensorReading['status'] = 'optimo'
          if (newValue < config.warning.min || newValue > config.warning.max) {
            status = 'critico'
          } else if (newValue < config.optimal.min || newValue > config.optimal.max) {
            status = 'alerta'
          }

          const newHistory = [...sensor.history.slice(1), newValue]

          return {
            ...sensor,
            value: newValue,
            status,
            lastUpdate: new Date(),
            history: newHistory,
          }
        })
      )
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  // Status styles following Design System
  const getStatusStyles = (status: SensorReading['status']) => {
    switch (status) {
      case 'optimo':
        return {
          chip: 'bg-[var(--tertiary-container)] text-[var(--tertiary)]',
          icon: 'bg-[var(--tertiary)]/10 text-[var(--tertiary)]',
          fill: 'bg-[var(--tertiary)]',
        }
      case 'alerta':
        return {
          chip: 'bg-warning-container text-[var(--warning)]',
          icon: 'bg-[var(--warning)]/10 text-[var(--warning)]',
          fill: 'bg-[var(--warning)]',
        }
      case 'critico':
        return {
          chip: 'bg-error-container text-[var(--error)]',
          icon: 'bg-[var(--error)]/10 text-[var(--error)]',
          fill: 'bg-[var(--error)]',
        }
    }
  }

  const filteredSensors = sensors.filter((sensor) => {
    const matchesParcel = selectedParcel === 'all' || sensor.parcelId === selectedParcel
    const matchesType = selectedType === 'all' || sensor.type === selectedType
    return matchesParcel && matchesType
  })

  const getOverallStats = () => {
    const optimo = sensors.filter((s) => s.status === 'optimo').length
    const alerta = sensors.filter((s) => s.status === 'alerta').length
    const critico = sensors.filter((s) => s.status === 'critico').length
    return { optimo, alerta, critico, total: sensors.length }
  }

  const stats = getOverallStats()

  const uniqueParcels = [...new Set(sensors.map((s) => ({ id: s.parcelId, name: s.parcelName })))]
    .filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i)

  // Simple sparkline component
  const Sparkline = ({ data, status }: { data: number[]; status: SensorReading['status'] }) => {
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1
    const styles = getStatusStyles(status)

    return (
      <div className="flex items-end gap-0.5 h-8">
        {data.map((value, i) => {
          const height = ((value - min) / range) * 100
          return (
            <div
              key={i}
              className={`flex-1 rounded-t ${styles.fill} transition-smooth`}
              style={{ height: `${Math.max(10, height)}%`, opacity: 0.3 + (i / data.length) * 0.7 }}
            />
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header - Editorial typography */}
      <header className="pt-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-on-surface-variant text-sm font-medium uppercase tracking-wider mb-2">
              Monitoreo IoT
            </p>
            <h1 className="text-display-md text-on-surface">Sensores</h1>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-[var(--success)] sensor-pulse" />
            <span className="text-on-surface-variant font-medium">Actualización en vivo</span>
          </div>
        </div>
      </header>

      {/* Stats Overview - Tonal layering */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-surface-lowest shadow-ambient border-0">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-surface-container flex items-center justify-center">
                <span className="material-symbols-outlined text-on-surface">sensors</span>
              </div>
              <div>
                <p className="text-display-md text-on-surface leading-none">{stats.total}</p>
                <p className="text-xs text-on-surface-variant font-medium mt-1">Total Sensores</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-surface-lowest shadow-ambient border-0">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-success-container flex items-center justify-center">
                <span className="material-symbols-outlined text-[var(--success)]">check_circle</span>
              </div>
              <div>
                <p className="text-display-md text-[var(--success)] leading-none">{stats.optimo}</p>
                <p className="text-xs text-on-surface-variant font-medium mt-1">Óptimos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-surface-lowest shadow-ambient border-0">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-warning-container flex items-center justify-center">
                <span className="material-symbols-outlined text-[var(--warning)]">warning</span>
              </div>
              <div>
                <p className="text-display-md text-[var(--warning)] leading-none">{stats.alerta}</p>
                <p className="text-xs text-on-surface-variant font-medium mt-1">En Alerta</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-surface-lowest shadow-ambient border-0">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-error-container flex items-center justify-center">
                <span className="material-symbols-outlined text-[var(--error)]">error</span>
              </div>
              <div>
                <p className="text-display-md text-[var(--error)] leading-none">{stats.critico}</p>
                <p className="text-xs text-on-surface-variant font-medium mt-1">Críticos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Filters - surface-high background inputs */}
      <Card className="bg-surface-lowest shadow-ambient border-0">
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row gap-4">
            <Select value={selectedParcel} onValueChange={setSelectedParcel}>
              <SelectTrigger className="w-full md:w-64 bg-surface-high border-0 h-11 rounded-lg">
                <SelectValue placeholder="Filtrar por parcela" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las parcelas</SelectItem>
                {uniqueParcels.map((parcel) => (
                  <SelectItem key={parcel.id} value={parcel.id}>
                    {parcel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full md:w-64 bg-surface-high border-0 h-11 rounded-lg">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los sensores</SelectItem>
                {Object.entries(sensorConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sensors Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredSensors.map((sensor) => {
          const config = sensorConfig[sensor.type]
          const styles = getStatusStyles(sensor.status)
          const normalizedValue = ((sensor.value - config.min) / (config.max - config.min)) * 100

          return (
            <Card
              key={sensor.id}
              className={`bg-surface-lowest shadow-ambient border-0 hover:shadow-elevated transition-smooth ${
                sensor.status === 'critico' ? 'sensor-pulse' : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${styles.icon} flex items-center justify-center`}>
                      <span className="material-symbols-outlined">{config.icon}</span>
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold text-on-surface">{config.label}</CardTitle>
                      <CardDescription className="text-xs truncate max-w-[120px]">
                        {sensor.parcelName}
                      </CardDescription>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-sm ${styles.chip}`}>
                    {sensor.status === 'optimo' ? 'OK' : sensor.status === 'alerta' ? 'ALERTA' : 'CRÍTICO'}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Value Display - Big Data typography */}
                  <div className="text-center py-2">
                    <p className={`text-display-lg ${styles.icon.split(' ')[1]}`}>
                      {sensor.value.toFixed(sensor.type === 'ph' ? 1 : 0)}
                      <span className="text-lg font-normal text-on-surface-variant ml-1">{config.unit}</span>
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-on-surface-variant">
                      <span>{config.min}{config.unit}</span>
                      <span>{config.max}{config.unit}</span>
                    </div>
                    <Progress 
                      value={normalizedValue} 
                      className="h-1.5 bg-surface-container"
                      indicatorClassName={styles.fill}
                    />
                    <p className="text-xs text-[var(--success)] font-medium">
                      Óptimo: {config.optimal.min}-{config.optimal.max}{config.unit}
                    </p>
                  </div>

                  {/* Sparkline */}
                  <div className="bg-surface-low rounded-lg p-3">
                    <p className="text-xs text-on-surface-variant mb-2">Historial (10 min)</p>
                    <Sparkline data={sensor.history} status={sensor.status} />
                  </div>

                  {/* Last Update */}
                  <div className="flex items-center justify-center gap-1 text-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    <span>{sensor.lastUpdate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </section>

      {/* NPK Summary Card */}
      <Card className="bg-surface-lowest shadow-ambient border-0">
        <CardHeader className="pb-4">
          <CardTitle className="text-headline text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--tertiary)]">science</span>
            Análisis NPK General
          </CardTitle>
          <CardDescription className="text-on-surface-variant mt-1">Niveles de nutrientes promedio en todas las parcelas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { label: 'Nitrógeno (N)', value: 85, optimal: '80-150 ppm', color: 'bg-[var(--secondary)]' },
              { label: 'Fósforo (P)', value: 62, optimal: '40-80 ppm', color: 'bg-[var(--warning)]' },
              { label: 'Potasio (K)', value: 130, optimal: '100-200 ppm', color: 'bg-[var(--tertiary)]' },
            ].map((nutrient) => (
              <div key={nutrient.label} className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-on-surface">{nutrient.label}</span>
                  <span className="text-display-md text-on-surface">{nutrient.value} <span className="text-sm font-normal text-on-surface-variant">ppm</span></span>
                </div>
                <Progress 
                  value={nutrient.value / 2} 
                  className="h-2.5 bg-surface-container"
                  indicatorClassName={nutrient.color}
                />
                <p className="text-xs text-on-surface-variant">Rango óptimo: {nutrient.optimal}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
