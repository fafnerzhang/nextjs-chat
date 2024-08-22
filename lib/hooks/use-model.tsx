'use client'

import * as React from 'react'

interface ModelContext {
  model: string
  provider: string
  setModel: (model: string) => void
  setProvider: (provider: string) => void
}

const ModelContext = React.createContext<ModelContext | undefined>(undefined)

export function useModel() {
  const context = React.useContext(ModelContext)
  if (!context) {
    throw new Error('useModel must be used within a ModelProvider')
  }
  return context
}

interface ModelProviderProps {
  children: React.ReactNode
}

export function ModelProvider({ children }: ModelProviderProps) {
  const [model, setModel] = React.useState('gpt-3.5-turbo')
  const [provider, setProvider] = React.useState('openai')

  return (
    <ModelContext.Provider
      value={{
        model,
        provider,
        setModel,
        setProvider
      }}
    >
      {children}
    </ModelContext.Provider>
  )
}
