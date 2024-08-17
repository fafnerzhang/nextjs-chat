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
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { MdCheck as CheckIcon } from 'react-icons/md'; // Importing CheckIcon from react-icons
import {IconGemini, IconOpenAI} from '@/components/ui/icons'
export interface ChatProps extends React.ComponentProps<'div'> {
  initialMessages?: Message[]
  id?: string
  session?: Session
  missingKeys: string[]
}
const modelOptions = [
  {value: 'defaultModel', label: 'Default Model'},
  {value: 'advancedModel', label: 'Advanced Model'},
  ]
export function Chat({ id, className, session, missingKeys }: ChatProps) {
  const router = useRouter()
  const path = usePathname()
  const [input, setInput] = useState('')
  const [messages] = useUIState()
  const [aiState] = useAIState()
  const [selectedModel, setSelectedModel] = useState('defaultModel')

  const [_, setNewChatId] = useLocalStorage('newChatId', id)

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
    const onModelChange = (model) => {
      setSelectedModel(model);
    };
  return (
    <div
      className="group w-full overflow-auto pl-0 peer-[[data-state=open]]:lg:pl-[250px] peer-[[data-state=open]]:xl:pl-[300px]"
      ref={scrollRef}
    >
      <div className='fixed w-full z-50'>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger 
            className="bg-white border border-gray-300 rounded-md shadow-sm p-2 text-gray-700 focus:outline-none ml-1 top-full"
          >
            {modelOptions.find(option => option.value === selectedModel)?.label}
          </DropdownMenu.Trigger>
          <DropdownMenu.Content
            className="bg-white border border-gray-300 rounded-md shadow-sm p-2 ml-1 top-full "
            >
            {modelOptions.map((option) => (
              <DropdownMenu.Item
                key={option.value}
                className="flex items-center p-2 hover:bg-gray-100 hover:outline-none cursor-pointer"
                onSelect={() => onModelChange(option.value)}
              >
                <div className="flex items-center">
                <IconGemini/>
                {option.label}
                {selectedModel === option.value && (
                  <CheckIcon className="ml-auto h-5 w-5 text-gray-500" />
                )}
                </div>
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </div>
      
      <div
        className={cn('pb-[250px] pt-10 md:pt-10', className)}
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
