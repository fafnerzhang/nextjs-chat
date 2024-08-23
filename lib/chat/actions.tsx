import 'server-only'

import {
  createAI,
  createStreamableUI,
  getMutableAIState,
  getAIState,
  streamUI,
  createStreamableValue
} from 'ai/rsc'
import {
  spinner,
  BotCard,
  BotMessage,
  SystemMessage,
  Stock,
  Purchase
} from '@/components/stocks'

import { z } from 'zod'
import { Events } from '@/components/stocks/events'
import { StocksSkeleton } from '@/components/stocks/stocks-skeleton'
import { Stocks } from '@/components/stocks/stocks'
import {
  formatNumber,
  runAsyncFnWithoutBlocking,
  sleep,
  nanoid
} from '@/lib/utils'
import { saveChat } from '@/app/actions'
import {
  SpinnerMessage,
  UserMessage,
  MultiSubmitMessage
} from '@/components/message'
import { Chat, Message } from '@/lib/types'
import { auth } from '@/auth'
import { streamingFetch, getModel } from '@/lib/utils'
import { replacePromptArgs } from '@/lib/utils'
import { openai } from '@ai-sdk/openai'
import { MultiSubmitContentProps } from '@/lib/types'

async function streamMultiSubmit(
  prompt: string,
  variables: Record<string, any>[],
  model: string = 'gpt-3.5-turbo',
  provider: string = 'openai'
) {
  'use server'

  const aiState = getMutableAIState<typeof AI>()
  aiState.update({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages,
      {
        id: nanoid(),
        role: 'user',
        content: prompt
      }
    ]
  })
  const multiSubmit = createStreamableUI(<SpinnerMessage />)
  runAsyncFnWithoutBlocking(async () => {
    let prompts = []
    for (let i = 0; i < variables.length; i++) {
      let formattedString = replacePromptArgs(prompt, variables[i])
      prompts.push({ body: formattedString, args: variables[i] })
    }
    console.log(`Prompts in action: ${prompts}`)

    const it = streamingFetch('http://localhost:3000/api/chat', {
      body: JSON.stringify({
        prompts: prompts,
        model: model,
        provider: provider
      }),
      method: 'POST'
    })
    const result = []
    for await (let value of it) {
      console.log(value)
      const item = JSON.parse(value) as MultiSubmitContentProps
      result.push(item)
      multiSubmit.update(
        <MultiSubmitMessage contents={result} prompt={prompt} />
      )
    }
    multiSubmit.done(<MultiSubmitMessage contents={result} prompt={prompt} />)
    const toolCallId = nanoid()

    aiState.done({
      ...aiState.get(),
      messages: [
        ...aiState.get().messages,
        {
          id: nanoid(),
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolName: 'multiSubmit',
              toolCallId,
              args: { prompt, variables }
            }
          ]
        },
        {
          id: nanoid(),
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolName: 'multiSubmit',
              toolCallId,
              result: result,
              prompt: prompt
            }
          ]
        }
      ]
    })
  })

  return {
    id: nanoid(),
    display: multiSubmit.value
  }
}

async function submitUserMessage(
  content: string,
  model: string = 'gpt-3.5-turbo',
  provider: string = 'openai'
) {
  'use server'
  const aiState = getMutableAIState<typeof AI>()
  aiState.update({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages,
      {
        id: nanoid(),
        role: 'user',
        content
      }
    ]
  })

  let textStream: undefined | ReturnType<typeof createStreamableValue<string>>
  let textNode: undefined | React.ReactNode
  const Model = getModel(provider, model)
  const result = await streamUI({
    model: Model,
    initial: <SpinnerMessage />,
    system: `\
    You are an expert marketing assistant, skilled in crafting concise and impactful marketing content.
    Your task is to help marketing professionals create short, engaging, and persuasive copy that resonates with their target audience.
    Focus on clear messaging, strong calls to action, and emotional appeal, while maintaining brand voice and consistency.
    there is no available tool for this task.`,
    messages: [
      ...aiState.get().messages.map((message: any) => ({
        role: message.role,
        content: message.content,
        name: message.name
      }))
    ],
    text: ({ content, done, delta }) => {
      if (!textStream) {
        textStream = createStreamableValue('')
        textNode = <BotMessage content={textStream.value} />
      }

      if (done) {
        textStream.done()
        aiState.done({
          ...aiState.get(),
          messages: [
            ...aiState.get().messages,
            {
              id: nanoid(),
              role: 'assistant',
              content
            }
          ]
        })
      } else {
        textStream.update(delta)
      }
      return textNode
    }
  })

  return {
    id: nanoid(),
    display: result.value
  }
}

export type AIState = {
  chatId: string
  messages: Message[]
}

export type UIState = {
  id: string
  display: React.ReactNode
}[]

export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage,
    streamMultiSubmit
  },
  initialUIState: [],
  initialAIState: { chatId: nanoid(), messages: [] },
  onGetUIState: async () => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const aiState = getAIState() as Chat

      if (aiState) {
        const uiState = getUIStateFromAIState(aiState)
        return uiState
      }
    } else {
      return
    }
  },
  onSetAIState: async ({ state }) => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const { chatId, messages } = state

      const createdAt = new Date()
      const userId = session.user.id as string
      const path = `/chat/${chatId}`

      const firstMessageContent = messages[0].content as string
      const title = firstMessageContent.substring(0, 100)

      const chat: Chat = {
        id: chatId,
        title,
        userId,
        createdAt,
        messages,
        path
      }

      await saveChat(chat)
    } else {
      return
    }
  }
})

export const getUIStateFromAIState = (aiState: Chat) => {
  return aiState.messages
    .filter(
      message =>
        message.role !== 'system' &&
        !(message.role === 'assistant' && typeof message.content !== 'string')
    )
    .map((message, index) => ({
      id: `${aiState.chatId}-${index}`,
      display:
        message.role === 'tool' ? (
          message.content.map(tool => {
            return tool.toolName === 'multiSubmit' &&
              Array.isArray(tool.result) &&
              'prompt' in tool ? (
              <MultiSubmitMessage
                key={tool.toolCallId}
                contents={tool.result}
                prompt={tool.prompt}
              />
            ) : null
          })
        ) : message.role === 'user' ? (
          <UserMessage>{message.content as string}</UserMessage>
        ) : message.role === 'assistant' &&
          typeof message.content === 'string' ? (
          <BotMessage content={message.content} />
        ) : null
    }))
}
