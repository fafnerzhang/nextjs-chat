'use client'

import { IconOpenAI, IconUser } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { spinner } from './ui/spinner'
import { CodeBlock } from './ui/codeblock'
import { MemoizedReactMarkdown } from './markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { StreamableValue, useStreamableValue } from 'ai/rsc'
import { useStreamableText } from '@/lib/hooks/use-streamable-text'
import { Button } from './ui/button'
import { IconDownload, IconCopy, IconCheck } from './ui/icons'
import { useCopyToClipboard } from '@/lib/hooks/use-copy-to-clipboard'
import { MultiSubmitContentProps } from '@/lib/types'

export function UserMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="group relative flex items-start md:-ml-12">
      <div className="flex size-[25px] shrink-0 select-none items-center justify-center rounded-md border bg-background shadow-sm">
        <IconUser />
      </div>
      <div className="ml-4 flex-1 space-y-2 overflow-hidden pl-2">
        {children}
      </div>
    </div>
  )
}

export function BotMessage({
  content,
  className
}: {
  content: string | StreamableValue<string>
  className?: string
}) {
  const text = useStreamableText(content)
  return (
    <div className={cn('group relative flex items-start md:-ml-12', className)}>
      <div className="flex size-[24px] shrink-0 select-none items-center justify-center rounded-md border bg-primary text-primary-foreground shadow-sm">
        <IconOpenAI />
      </div>
      <div className="ml-4 flex-1 space-y-2 overflow-hidden px-1">
        <MemoizedReactMarkdown
          className="prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0"
          remarkPlugins={[remarkGfm, remarkMath]}
          components={{
            p({ children }) {
              return <p className="mb-2 last:mb-0">{children}</p>
            },
            code({ node, inline, className, children, ...props }) {
              if (children.length) {
                if (children[0] == '▍') {
                  return (
                    <span className="mt-1 animate-pulse cursor-default">▍</span>
                  )
                }

                children[0] = (children[0] as string).replace('`▍`', '▍')
              }

              const match = /language-(\w+)/.exec(className || '')

              if (inline) {
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                )
              }

              return (
                <CodeBlock
                  key={Math.random()}
                  language={(match && match[1]) || ''}
                  value={String(children).replace(/\n$/, '')}
                  {...props}
                />
              )
            }
          }}
        >
          {text}
        </MemoizedReactMarkdown>
      </div>
    </div>
  )
}

export function BotCard({
  children,
  showAvatar = true
}: {
  children: React.ReactNode
  showAvatar?: boolean
}) {
  return (
    <div className="group relative flex items-start md:-ml-12">
      <div
        className={cn(
          'flex size-[24px] shrink-0 select-none items-center justify-center rounded-md border bg-primary text-primary-foreground shadow-sm',
          !showAvatar && 'invisible'
        )}
      >
        <IconOpenAI />
      </div>
      <div className="ml-4 flex-1 pl-2">{children}</div>
    </div>
  )
}

interface MultiSubmitMessageProps {
  contents: MultiSubmitContentProps[]
  className?: string
  showAvatar?: boolean
  prompt?: string
}

export function MultiSubmitMessage({
  contents,
  className,
  showAvatar = true,
  prompt,
  ...props
}: MultiSubmitMessageProps) {
  const contentLength = contents.length
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 })
  const onCopy = () => {
    if (isCopied) return
    copyToClipboard(contents.map(c => c.value).join('\n'))
  }

  const downloadFile = async () => {
    try {
      const response = await fetch('/api/xlsx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt, contents })
        // Include body if needed, e.g., body: JSON.stringify({ key: 'value' })
      })
      if (!response.ok) throw new Error('Network response was not ok')
      const blob = await response.blob()
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = 'downloaded_file.xlsx' // Default filename
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.+)"?/)
        if (match && match[1]) {
          filename = match[1]
        }
      }
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a) // Append the link to the document
      a.click()
      window.URL.revokeObjectURL(url) // Clean up
      a.remove() // Remove the link
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  return (
    <div className={cn('group relative flex items-start md:-ml-12', className)}>
      <div className="flex size-[24px] shrink-0 select-none items-center justify-center rounded-md border bg-primary text-primary-foreground shadow-sm">
        <IconOpenAI />
      </div>
      <div className="ml-4 flex-1 pl-2">
        {contents.map((content, index) => (
          <>
            <MemoizedReactMarkdown
              key={index}
              className="prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0"
            >
              {content.value}
            </MemoizedReactMarkdown>
            {index !== contentLength - 1 && (
              <hr className="my-2 border-gray-200 dark:prose-invert prose-p:leading-relaxed prose-pre:p-0" />
            )}
          </>
        ))}
        <div className="flex items-center justify-start mt-1 rounded-sm">
          <Button
            variant={'ghost'}
            className="rounded-lg	"
            onClick={downloadFile}
          >
            <IconDownload />
          </Button>
          <Button variant={'ghost'} className="rounded-lg" onClick={onCopy}>
            {isCopied ? <IconCheck /> : <IconCopy />}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function SystemMessage({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={
        'mt-2 flex items-center justify-center gap-2 text-xs text-gray-500'
      }
    >
      <div className={'max-w-[600px] flex-initial p-2'}>{children}</div>
    </div>
  )
}

export function SpinnerMessage() {
  return (
    <div className="group relative flex items-start md:-ml-12">
      <div className="flex size-[24px] shrink-0 select-none items-center justify-center rounded-md border bg-primary text-primary-foreground shadow-sm">
        <IconOpenAI />
      </div>
      <div className="ml-4 h-[24px] flex flex-row items-center flex-1 space-y-2 overflow-hidden px-1">
        {spinner}
      </div>
    </div>
  )
}
