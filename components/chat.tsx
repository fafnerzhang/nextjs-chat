'use client'

import { cn } from '@/lib/utils'
import { ChatList } from '@/components/chat-list'
import { ChatPanel } from '@/components/chat-panel'
import { EmptyScreen } from '@/components/empty-screen'
import { useLocalStorage } from '@/lib/hooks/use-local-storage'
import { useEffect, useState } from 'react'
import { useUIState, useAIState } from 'ai/rsc'
import { Message, Session } from '@/lib/types'
import { usePathname, useRouter } from 'next/navigation'
import { useScrollAnchor } from '@/lib/hooks/use-scroll-anchor'
import { toast } from 'sonner'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { MdCheck as CheckIcon } from 'react-icons/md' // Importing CheckIcon from react-icons
import { useRef } from 'react'
import {
  IconGemini,
  IconOpenAI,
  IconAnthropic,
  IconDownload,
  IconUpload,
  IconBookmark
} from '@/components/ui/icons'
import { modelOptions } from '@/lib/constants'
import { ChatPromptDialog } from './chat-prompt-dialog'
import { PromptAccordion } from './accordion'
import { Button } from './ui/button'
import { usePromptVariable } from './ui/prompt-variable'
import { getPromptsForUser } from '@/app/actions'
import { useModel } from '@/lib/hooks/use-model'

export interface ChatProps extends React.ComponentProps<'div'> {
  initialMessages?: Message[]
  id?: string
  session?: Session
  missingKeys: string[]
}

export function Chat({ id, className, session, missingKeys }: ChatProps) {
  const router = useRouter()
  const path = usePathname()
  const [input, setInput] = useState('')
  const [messages] = useUIState()
  const [aiState] = useAIState()
  const { model, provider, setModel, setProvider } = useModel()
  const [promptDialogOpen, setPromptDialogOpen] = useState(false)
  const [_, setNewChatId] = useLocalStorage('newChatId', id)
  const { setPromptVariables, prompts, setPrompts } = usePromptVariable()

  useEffect(() => {
    if (session?.user) {
      if (!path.includes('chat') && messages.length === 1) {
        window.history.replaceState({}, '', `/chat/${id}`)
      }
    }
  }, [id, path, session?.user, messages])

  useEffect(() => {
    const messagesLength = aiState.messages?.length
    if (messagesLength === 2) {
      router.refresh()
    }
  }, [aiState.messages, router])

  useEffect(() => {
    setNewChatId(id)
  })

  useEffect(() => {
    missingKeys.map(key => {
      toast.error(`Missing ${key} environment variable!`)
    })
  }, [missingKeys])

  const { messagesRef, scrollRef, visibilityRef, isAtBottom, scrollToBottom } =
    useScrollAnchor()

  function onModelChange(model: string) {
    setModel(model)
    const newProvider = modelOptions.find(
      option => option.value === model
    )?.provider
    if (newProvider) {
      setProvider(newProvider)
    }
  }

  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files
    if (files?.length && files.length > 0) {
      const formData = new FormData()
      formData.append('file', files[0]) // Assuming single file upload, adjust as needed

      try {
        const response = await fetch('/api/file', {
          method: 'POST',
          body: formData
          // Do not set Content-Type header for FormData
        })

        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`)
        }

        const result = await response.json()
        setPromptVariables(result)
        console.log('Prompt variables:', JSON.stringify(result))
      } catch (error) {
        console.error('Error uploading file:', error)
      }
    }
  }

  return (
    <div
      className="group w-full overflow-auto pl-0 peer-[[data-state=open]]:lg:pl-[250px] peer-[[data-state=open]]:xl:pl-[300px]"
      ref={scrollRef}
    >
      <div className="sticky top-0 flex w-full max-w-screen mx-auto bg-white z-50 bg-background dark:bg-zinc-900 overflow-auto">
        <div>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger className="hover:bg-white dark:bg-zinc-900 shadow-sm text-gray-700 focus:outline-none top-full">
              {modelOptions.find(option => option.value === model)?.display}
            </DropdownMenu.Trigger>
            <DropdownMenu.Content
              className="bg-white dark:bg-gray shadow-sm rounded-b-lg"
              align="start"
            >
              {modelOptions.map(option => (
                <DropdownMenu.Item
                  key={option.value}
                  className="flex items-center dark:bg-gray hover:bg-gray-100 hover:outline-none cursor-pointer"
                  onSelect={() => onModelChange(option.value)}
                >
                  <div className="flex items-center">
                    {option.display}
                    {model === option.value && (
                      <CheckIcon className="ml-auto size-5 text-gray-500" />
                    )}
                  </div>
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>
        <div className="grow"></div>
        <div className="flex content-center">
          <button
            onClick={async () => {
              if (prompts?.length === 0) {
                const fetchPrompts = await getPromptsForUser()
                setPrompts(fetchPrompts)
              }
              setPromptDialogOpen(!promptDialogOpen)
            }}
            className="rounded-m m-1 flex item-start transition-colors hover:bg-zinc-200/40 dark:hover:bg-zinc-300/10 pr-18 dark:bg-zinc-800 content-center"
          >
            <IconBookmark className="m-1" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.click() // Trigger file input click
              }
            }}
            className="rounded-m m-1 flex item-start transition-colors hover:bg-zinc-200/40 dark:hover:bg-zinc-300/10 pr-18 dark:bg-zinc-800 content-center"
          >
            <IconUpload className="m-1" />
          </button>
        </div>
      </div>
      <ChatPromptDialog
        onOpenChange={setPromptDialogOpen}
        setInput={setInput}
        open={promptDialogOpen}
      />
      <div
        className={cn('pb-[160px] pt-10 md:pt-10', className)}
        ref={messagesRef}
      >
        {messages.length ? (
          <ChatList messages={messages} isShared={false} session={session} />
        ) : (
          <EmptyScreen />
        )}
        <div className="w-full h-px" ref={visibilityRef} />
      </div>
      <ChatPanel
        id={id}
        input={input}
        setInput={setInput}
        isAtBottom={isAtBottom}
        scrollToBottom={scrollToBottom}
      />
    </div>
  )
}
