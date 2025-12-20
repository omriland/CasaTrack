'use client'

import { useState } from 'react'
import { checkPassword, setAuthCookie } from '@/lib/auth'

interface LoginFormProps {
  onLogin: () => void
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (checkPassword(password)) {
      setAuthCookie()
      onLogin()
    } else {
      setError('Invalid password')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-white to-primary/10 px-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-lg mb-6 shadow-lg">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none">
              <path d="M3 11L12 4L21 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5 10.5V19a2 2 0 002 2h10a2 2 0 002-2v-8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="10" y="14" width="4" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">CasaTrack</h1>
          <p className="text-slate-600 font-medium">Your Home Purchasing Companion</p>
          <p className="text-slate-500 text-sm font-medium mt-1">Created by Omriland</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-xl border border-white/20 p-8 animate-fade-in">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-slate-900 placeholder-slate-400 shadow-sm"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  disabled={loading}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 animate-slide-in">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="w-full py-3 px-4 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-semibold rounded-lg hover:from-primary/90 hover:to-primary/80 focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span>Sign in</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              Secure access to your property management dashboard
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
