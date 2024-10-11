import { UseChatHelpers } from 'ai/react'

import { Button } from '@/components/ui/button'
import { ExternalLink } from '@/components/external-link'
import { IconArrowRight } from '@/components/ui/icons'

export function EmptyScreen() {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="flex flex-col gap-2 rounded-lg border bg-background p-8">
        <h1 className="text-lg font-semibold">Welcome to our chat tool!</h1>
        <p className="leading-normal text-muted-foreground">
          Whether you&apos;re looking to craft compelling marketing scripts or
          refine your messaging in English, we&apos;re here to help.
        </p>
        <p className="leading-normal text-muted-foreground">
          Just type in your ideas, and we&apos;ll assist you in creating
          powerful and effective content to boost your marketing efforts.
        </p>
        <p className="leading-normal text-muted-foreground">
          Let&apos;s get started and elevate your marketing communication!
        </p>
      </div>
    </div>
  )
}
