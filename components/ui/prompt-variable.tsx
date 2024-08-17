import React, { createContext, useState, useContext } from 'react';

// Step 1: Create the Context
type PromptVariable = Array<object>;

interface PromptVariableContextType {
    promptVariables: PromptVariable;
    setPromptVariables: React.Dispatch<React.SetStateAction<PromptVariable>>;
}

// Correctly initializing the context with a default value that matches the expected type
const PromptVariableContext = createContext<PromptVariableContextType | undefined>(undefined);

export function usePromptVariable() {
    const context = useContext(PromptVariableContext);
    if (!context) {
        throw new Error('usePromptVariable must be used within a PromptVariableProvider');
    }
    return context;
}

interface PromptVariableProviderProps {
    children: React.ReactNode;
}

export function PromptVariableProvider({ children }: PromptVariableProviderProps) {
    const [promptVariables, setPromptVariable] = useState<PromptVariable>([]);
    const setPromptVariables = (variable: PromptVariable) => {
        setPromptVariable(variable);
    }
    return (
        <PromptVariableContext.Provider 
        value={{ promptVariables, setPromptVariables }}
        >
            {children}
        </PromptVariableContext.Provider>
    );
}