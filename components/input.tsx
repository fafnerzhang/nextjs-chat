import React, { createContext, useContext, useState, ReactNode } from 'react'

// Define the shape of the context data for input
export interface InputContextType {
  input: string
  setInput: (value: string) => void
}

// Create the context with a default value of null
const InputContext = createContext<InputContextType | null>(null)

// Custom hook to use the InputContext
export const useInput = () => useContext(InputContext)

interface InputProviderProps {
  children: ReactNode
}

// Provider component to wrap around components that need access to this context
export const InputProvider: React.FC<InputProviderProps> = ({ children }) => {
  const [input, setInput] = useState<string>('')

  return (
    <InputContext.Provider value={{ input, setInput }}>
      {children}
    </InputContext.Provider>
  )
}
