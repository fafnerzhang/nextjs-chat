import { clsx, type ClassValue } from 'clsx'
import { customAlphabet } from 'nanoid'
import { twMerge } from 'tailwind-merge'
import {openai} from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'
import { google, createGoogleGenerativeAI } from '@ai-sdk/google'
import { LanguageModel } from 'ai'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const nanoid = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  7
) // 7-character random string

export async function fetcher<JSON = any>(
  input: RequestInfo,
  init?: RequestInit
): Promise<JSON> {
  const res = await fetch(input, init)

  if (!res.ok) {
    const json = await res.json()
    if (json.error) {
      const error = new Error(json.error) as Error & {
        status: number
      }
      error.status = res.status
      throw error
    } else {
      throw new Error('An unexpected error occurred')
    }
  }

  return res.json()
}

export async function* streamingFetch(input: RequestInfo, init?: RequestInit): AsyncGenerator<string> {
  const response = await fetch(input, init)
  if (!response.body) {
    throw new Error("Response body is null");
  }
  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break

    try {
      yield decoder.decode(value)
    } catch (e: any) {
      console.warn(e.message)
    }
  }
}

export function formatDate(input: string | number | Date): string {
  const date = new Date(input)
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

export const formatNumber = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value)

export const runAsyncFnWithoutBlocking = (
  fn: (...args: any) => Promise<any>
) => {
  fn()
}

export const sleep = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms))

export const getStringFromBuffer = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

export enum ResultCode {
  InvalidCredentials = 'INVALID_CREDENTIALS',
  InvalidSubmission = 'INVALID_SUBMISSION',
  UserAlreadyExists = 'USER_ALREADY_EXISTS',
  UnknownError = 'UNKNOWN_ERROR',
  UserCreated = 'USER_CREATED',
  UserLoggedIn = 'USER_LOGGED_IN'
}

export const getMessageFromCode = (resultCode: string) => {
  switch (resultCode) {
    case ResultCode.InvalidCredentials:
      return 'Invalid credentials!'
    case ResultCode.InvalidSubmission:
      return 'Invalid submission, please try again!'
    case ResultCode.UserAlreadyExists:
      return 'User already exists, please log in!'
    case ResultCode.UserCreated:
      return 'User created, welcome!'
    case ResultCode.UnknownError:
      return 'Something went wrong, please try again!'
    case ResultCode.UserLoggedIn:
      return 'Logged in!'
  }
}

export function getModel(provider: string, model: string) : LanguageModel{
  switch (provider) {
    case 'openai':
      return openai(model)
    case 'anthropic':
      return anthropic(model) as LanguageModel
    case 'google':
      
      return google(model) as LanguageModel
    default:
      return openai(model)
  }
}

export function parsePromptArgs(prompt: string): string[] {
  const regex = /\{(\w+)\}/g; // Adjusted regex to match {var} pattern
  const matchesIterator = prompt.matchAll(regex);
  const matches = Array.from(matchesIterator); // Convert iterator to array directly
  const uniqueMatches = Array.from(new Set(matches.map(match => match[1])));
  return uniqueMatches;
}

export function replacePromptArgs(prompt: string, args: Record<string, string>): string {
  return prompt.replace(/\{(\w+)\}/g, (_, key) => args[key] || `{${key}}`);
} 

export function checkPromptArgs(prompt: string, args: Record<string, string>): boolean {
  const regex = /\{(\w+)\}/g;
  const matches = Array.from(prompt.matchAll(regex)); // Use Array.from to convert to array
  return matches.every(match => args[match[1]] !== undefined);
}