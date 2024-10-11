import { CoreMessage, CoreToolMessage, ToolContent } from 'ai'

// Here we define the Custom Tool Result for MultiSubmitMessage
export interface MultiSubmitContentProps {
  value: string
  args: Record<string, any>
}

interface CustomToolResultPart {
  type: 'tool-result';
  toolCallId: string;
  toolName: string;
  result: MultiSubmitContentProps[] | unknown;
  isError?: boolean;
  prompt?: string;
}


type CustomToolContent = Array<CustomToolResultPart>

interface CustomCoreToolMessage extends CoreToolMessage {
  id: string
  content: CustomToolContent
}

type MessageWithId = CoreMessage & {
  id: string
}

export type Message  =  CustomCoreToolMessage | MessageWithId

export interface Chat extends Record<string, any> {
  id: string
  title: string
  createdAt: Date
  userId: string
  path: string
  messages: Message[]
  sharePath?: string
}

export type ServerActionResult<Result> = Promise<
  | Result
  | {
      error: string
    }
>

export interface Session {
  user: {
    id: string
    email: string
  }
}

export interface AuthResult {
  type: string
  message: string
}

export interface User extends Record<string, any> {
  id: string
  email: string
  password: string
  salt: string
}

export interface Prompt extends Record<string, any> {
  promptId: string
  title: string
  prompt: string
  args: string[]
}

export type PromptVariables = Record<string, any>
