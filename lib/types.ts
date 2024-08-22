import { CoreMessage, ProviderMetadata, CoreToolMessage, ToolContent } from 'ai'

interface CustomToolResultPart {
  type: 'tool-result';
  /**
ID of the tool call that this result is associated with.
 */
  toolCallId: string;
  /**
Name of the tool that generated this result.
  */
  toolName: string;
  /**
Result of the tool call. This is a JSON-serializable object.
   */
  result: Object[] | unknown;
  /**
Optional flag if the result is an error or an error message.
   */
  isError?: boolean;
  /**
Additional provider-specific metadata. They are passed through
to the provider from the AI SDK and enable provider-specific
functionality that can be fully encapsulated in the provider.
 */
  experimental_providerMetadata?: ProviderMetadata;
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
