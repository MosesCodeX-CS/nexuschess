export interface User {
  id: string
  email: string
  username: string
  chesscomUsername?: string | null
  chesscomVerified: boolean
  rating: number
  createdAt: Date
  updatedAt: Date
}

export interface RegisterData {
  email: string
  username: string
  password: string
  chesscomUsername?: string
}

export interface LoginData {
  email: string
  password: string
}

export interface AuthResponse {
  success: boolean
  message?: string
  token?: string
  user?: Omit<User, 'password'>
}
