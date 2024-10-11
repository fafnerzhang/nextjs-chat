import { IconGemini, IconOpenAI, IconAnthropic } from '@/components/ui/icons'
import { ReactElement } from 'react'
export const BASE_URL = 'http://localhost:3000'
const modelOptions: {
  value: string
  provider: string
  display: ReactElement
}[] = [
  {
    value: 'gpt-3.5-turbo',
    provider: 'openai',
    display: (
      <div className="flex items-center p-1">
        <IconOpenAI />
        <p className="p-1 text-muted-foreground">gpt-3.5-turbo</p>
      </div>
    )
  },
  {
    value: 'gemini-1.5-flash',
    provider: 'google',
    display: (
      <div className="flex items-center p-1">
        <IconGemini />
        <p className="p-1 text-muted-foreground">gemini-1.5-flash</p>
      </div>
    )
  },
  {
    value: 'claude-1.5',
    provider: 'anthropic',
    display: (
      <div className="flex items-center p-1">
        <IconAnthropic />
        <p className="p-1 text-muted-foreground">claude-1.5</p>
      </div>
    )
  }
]
export { modelOptions }
