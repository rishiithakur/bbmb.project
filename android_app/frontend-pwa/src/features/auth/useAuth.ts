import { useAuthStore } from '../../store/auth.store'
import { authApi } from '../../api/auth.api'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

export function useAuth() {
  const { setAuth, logout: clearAuth, user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  const login = async (username: string, password: string) => {
    try {
      const res = await authApi.login({ username, password })
      const { access, refresh, user } = res.data
      setAuth(user, access, refresh)
      toast.success(`Welcome, ${user.full_name}`)
      
      // Role-based redirect
      if (user.role === 'operator') {
        navigate('/operator')
      } else {
        navigate('/map')
      }
    } catch (err: any) {
      // Backend returns { error: '...' } on 401, not { detail: '...' }
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Login failed. Please check credentials.'
      toast.error(msg)
      throw err
    }
  }

  const logout = async () => {
    const refresh = useAuthStore.getState().refreshToken
    if (refresh) {
      try { await authApi.logout(refresh) } catch (_) {}
    }
    clearAuth()
    navigate('/login')
    toast.success('Logged out successfully')
  }

  return { login, logout, user, isAuthenticated }
}
