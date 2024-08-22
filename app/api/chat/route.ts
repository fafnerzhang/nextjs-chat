import { NextRequest } from 'next/server';
import { generateText } from 'ai'
import {openai} from '@ai-sdk/openai'

async function* fetchItems(): AsyncGenerator<Record<string, unknown>, void, unknown> {
  const promises = [];
  for (let i = 0; i < 1; ++i) {
      const promise = generateText({
          model: openai('gpt-3.5-turbo'),
          prompt: `Generate item ${i}`,
      }).then((item) => ({ key: `item${i}`, value: item.text })) // Modify to return an object
        .catch((err) => {
            console.error(err);
            return { key: `item${i}`, value: "" }; // Return an object with a default value in case of error
        });
      promises.push(promise);
  }
  console.log(promises.length)
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


export async function GET(req: NextRequest ) {

    const stream = makeStream( fetchItems() )
    const response = new StreamingResponse( stream )
    return response
}