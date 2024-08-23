import React from 'react'
import * as Accordion from '@radix-ui/react-accordion'
import { ChevronDownIcon } from '@radix-ui/react-icons'
import { Badge } from '@/components/ui/badge'
import { type Prompt } from '@/lib/types'
import { usePromptVariable } from '@/components/ui/prompt-variable'
import { cn } from '@/lib/utils'

interface AccordionItemProps {
  children: React.ReactNode
  className?: string
  value: string // Assuming value is a required prop for AccordionItem
}

const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ children, className, ...props }, forwardedRef) => (
    <Accordion.Item
      className={cn(
        'focus-within:shadow-mauve12 mt-px overflow-hidden first:mt-0 first:rounded-t last:rounded-b focus-within:relative focus-within:z-10 focus-within:shadow-[0_0_0_2px]',
        className
      )}
      {...props}
      ref={forwardedRef}
    >
      {children}
    </Accordion.Item>
  )
)
AccordionItem.displayName = 'AccordionItem'
interface AccordionTriggerProps {
  children: React.ReactNode
  className?: string
}

const AccordionTrigger = React.forwardRef<
  HTMLButtonElement,
  AccordionTriggerProps
>(({ children, className, ...props }, forwardedRef) => (
  <Accordion.Header className="flex">
    <Accordion.Trigger
      className={cn(
        'focus:outline-none shadow-mauve6 hover:bg-mauve2 group flex h-[45px] flex-1 cursor-default items-center justify-between bg-white px-5 text-[15px] leading-none shadow-[0_1px_0] outline-none',
        className
      )}
      {...props}
      ref={forwardedRef}
    >
      {children}
      <ChevronDownIcon
        className="text-violet10 ease-[cubic-bezier(0.87,_0,_0.13,_1)] transition-transform duration-300 group-data-[state=open]:rotate-180"
        aria-hidden
      />
    </Accordion.Trigger>
  </Accordion.Header>
))

AccordionTrigger.displayName = 'AccordionTrigger'

interface AccordionContentProps {
  children: React.ReactNode
  className?: string
}

const AccordionContent = React.forwardRef<
  HTMLDivElement,
  AccordionContentProps
>(({ children, className, ...props }, forwardedRef) => (
  <Accordion.Content
    className={cn(
      'focus:outline-none text-mauve11 bg-mauve2 data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp overflow-hidden text-[15px]',
      className
    )}
    {...props}
    ref={forwardedRef}
  >
    <div className="py-[15px] px-5">{children}</div>
  </Accordion.Content>
))

AccordionContent.displayName = 'AccordionContent'

interface PromptAccordionProps {
  prompts: Prompt[]
}

export function PromptAccordion({ prompts = [] }: PromptAccordionProps) {
  const { selectedPromptId, setSelectedPromptId } = usePromptVariable()
  return (
    <Accordion.Root
      className="bg-mauve6 w-[700px] rounded-md black:bg-black"
      onValueChange={value => setSelectedPromptId(value)}
      type="single"
      collapsible
    >
      {prompts.map((prompt, index) => (
        <AccordionItem
          key={prompt.promptId}
          value={prompt.promptId}
          className={`dark:bg-background`}
        >
          <AccordionTrigger className="dark:bg-background">
            <div className="flex dark:bg-background">
              {prompt.title}
              <div className="grow w-80"></div>
              <div className="flex max-w-52 overflow-scroll no-scrollbar text-primary-foreground dark:bg-background">
                {prompt.args.length > 0 &&
                  prompt.args.map((arg, index) => (
                    <Badge key={index} className="ml-1 text-secondary">
                      {arg}
                    </Badge>
                  ))}
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-primary-background dark:bg-background">
            {prompt.prompt}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion.Root>
  )
}
