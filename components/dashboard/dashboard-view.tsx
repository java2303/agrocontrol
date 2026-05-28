'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/lib/app-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface SensorMetric {
  label: string
  value: number
  unit: string
  icon: string
  status: 'optimo' | 'alerta' | 'critico'
}

export function DashboardView() {
  const { state, navigate } = useApp()
  const [metrics, setMetrics] = useState<SensorMetric[]>([
    { label: 'Humedad del Suelo', value: 68, unit: '%', icon: 'water_drop', status: 'optimo' },
    { label: 'Temperatura', value: 24, unit: '°C', icon: 'thermostat', status: 'optimo' },
    { label: 'Índice de Salud', value: 85, unit: '%', icon: 'local_florist', status: 'optimo' },
    { label: 'Estado Sistema', value: 100, unit: '%', icon: 'memory', status: 'optimo' },
  ])

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) =>
        prev.map((metric) => {
          const variation = (Math.random() - 0.5) * 4
          let newValue = Math.max(0, Math.min(100, metric.value + variation))
          
          if (metric.label === 'Temperatura') {
            newValue = Math.max(15, Math.min(35, metric.value + (Math.random() - 0.5) * 2))
          }

          let status: 'optimo' | 'alerta' | 'critico' = 'optimo'
          if (metric.label === 'Humedad del Suelo') {
            if (newValue < 30 || newValue > 80) status = 'critico'
            else if (newValue < 40 || newValue > 70) status = 'alerta'
          } else if (metric.label === 'Temperatura') {
            if (newValue < 10 || newValue > 35) status = 'critico'
            else if (newValue < 15 || newValue > 30) status = 'alerta'
          } else {
            if (newValue < 50) status = 'critico'
            else if (newValue < 70) status = 'alerta'
          }

          return { ...metric, value: Math.round(newValue * 10) / 10, status }
        })
      )
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  // Status colors following Design System - tertiary for active/good, error for critical
  const getStatusStyles = (status: 'optimo' | 'alerta' | 'critico') => {
    switch (status) {
      case 'optimo':
        return {
          chip: 'bg-[var(--tertiary-container)] text-[var(--tertiary)]',
          icon: 'text-[var(--tertiary)] bg-[var(--tertiary)]/10',
          fill: 'bg-[var(--tertiary)]',
        }
      case 'alerta':
        return {
          chip: 'bg-warning-container text-[var(--warning)]',
          icon: 'text-[var(--warning)] bg-[var(--warning)]/10',
          fill: 'bg-[var(--warning)]',
        }
      case 'critico':
        return {
          chip: 'bg-error-container text-[var(--error)]',
          icon: 'text-[var(--error)] bg-[var(--error)]/10',
          fill: 'bg-[var(--error)]',
        }
    }
  }

  const recommendations = [
    { text: 'Riego programado para parcela norte en 2 horas', icon: 'water', priority: 'info' },
    { text: 'Niveles de nitrógeno óptimos en todas las parcelas', icon: 'check_circle', priority: 'success' },
    { text: 'Considere fertilización en parcela sur esta semana', icon: 'info', priority: 'warning' },
  ]

  return (
    <div className="space-y-8">
      {/* Header - Editorial typography with asymmetry */}
      <header className="pt-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="text-on-surface-variant text-sm font-medium uppercase tracking-wider mb-2">
              Panel de Control
            </p>
            <h1 className="text-display-md text-on-surface">
              Bienvenido, {state.user?.name?.split(' ')[0] || 'Usuario'}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-base">schedule</span>
            <span>Última actualización: {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </header>

      {/* Metrics Cards - Tonal layering, no borders */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {metrics.map((metric) => {
          const styles = getStatusStyles(metric.status)
          return (
            <Card 
              key={metric.label} 
              className="bg-surface-lowest shadow-ambient border-0 hover:shadow-elevated transition-smooth"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-5">
                  <div className={`p-3 rounded-lg ${styles.icon} ${metric.status === 'optimo' ? 'sensor-pulse' : ''}`}>
                    <span className="material-symbols-outlined text-2xl">{metric.icon}</span>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-sm ${styles.chip}`}>
                    {metric.status === 'optimo' ? 'Óptimo' : metric.status === 'alerta' ? 'Alerta' : 'Crítico'}
                  </span>
                </div>
                <p className="text-on-surface-variant text-sm font-medium">{metric.label}</p>
                {/* Display typography for big data */}
                <p className="text-display-md text-on-surface mt-1">
                  {metric.value}
                  <span className="text-lg font-normal text-on-surface-variant ml-1">{metric.unit}</span>
                </p>
                <div className="mt-5">
                  <Progress 
                    value={metric.label === 'Temperatura' ? ((metric.value - 10) / 30) * 100 : metric.value} 
                    className="h-1.5 bg-surface-container"
                    indicatorClassName={styles.fill}
                  />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </section>

      {/* Main Content Grid - Generous spacing (spacing-8) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Parcels Overview - Surface layering */}
        <Card className="lg:col-span-2 bg-surface-lowest shadow-ambient border-0">
          <CardHeader className="pb-5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-headline text-on-surface">Parcelas Registradas</CardTitle>
                <CardDescription className="text-on-surface-variant mt-1">Estado actual de tus cultivos</CardDescription>
              </div>
              <button
                onClick={() => navigate('parcels')}
                className="text-[var(--tertiary)] hover:text-[var(--tertiary-fixed-dim)] font-medium text-sm flex items-center gap-1 transition-smooth"
              >
                Ver todas
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {state.parcels.length > 0 ? (
              <div className="space-y-3">
                {state.parcels.slice(0, 4).map((parcel) => {
                  const styles = getStatusStyles(parcel.soilStatus)
                  return (
                    <div
                      key={parcel.id}
                      className="flex items-center gap-4 p-4 rounded-lg bg-surface-low hover:bg-surface-container transition-smooth"
                    >
                      <div className="w-12 h-12 rounded-lg bg-[var(--tertiary)]/12 flex items-center justify-center">
                        <span className="material-symbols-outlined text-on-surface">grass</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-on-surface truncate">{parcel.name}</p>
                        <p className="text-sm text-on-surface-variant capitalize">
                          {parcel.cropType} - {parcel.area.toFixed(2)} ha
                        </p>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-sm ${styles.chip}`}>
                        {parcel.soilStatus === 'optimo' ? 'Óptimo' : parcel.soilStatus === 'alerta' ? 'Alerta' : 'Crítico'}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-5">
                  <span className="material-symbols-outlined text-on-surface-variant text-3xl">landscape</span>
                </div>
                <p className="text-on-surface-variant mb-5">No tienes parcelas registradas</p>
                <button
                  onClick={() => navigate('map')}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-[var(--tertiary)] text-[var(--on-tertiary-fixed)] rounded-xl font-semibold hover:bg-[var(--tertiary-fixed-dim)] transition-smooth shadow-ambient"
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                  Crear primera parcela
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Recommendations */}
        <Card className="bg-surface-lowest shadow-ambient border-0">
          <CardHeader className="pb-5">
            <CardTitle className="text-headline text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--tertiary)]">psychology</span>
              Recomendaciones AI
            </CardTitle>
            <CardDescription className="text-on-surface-variant mt-1">Sugerencias inteligentes para tu cultivo</CardDescription>
          </CardHeader>
          <CardContent>
            {/* No dividers - use spacing */}
            <div className="space-y-4">
              {recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 p-4 rounded-lg ${
                    rec.priority === 'success'
                      ? 'bg-success-container'
                      : rec.priority === 'warning'
                      ? 'bg-warning-container'
                      : 'bg-surface-low'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-lg mt-0.5 ${
                      rec.priority === 'success'
                        ? 'text-[var(--success)]'
                        : rec.priority === 'warning'
                        ? 'text-[var(--warning)]'
                        : 'text-[var(--secondary)]'
                    }`}
                  >
                    {rec.icon}
                  </span>
                  <p className="text-sm text-on-surface leading-relaxed">{rec.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Active Sensors Summary */}
      <section>
        <Card className="bg-surface-lowest shadow-ambient border-0">
          <CardHeader className="pb-5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-headline text-on-surface">Sensores Activos</CardTitle>
                <CardDescription className="text-on-surface-variant mt-1">Monitoreo IoT en tiempo real</CardDescription>
              </div>
              <button
                onClick={() => navigate('sensors')}
                className="text-[var(--tertiary)] hover:text-[var(--tertiary-fixed-dim)] font-medium text-sm flex items-center gap-1 transition-smooth"
              >
                Ver detalles
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {[
                { label: 'Humedad', icon: 'water_drop', count: state.parcels.length || 4, status: 'online' },
                { label: 'Temperatura', icon: 'thermostat', count: state.parcels.length || 4, status: 'online' },
                { label: 'pH Suelo', icon: 'science', count: state.parcels.length || 3, status: 'online' },
                { label: 'Nitrógeno', icon: 'eco', count: state.parcels.length || 2, status: 'warning' },
              ].map((sensor) => (
                <div key={sensor.label} className="flex items-center gap-3 p-4 rounded-lg bg-surface-low">
                  <div className="relative">
                    <div className="w-11 h-11 rounded-lg bg-[var(--tertiary)]/12 flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-surface">{sensor.icon}</span>
                    </div>
                    <span
                      className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                        sensor.status === 'online' ? 'bg-[var(--success)]' : 'bg-[var(--warning)]'
                      } sensor-pulse`}
                      style={{ boxShadow: '0 0 0 2px var(--surface-container-lowest)' }}
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-on-surface text-sm">{sensor.label}</p>
                    <p className="text-xs text-on-surface-variant">{sensor.count} activos</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
