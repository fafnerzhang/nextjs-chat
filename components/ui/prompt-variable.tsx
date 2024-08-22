import React, { createContext, useState, useContext } from 'react'
import { Prompt } from '@/lib/types'
// Step 1: Create the Context
type PromptVariable = Array<object>

interface PromptVariableContextType {
  promptVariables: PromptVariable
  prompts: Prompt[]
  selectedPromptId: string
  setSelectedPromptId: (promptId: string) => void // Complete the function type
  setPrompts: (
    prompts: Prompt[] | ((prevPrompts: Prompt[]) => Prompt[])
  ) => void // Accept a function for prevState
  setPromptVariables: (variable: PromptVariable) => void
}

// Correctly initializing the context with a default value that matches the expected type
const PromptVariableContext = createContext<
  PromptVariableContextType | undefined
>(undefined)

export function usePromptVariable() {
  const context = useContext(PromptVariableContext)
  if (!context) {
    throw new Error(
      'usePromptVariable must be used within a PromptVariableProvider'
    )
  }
  return context
}

interface PromptVariableProviderProps {
  children: React.ReactNode
}

export function PromptVariableProvider({
  children
}: PromptVariableProviderProps) {
  const [promptVariables, setPromptVariable] = useState<PromptVariable>([])
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [selectedPromptId, setSelectedPromptId] = useState<string>('')
  const setPromptVariables = (variable: PromptVariable) => {
    setPromptVariable(variable)
  }
  // const setPrompts = (prompts: Prompt[]): void => {
  //   setPromptsRaw(prompts)
  // }
  // const setSelectedPromptId = (promptId: string) => {
  //   setSelectedPromptIdRaw(promptId)
  // }

  return (
    <PromptVariableContext.Provider
      value={{
        promptVariables,
        setPromptVariables,
        prompts,
        setPrompts,
        selectedPromptId,
        setSelectedPromptId
      }}
    >
      {children}
    </PromptVariableContext.Provider>
  )
}
