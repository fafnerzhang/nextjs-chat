'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {Message} from '@/lib/types'
import { auth } from '@/auth'
import { type Chat, type Prompt, type PromptVariables } from '@/lib/types'
import { baseURL } from '@/lib/utils'


export async function getChats(userId?: string | null) {
  const session = await auth()
  if (!userId) {
    return []
  }

  if (userId !== session?.user?.id) {
    return {
      error: 'Unauthorized'
    }
  }

  try {
    const encodedUserId = encodeURIComponent(userId)
    const res = await fetch(`${baseURL}/api/action/chat?userId=${encodedUserId}`, {
      method: 'GET'
    })
    if (!res.ok) {
      return []
    }
    const { chats } = await res.json()
    return chats as Chat[]
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
  const encodedUserId = encodeURIComponent(userId)
  const encodedChatId = encodeURIComponent(id)
  const res = await fetch(`${baseURL}/api/action/chat?userId=${encodedUserId}&chatId=${encodedChatId}`, {
    method: 'GET'
  })
  if (!res.ok) {
    return null
  }
  const { chat } = await res.json()
  return chat as Chat
}

export async function removeChat({ id, path }: { id: string; path: string }) {
  const session = await auth()

  if (!session) {
    return {
      error: 'Unauthorized'
    }
  }

  const res = await fetch(`${baseURL}/api/action/chat?chatId=${id}`, {
    method: 'DELETE'
  })
  if (!res.ok) {
    return {
      error: 'Something went wrong'
    }
  }
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
  const res = await fetch(`${baseURL}/api/action/chat?userId=${session.user.id}`, {
    method: 'DELETE'
  })
  if (!res.ok) {
    return {
      error: 'Something went wrong'
    }
  }
  const {chats} = await res.json()
  if (chats.length) {
    revalidatePath('/')
  }
  return redirect('/')
}

export async function getSharedChat(id: string) {
  const res = await fetch(`${baseURL}/api/action/share?chatId=${id}`, {
    method: 'GET'
  })
  if (!res.ok) {
    return null
  } 
  const { chat, message } = await res.json()
  return chat
}

export async function shareChat(id: string) {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      error: 'Unauthorized'
    }
  }
  const res = await fetch(`${baseURL}/api/action/share?chatId=${id}`, {
    method: 'POST'
  })
  if (!res.ok) {
    return {
      error: 'Something went wrong'
    }
  }
  const { chat } = await res.json()
  return chat
}

export async function saveChat(chat: Chat) {
  const session = await auth()

  if (session && session.user) {
    const res = await fetch(`${baseURL}/api/action/chat`, {
      method: 'POST',
      body: JSON.stringify(chat)
    })
    if (!res.ok) {
      console.log(`error`, res)
      return
    }
    console.log(`saved chatID ${chat.id}`)
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
