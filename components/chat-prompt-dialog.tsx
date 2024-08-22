'use client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from './ui/button'
import { type DialogProps } from '@radix-ui/react-dialog'
import { type Prompt } from '@/lib/types'
import { PromptAccordion } from '@/components/accordion'
import { useState } from 'react'
import { IconPlus } from '@/components/ui/icons'
import { buttonVariants } from '@/components/ui/button'
import Link from 'next/link'
import { cn, parsePromptArgs } from '@/lib/utils'
import { usePromptVariable } from '@/components/ui/prompt-variable'
import { set } from 'date-fns'
import { nanoid } from '@/lib/utils'
import { getPromptsForUser, savePromptForUser } from '@/app/actions'

interface ChatPromptDialogProps extends DialogProps {
  setInput: (value: string) => void
  onOpenChange: (value: boolean) => void
}

export function ChatPromptDialog({
  setInput,
  children,
  onOpenChange,
  ...props
}: ChatPromptDialogProps) {
  const [edit, setEdit] = useState(false)
  const { prompts, setPrompts, selectedPromptId, setSelectedPromptId } =
    usePromptVariable()
  const [promptTitle, setPromptTitle] = useState('')
  const [promptText, setPromptText] = useState('')

  return (
    <Dialog {...props}>
      <DialogContent className="overflow-scroll max-h-160 left-1/2 max-w-3xl">
        <DialogHeader>
          <div className="flex justify-between">
            <div>
              <DialogTitle>Prompt hub</DialogTitle>
              <DialogDescription>
                choose a prompt to get started or type your own
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="flex-col">
          <div className="px-2 w-full">
            {!edit && prompts.length !== 0 && (
              <Button
                variant={'ghost'}
                className="w-full m-0 px-4 justify-start items-center"
                onClick={() => {
                  setEdit(prev => !prev)
                  setSelectedPromptId('')
                  setPromptTitle('')
                  setPromptText('')
                }}
              >
                <IconPlus className="-translate-x-2 stroke-2" />
                New Prompt
              </Button>
            )}
          </div>

          <div className="max-h-96 overflow-scroll p-1 black:bg-black">
            {!edit && <PromptAccordion prompts={prompts} />}
          </div>
        </div>
        {prompts.length === 0 || edit ? (
          <div className="mx-auto w-full px-4">
            <div className="flex flex-col gap-2 w-full rounded-lg border bg-background p-8">
              <h2 className="text-m font-semibold"></h2>
              <input
                className="peer block w-full rounded-md border bg-zinc-50 px-2 py-[9px] text-sm outline-none placeholder:text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950"
                id="prompt-title"
                type="text"
                name="prompt-title"
                placeholder="Title of Prompt"
                required
                minLength={6}
                value={promptTitle}
                onChange={e => setPromptTitle(e.target.value)}
              />
              <textarea
                className="resize-none h-80 peer block w-full rounded-md border bg-zinc-50 px-2 py-[9px] text-sm outline-none placeholder:text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950"
                id="prompt-text"
                name="prompt-text"
                placeholder="Prompt text"
                required
                minLength={6}
                maxLength={1500}
                value={promptText}
                onChange={e => setPromptText(e.target.value)}
              />
            </div>
            <div className="flex justify-between">
              <div>
                {selectedPromptId?.length !== 0 && (
                  <Button
                    className="m-2 w-28"
                    variant="destructive"
                    onClick={() => {
                      setEdit(!edit)
                    }}
                  >
                    Delete
                  </Button>
                )}
              </div>
              <div>
                <Button
                  className="m-2 w-28"
                  variant="secondary"
                  onClick={() => {
                    setEdit(!edit)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="m-2 w-28"
                  onClick={async () => {
                    setEdit(false)
                    const isNewPrompt = selectedPromptId.length === 0
                    const newPromptId = isNewPrompt
                      ? nanoid()
                      : selectedPromptId
                    const newPrompt = {
                      title: promptTitle,
                      prompt: promptText,
                      args: parsePromptArgs(promptText),
                      promptId: newPromptId
                    }
                    const res = await savePromptForUser(newPrompt)
                    setPrompts(prevPrompts => {
                      if (isNewPrompt) {
                        return [...prevPrompts, newPrompt]
                      } else {
                        return prevPrompts.map(prompt =>
                          prompt.promptId === newPromptId ? newPrompt : prompt
                        )
                      }
                    })
                  }}
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-end">
            <Button
              className="m-2"
              variant="secondary"
              disabled={selectedPromptId?.length === 0}
              onClick={() => {
                setEdit(!edit)
                const selectedPrompt = prompts.find(
                  prompt => prompt.promptId === selectedPromptId
                )
                setPromptTitle(selectedPrompt?.title || '')
                setPromptText(selectedPrompt?.prompt || '')
              }}
            >
              Edit
            </Button>

            <Button
              disabled={selectedPromptId?.length === 0}
              className="m-2 w-28"
              onClick={() => {
                const selectedPrompt = prompts.find(
                  prompt => prompt.promptId === selectedPromptId
                )
                setInput(selectedPrompt?.prompt || '')
                setSelectedPromptId('')
                onOpenChange(false)
              }}
            >
              Use
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
