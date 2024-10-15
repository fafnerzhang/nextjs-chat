import { NextApiRequest, NextApiResponse } from 'next';
import { NextRequest, NextResponse } from 'next/server';
import {Message} from '@/lib/types'
import { auth } from '@/auth'
import { type Chat, type Prompt, type PromptVariables } from '@/lib/types'
import kv from '@/lib/client'

export async function GET(req: NextRequest, res: NextApiResponse) {
    const searchParams = req.nextUrl.searchParams
    const chatId = searchParams.get('chatId')
    const chat = await kv.hgetall(`chat:${chatId}`)
    if (!chat || !chat.sharePath) {
        return res.status(404).json({ message: 'Chat not found' });
    }
    return res.status(200).json({ message: 'Chat found', chat: chat });
}

export async function POST(req: NextRequest, res: NextApiResponse) {
    const session = await auth()
    const searchParams = req.nextUrl.searchParams
    const chatId = searchParams.get('chatId')
    if (!session?.user?.id) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
      const chat = await kv.hgetall(`chat:${chatId}`)
      if (!chat || chat.userId !== session.user.id) {
        return res.status(500).json({ message: 'Something went wrong' });
      }
      const payload = {
        ...chat,
        sharePath: `/share/${chat.id}`
      }
      try {
        await kv.hmset(`chat:${chat.id}`, payload)
        return res.status(200).json({ message: 'Chat shared', chat: payload });

        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: 'Internal server error' });
        }
}