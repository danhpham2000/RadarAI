"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { fetchCurrentUser, loginUser, registerUser } from "@/lib/api"
import type { AuthRequest, AuthResponse, AuthUser } from "@/lib/types"

const STORAGE_KEY = "radarai-auth"

interface StoredSession {
  token: string
  user: AuthUser
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  ready: boolean
  isAuthenticated: boolean
  register: (payload: AuthRequest) => Promise<AuthResponse>
  login: (payload: AuthRequest) => Promise<AuthResponse>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      setReady(true)
      return
    }

    try {
      const stored = JSON.parse(raw) as StoredSession
      setUser(stored.user)
      setToken(stored.token)

      void (async () => {
        try {
          const freshUser = await fetchCurrentUser(stored.token)
          persistSession(stored.token, freshUser)
          setUser(freshUser)
          setToken(stored.token)
        } catch {
          clearSession()
          setUser(null)
          setToken(null)
        } finally {
          setReady(true)
        }
      })()
    } catch {
      clearSession()
      setReady(true)
    }
  }, [])

  async function register(payload: AuthRequest): Promise<AuthResponse> {
    const response = await registerUser(payload)
    if (response.accessToken) {
      persistSession(response.accessToken, response.user)
      setUser(response.user)
      setToken(response.accessToken)
    }
    return response
  }

  async function login(payload: AuthRequest): Promise<AuthResponse> {
    const response = await loginUser(payload)
    if (!response.accessToken) {
      throw new Error("A valid session was not returned for this account.")
    }
    persistSession(response.accessToken, response.user)
    setUser(response.user)
    setToken(response.accessToken)
    return response
  }

  function logout() {
    clearSession()
    setUser(null)
    setToken(null)
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      ready,
      isAuthenticated: Boolean(user && token),
      register,
      login,
      logout,
    }),
    [ready, token, user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.")
  }
  return context
}

function persistSession(token: string, user: AuthUser) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user } satisfies StoredSession))
}

function clearSession() {
  window.localStorage.removeItem(STORAGE_KEY)
}
