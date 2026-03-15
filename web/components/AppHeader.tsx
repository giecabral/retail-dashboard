'use client'

import { BarChart3, RefreshCw } from 'lucide-react'

export default function AppHeader() {
  return (
    <header className="bg-white text-gray-800 shadow-lg">
      <div className="h-1 bg-linear-to-r from-blue-500 via-cyan-400 to-blue-600" />
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-xl bg-blue-500/20 ring-1 ring-blue-400/40 p-2.5">
            <BarChart3 className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-wide leading-tight">
              Retail Analytics
            </h1>
            <p className="text-xs text-gray-600 leading-tight mt-0.5">
              Performance Dashboard
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
