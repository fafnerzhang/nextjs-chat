'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
// import { kv } from '@vercel/kv'
import {Message} from '@/lib/types'
import { auth } from '@/auth'
import { type Chat, type Prompt, type PromptVariables } from '@/lib/types'
import Redis from 'ioredis'

const kv = new Redis({host: process.env.REDIS_HOST, port: process.env.REDIS_PORT})


export async function getChats(userId?: string | null) {
  const session = await auth()
  console.log(`userId`, userId)
  if (!userId) {
    return []
  }

  if (userId !== session?.user?.id) {
    return {
      error: 'Unauthorized'
    }
  }

  try {
    const pipeline = kv.pipeline();
    const chats: string[] = await kv.zrevrange(`user:chat:${userId}`, 0, -1);
    chats.forEach(chat => pipeline.hgetall(chat));

    const results = await pipeline.exec()
    if (!results) {
      return []
    }
    const chatsResult: Chat[] = results.map((result) => {
      const chat: Chat = result as any;
      chat.messages = JSON.parse(chat[1].messages) as Message[]
      return chat[1]
    })
    return chatsResult as Chat[]
  } catch (error) {
    console.log(`error`, error)
    return []
  }
}

export async function getChat(id: string, userId: string) {
  const session = await auth()

  if (userId !== session?.user?.id) {
    return {
      error: 'Unauthorized'
    }
  }

  let chat = await kv.hgetall(`chat:${id}`)

  if (!chat || (userId && chat.userId !== userId)) {
    return null
  }
  const res = {...chat, messages: JSON.parse(chat.messages) as Message[]}
  return res
}

export async function removeChat({ id, path }: { id: string; path: string }) {
  const session = await auth()

  if (!session) {
    return {
      error: 'Unauthorized'
    }
  }

  // Convert uid to string for consistent comparison with session.user.id
  const uid = String(await kv.hget(`chat:${id}`, 'userId'))

  if (uid !== session?.user?.id) {
    return {
      error: 'Unauthorized'
    }
  }

  await kv.del(`chat:${id}`)
  await kv.zrem(`user:chat:${session.user.id}`, `chat:${id}`)

  revalidatePath('/')
  return revalidatePath(path)
}

export async function clearChats() {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      error: 'Unauthorized'
    }
  }

  const chats: string[] = await kv.zrange(`user:chat:${session.user.id}`, 0, -1)
  if (!chats.length) {
    return redirect('/')
  }
  const pipeline = kv.pipeline()

  for (const chat of chats) {
    pipeline.del(chat)
    pipeline.zrem(`user:chat:${session.user.id}`, chat)
  }

  await pipeline.exec()

  revalidatePath('/')
  return redirect('/')
}

export async function getSharedChat(id: string) {
  const chat = await kv.hgetall(`chat:${id}`)

  if (!chat || !chat.sharePath) {
    return null
  }

  return chat
}

export async function shareChat(id: string) {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      error: 'Unauthorized'
    }
  }

  const chat = await kv.hgetall(`chat:${id}`)

  if (!chat || chat.userId !== session.user.id) {
    return {
      error: 'Something went wrong'
    }
  }

  const payload = {
    ...chat,
    sharePath: `/share/${chat.id}`
  }

  await kv.hmset(`chat:${chat.id}`, payload)

  return payload
}

export async function saveChat(chat: Chat) {
  const session = await auth()

  if (session && session.user) {
    const pipeline = kv.pipeline()
    const redisChat = {...chat, messages: JSON.stringify(chat.messages)}
    pipeline.hmset(`chat:${chat.id}`, redisChat)
    pipeline.zadd(`user:chat:${chat.userId}`, Date.now().toString(), `chat:${chat.id}`)
    console.log(`saved chatID ${chat.id}`)
    const res = await pipeline.exec()
  } else {
    return
  }
}

export async function refreshHistory(path: string) {
  redirect(path)
}

export async function getMissingKeys() {
  const keysRequired = ['OPENAI_API_KEY']
  return keysRequired
    .map(key => (process.env[key] ? '' : key))
    .filter(key => key !== '')
}

export async function savePromptForUser(prompt: Prompt) {
  const session = await auth();

  if (session && session.user && session.user.id) {
    const userPromptKey = `user-prompt:${prompt.promptId}`; // Unique key for each user
    const pipeline = kv.pipeline();
    const promptRedis = {...prompt, args: JSON.stringify(prompt.args)};
    pipeline.hmset(userPromptKey, promptRedis);
    pipeline.zadd(`user:prompt:${session.user.id}`, Date.now().toString(),
      `user-prompt:${prompt.promptId}`
   )
    await pipeline.exec();
    return { success: true };
  } else {
    return { error: 'Unauthorized' };
  }
}

export async function getPromptsForUser(): Promise<Prompt[]> {
  const session = await auth();
 if (!session || !session.user || !session.user.id) {
  return []
 }

 const userId = session.user.id;
 const userPrompts: string[] = await kv.zrange(`user:prompt:${userId}`, 0, -1);
 if (userPrompts.length === 0) {
   // No prompts found for the user, return an empty array
   return [];
 }

 const pipeline = kv.pipeline();
 for (const userPrompt of userPrompts) {
   pipeline.hgetall(userPrompt);
 }
 const results = await pipeline.exec();
 if (!results) {
   return [];
 }
const prompts = results.map((result) => {
  // Check if result is truthy and if its second element is an object
  if (!result || typeof result[1] !== 'object') {
    return null;
  }
  // Convert the result to a prompt object
  const res = result[1] as any
  let prompt = { ...res, args: res.args } as Prompt;
  return prompt;
});
  console.log(`prompts`, prompts)
 return prompts as Prompt[];
}

export async function removePrompt(promptId: string) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return { error: 'Unauthorized' };
  }
  const userId = session.user.id;
  const userPromptKey = `user-prompt:${promptId}`;
  await kv.del(userPromptKey);
  await kv.zrem(`user:prompt:${userId}`, userPromptKey);
  return { success: true };
}
