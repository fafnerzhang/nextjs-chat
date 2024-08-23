'use client'

import * as React from 'react'
import Textarea from 'react-textarea-autosize'
import { useActions, useUIState } from 'ai/rsc'
import { UserMessage } from './message'
import { type AI } from '@/lib/chat/actions'
import {
  IconNetwork,
  IconPlus,
  IconPencil,
  IconArrowElbow
} from '@/components/ui/icons'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { useEnterSubmit } from '@/lib/hooks/use-enter-submit'
import { nanoid } from 'nanoid'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { usePromptVariable } from '@/components/ui/prompt-variable'
import { useModel } from '@/lib/hooks/use-model'
import { checkPromptArgs } from '@/lib/utils'

export function PromptForm({
  input,
  setInput
}: {
  input: string
  setInput: (value: string) => void
}) {
  const router = useRouter()
  const { formRef, onKeyDown } = useEnterSubmit()
  const inputRef = React.useRef<HTMLTextAreaElement>(null)
  const { submitUserMessage, streamMultiSubmit } = useActions()
  const [_, setMessages] = useUIState<typeof AI>()
  const { promptVariables, setPromptVariables } = usePromptVariable()
  const { model, provider } = useModel()
  const [agentType, setAgentType] = React.useState('multiSubmit')
  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])
  return (
    <form
      ref={formRef}
      onSubmit={async (e: any) => {
        e.preventDefault()
        // Blur focus on mobile
        if (window.innerWidth < 600) {
          e.target['message']?.blur()
        }
        const value = input.trim()
        setInput('')
        if (!value) return
        // Optimistically add user message UI
        setMessages(currentMessages => [
          ...currentMessages,
          {
            id: nanoid(),
            display: <UserMessage>{value}</UserMessage>
          }
        ])

        // Submit and get response message
        let responseMessage = null
        if (agentType === 'multiSubmit') {
          responseMessage = await streamMultiSubmit(
            value,
            promptVariables,
            model,
            provider
          )
        }
        if (agentType === 'submitUserMessage') {
          responseMessage = await submitUserMessage(value, model, provider)
        }
        setMessages(currentMessages => [...currentMessages, responseMessage])
      }}
    >
      <div className="relative flex max-h-80 w-full grow flex-col overflow-hidden bg-background px-8 sm:rounded-md sm:border sm:px-12">
        <Button
          variant="outline"
          size="icon"
          type="button"
          className="absolute left-0 top-[14px] size-8 rounded-full bg-background p-0 sm:left-4"
          onClick={() => {
            if (agentType === 'multiSubmit') {
              setAgentType('submitUserMessage')
            } else {
              setAgentType('multiSubmit')
            }
          }}
        >
          {agentType === 'submitUserMessage' ? (
            <IconPencil />
          ) : agentType === 'multiSubmit' ? (
            <IconNetwork />
          ) : (
            <IconPlus />
          )}
        </Button>

        <Textarea
          ref={inputRef}
          tabIndex={0}
          onKeyDown={onKeyDown}
          placeholder="Send a message."
          className="min-h-[60px] w-full resize-none bg-transparent px-4 py-[1.3rem] focus-within:outline-none sm:text-sm"
          autoFocus
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          name="message"
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
          maxLength={1500}
        />
        <div className="absolute right-0 top-[13px] sm:right-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="submit"
                size="icon"
                disabled={
                  (input === '' && agentType === 'submitUserMessage') ||
                  (agentType === 'multiSubmit' &&
                    !(
                      promptVariables.length > 0 &&
                      checkPromptArgs(input, promptVariables[0])
                    ))
                }
              >
                <IconArrowElbow />
                <span className="sr-only">Send message</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Send message</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </form>
  )
}
