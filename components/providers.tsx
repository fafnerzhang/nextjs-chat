'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { ThemeProviderProps } from 'next-themes/dist/types'
import { SidebarProvider } from '@/lib/hooks/use-sidebar'
import { ModelProvider } from '@/lib/hooks/use-model'
import { TooltipProvider } from '@/components/ui/tooltip'
import { PromptVariableProvider } from '@/components/ui/prompt-variable'
import { SheetsProvider } from '@/components/table/sheet'
import { InputProvider } from '@/components/input'
export function Providers({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <InputProvider>
        <ModelProvider>
          <SheetsProvider>
            <PromptVariableProvider>
              <SidebarProvider>
                <TooltipProvider>{children}</TooltipProvider>
              </SidebarProvider>
            </PromptVariableProvider>
          </SheetsProvider>
        </ModelProvider>
      </InputProvider>
    </NextThemesProvider>
  )
}
