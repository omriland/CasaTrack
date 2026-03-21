'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'
import { Modal } from '@/components/ui/Modal'

type ConfirmContextType = {
  confirm: (message: string, title?: string, confirmText?: string) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [config, setConfig] = useState<{
    message: string
    title?: string
    confirmText?: string
    resolve: (res: boolean) => void
  } | null>(null)

  const confirm = (message: string, title: string = 'Confirm Action', confirmText: string = 'Confirm'): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfig({ message, title, confirmText, resolve })
      setIsOpen(true)
    })
  }

  const handleConfirm = () => {
    if (config) config.resolve(true)
    setIsOpen(false)
  }

  const handleCancel = () => {
    if (config) config.resolve(false)
    setIsOpen(false)
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Modal 
        isOpen={isOpen} 
        onClose={handleCancel}
        title={config?.title || 'Confirm Action'}
        size="sm"
      >
        <div className="flex flex-col gap-6 pb-2">
          <p className="text-[16px] text-slate-700 font-medium">
            {config?.message}
          </p>
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={handleCancel}
              className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-5 py-2.5 rounded-xl font-semibold text-white bg-rose-500 hover:bg-rose-600 shadow-sm transition-colors"
            >
              {config?.confirmText || 'Confirm'}
            </button>
          </div>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const context = useContext(ConfirmContext)
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider')
  }
  return context.confirm
}
