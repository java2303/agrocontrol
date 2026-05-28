'use client'

import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react'
import type { User, Parcel, Sensor, ViewType, AppState } from './types'

type Action =
  | { type: 'SET_VIEW'; payload: ViewType }
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_PARCELS'; payload: Parcel[] }
  | { type: 'SET_SENSORS'; payload: Sensor[] }
  | { type: 'LOAD_SESSION'; payload: { user: User } }

const initialState: AppState = {
  currentView: 'login',
  user: null,
  parcels: [],
  sensors: [],
  isAuthenticated: false,
}

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, currentView: action.payload }
    case 'LOGIN':
      return { 
        ...state, 
        user: action.payload, 
        isAuthenticated: true, 
        currentView: 'dashboard' 
      }
    case 'LOGOUT':
      return { ...initialState }
    case 'SET_PARCELS':
      return { ...state, parcels: action.payload }
    case 'SET_SENSORS':
      return { ...state, sensors: action.payload }
    case 'LOAD_SESSION':
      return { 
        ...state, 
        user: action.payload.user, 
        isAuthenticated: true,
        currentView: 'dashboard'
      }
    default:
      return state
  }
}

interface AppContextType {
  state: AppState
  dispatch: React.Dispatch<Action>
  navigate: (view: ViewType) => void
  login: (user: User) => void
  logout: () => void
  setParcels: (parcels: Parcel[]) => void
  setSensors: (sensors: Sensor[]) => void
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // 🔐 Recuperar Sesión: Al arrancar, buscamos solo el Token/Usuario
  useEffect(() => {
    const savedUser = localStorage.getItem('agro-control-user')
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser)
        dispatch({ type: 'LOAD_SESSION', payload: { user } })
      } catch (e) {
        localStorage.removeItem('agro-control-user')
      }
    }
  }, [])

  // 💾 Persistencia Selectiva: Solo guardamos la sesión del usuario/token
  useEffect(() => {
    if (state.isAuthenticated && state.user) {
      localStorage.setItem('agro-control-user', JSON.stringify(state.user))
    }
  }, [state.isAuthenticated, state.user])

  const navigate = (view: ViewType) => dispatch({ type: 'SET_VIEW', payload: view })
  const login = (user: User) => dispatch({ type: 'LOGIN', payload: user })
  
  const logout = () => {
    localStorage.removeItem('agro-control-user')
    dispatch({ type: 'LOGOUT' })
  }

  const setParcels = (parcels: Parcel[]) => dispatch({ type: 'SET_PARCELS', payload: parcels })
  const setSensors = (sensors: Sensor[]) => dispatch({ type: 'SET_SENSORS', payload: sensors })

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        navigate,
        login,
        logout,
        setParcels,
        setSensors,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within an AppProvider')
  return context
}