export interface User {
  id: string
  name: string
  email: string
  ci_nit: string
  phone?: string
  userType: 'agronomo' | 'productor'
  token: string
}

export interface Parcel {
  id: string
  name: string
  cropType: 'soya' | 'maiz' | 'trigo' | 'otros'
  area: number // Máximo 50 ha. según requerimiento del CIAT[cite: 1]
  // ... resto de propiedades
}

// Actualicemos los tipos para reflejar el hardware real[cite: 1]
export type SensorReadingType = 
  | 'nitrogen' | 'phosphorus' | 'potassium' 
  | 'ph' | 'humidity' | 'temperature' | 'conductivity'

export interface Sensor {
  id: string
  parcelId: string
  type: SensorReadingType
  value: number
  status: 'optimo' | 'alerta' | 'critico'
  lastUpdate: string
}

export interface SensorData {
  humidity: number
  temperature: number
  ph: number
  nitrogen: number
}

export interface MapPoint {
  lat: number
  lng: number
}

export type ViewType = 'login' | 'register' | 'dashboard' | 'map' | 'parcels' | 'sensors' | 'settings'

export interface AppState {
  currentView: ViewType
  user: User | null
  parcels: Parcel[]
  sensors: Sensor[]
  isAuthenticated: boolean
}
