import { NextApiRequest, NextApiResponse } from 'next';
import { NextRequest, NextResponse } from 'next/server';
import {Message} from '@/lib/types'
import { auth } from '@/auth'
import { type Chat, type Prompt, type PromptVariables } from '@/lib/types'
import kv from '@/lib/client'

export async function GET(req: NextApiRequest, res: NextApiResponse) {
    const session = await auth(req, res)
    const searchParams = new URL(req.url? req.url : '').searchParams
    const userId = searchParams.get('userId')
    const chatId = searchParams.get('chatId')
    if (!userId) {
      return NextResponse.json({ message: 'No user id provided' }, { status: 400 });
    }
    try {
      if (chatId) {
        let chat = await kv.hgetall(`chat:${chatId}`)

        if (!chat || (userId && chat.userId !== userId)) {
          return NextResponse.json({ message: 'Chat not found' }, { status: 404 });
        }
        const message = {...chat, messages: JSON.parse(chat.messages) as Message[]}
        return NextResponse.json({ message: 'Chat found', chat: message });
      }
      const pipeline = kv.pipeline();
      const chats: string[] = await kv.zrevrange(`user:chat:${userId}`, 0, -1);
      chats.forEach(chat => pipeline.hgetall(chat));
  
      const results = await pipeline.exec()
      if (!results || !results.length || !results[1]) {
        return NextResponse.json({ message: 'No chats found', chats: [] });
      }
      const chatsResult: Chat[] = results.map((result) => {
        let chat: Chat = result as any;
        if (!chat[1] || !chat[1].messages) {
          return null;
        }
        chat.messages = JSON.parse(chat[1].messages) as Message[]
        return chat[1]
      })
      return NextResponse.json({ message: 'Chats found', chats: chatsResult });
    } catch (error) {
      console.log(`error`, error)
      return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const session = await auth()
    const searchParams = req.nextUrl.searchParams
    const chatId = searchParams.get('chatId')
    const userId = searchParams.get('userId')
    const uid = String(await kv.hget(`chat:${chatId}`, 'userId'))
    console.log(`DELETE /api/action/chat`)
    if (userId ) {
        const chats: string[] = await kv.zrange(`user:chat:${userId}`, 0, -1)
        if (!chats.length){
            return NextResponse.json({ message: 'No chats found', chats: [] });
        }
        const pipeline = kv.pipeline()
        for (const chat of chats) {
            pipeline.del(chat)
            pipeline.zrem(`user:chat:${userId}`, chat)
          }
          await pipeline.exec()
        return NextResponse.json({message: 'Chats cleared', chats: chats})
    }

    if (!chatId) {
        return NextResponse.json({ message: 'No chat id provided' }, { status: 400 });
      }

    try {
        await kv.del(`chat:${chatId}`)
        await kv.zrem(`user:chat:${userId}`, `chat:${chatId}`)
        return NextResponse.json({ message: 'Chat deleted' });
    } catch (error) {
      console.log(`error`, error)
      return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}


export async function POST(req: NextRequest) {
  const session = await auth()
  const searchParams = req.nextUrl.searchParams
  console.log(`POST /api/action/chat`)
  try {
    const chat: Chat = await req.json();
    const pipeline = kv.pipeline()
    const redisChat = {...chat, messages: JSON.stringify(chat.messages)}
    pipeline.hmset(`chat:${chat.id}`, redisChat)
    pipeline.zadd(`user:chat:${chat.userId}`, Date.now().toString(), `chat:${chat.id}`)
    console.log(`saved chatID ${chat.id}`)
    const execRes = await pipeline.exec()
    return NextResponse.json({ message: 'Chat saved', chat: chat }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}