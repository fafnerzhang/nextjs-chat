'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { ThemeProviderProps } from 'next-themes/dist/types'
import { SidebarProvider } from '@/lib/hooks/use-sidebar'
import { ModelProvider } from '@/lib/hooks/use-model'
import { TooltipProvider } from '@/components/ui/tooltip'
import { PromptVariableProvider } from '@/components/ui/prompt-variable'

export function Providers({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <ModelProvider>
        <PromptVariableProvider>
          <SidebarProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </SidebarProvider>
        </PromptVariableProvider>
      </ModelProvider>
    </NextThemesProvider>
  )
}
