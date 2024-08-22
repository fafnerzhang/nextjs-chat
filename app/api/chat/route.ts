import { NextRequest } from 'next/server';
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { auth } from '@/auth'
import {getModel} from '@/lib/utils'

interface Prompt {
  body: string,
  args: Record<string, string>
}

async function* fetchItems(prompts: Prompt[], model: string, provider: string): AsyncGenerator<Record<string, unknown>, void, unknown> {
  const promises = [];
  const Model = getModel(provider, model)
  for (let i = 0; i < prompts.length; ++i) {
      const promise = generateText({
          model: Model,
          prompt: prompts[i].body,
      }).then((item) => ({key: i, value: item.text})) // Modify to return an object
        .catch((err) => {
            console.error(err);
            console.error("Error in fetchItems");
            return { key: `item${i}`, value: "" }; // Return an object with a default value in case of error
        });
      promises.push(promise);
  }
  for (const promise of promises) {
      await new Promise(resolve => setTimeout(resolve, 100));
      yield await promise; // Yielding an object now
  }
}

const makeStream = <T extends Record<string, unknown>>(generator: AsyncGenerator<T, void, unknown>) => 
    {
    
        const encoder = new TextEncoder();
        return new ReadableStream<any>({
            async start(controller) {
                for await (let chunk of generator) {
                    const chunkData =  encoder.encode(JSON.stringify(chunk));
                    controller.enqueue(chunkData);
                }
                controller.close();
            }
        });
    }

class StreamingResponse extends Response {

    constructor( res: ReadableStream<any>, init?: ResponseInit ) {
      super(res as any, {
        ...init,
        status: 200,
        headers: {
          ...init?.headers,
        },
      });
    }
  }


export async function POST(req: NextRequest ) {
  const session = await auth()
    // if (!session) {
    //     return new Response(null, { status: 401 })
    // }
    const res = await req.json()
    const prompts: Prompt[] = res.prompts
    const model = res.model
    const provider = res.provider
    const stream = makeStream( fetchItems(prompts, model, provider) )
    const response = new StreamingResponse( stream )
    return response
}