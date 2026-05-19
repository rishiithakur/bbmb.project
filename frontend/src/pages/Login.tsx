import React, { useState } from 'react'
import { User, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../features/auth/useAuth'

import { API_BASE } from '../api/client'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(username, password)
    } catch (err) {
      // Error handled by useAuth toast
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white/80 backdrop-blur-2xl rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col md:flex-row min-h-[460px] max-w-[800px] mx-auto border border-white/30">
      {/* Left Branding Panel - Modern Pro High-Contrast */}
      <div className="md:w-[42%] bg-gradient-to-br from-[#0B1425] via-[#102A52] to-[#163050] p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
        {/* Subtle Ambient Light */}
        <div className="absolute -top-20 -left-20 w-56 h-56 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 w-56 h-56 bg-cyan-500/10 rounded-full blur-3xl"></div>
        
        {/* Floating Logo */}
        <div className="relative mb-6 transform transition-transform hover:scale-105 duration-500">
          <img 
            src={`${API_BASE}/branding/logo/`}
            alt="BBMB Logo" 
            className="relative h-20 w-auto object-contain drop-shadow-xl"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/assets/logo.png'
            }}
          />
        </div>

        {/* Branding Typography */}
        <div className="relative z-10 space-y-3">
          <h1 className="text-white text-[20px] font-semibold leading-snug tracking-tight">
            BBMB Dam Water Level<br />Monitoring System
          </h1>
          <div className="h-[1px] w-10 bg-gradient-to-r from-transparent via-blue-400/40 to-transparent mx-auto"></div>
          <p className="text-blue-100/70 text-[12px] font-medium tracking-wide uppercase">
            Management Portal
          </p>
        </div>
      </div>

      {/* Right Login Section - Clean & High-Trust */}
      <div className="flex-1 p-8 md:p-12 flex flex-col justify-center bg-white/40 backdrop-blur-md">
        <div className="mb-8 text-left">
          <h2 className="text-[#0F172A] text-[24px] font-bold tracking-tight">Welcome Back</h2>
          <p className="text-slate-500 text-[13px] mt-1 font-medium">Please sign in to access the dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1">Username</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-slate-400 group-focus-within:text-[#123C73] transition-colors" />
              </div>
              <input
                type="text"
                required
                className="block w-full pl-11 pr-4 py-3 bg-white/70 border border-slate-200 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-[#123C73] transition-all outline-none font-medium placeholder:text-slate-300"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1">Password</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-[#123C73] transition-colors" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="block w-full pl-11 pr-12 py-3 bg-white/70 border border-slate-200 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-[#123C73] transition-all outline-none font-medium placeholder:text-slate-300"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 mt-2 py-3.5 px-6 bg-gradient-to-r from-[#123C73] to-[#1565C0] text-white rounded-xl font-bold text-sm shadow-[0_8px_20px_rgba(18,60,115,0.2)] hover:shadow-[0_12px_25px_rgba(18,60,115,0.3)] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Sign In to Portal</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
