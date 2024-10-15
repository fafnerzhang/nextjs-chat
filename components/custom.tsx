'use client'

import { cn } from '@/lib/utils'
import { ChatList } from '@/components/chat-list'
import { ChatPanel } from '@/components/chat-panel'
import { EmptyScreen } from '@/components/empty-screen'
import { useLocalStorage } from '@/lib/hooks/use-local-storage'
import { useEffect, useState } from 'react'
import { useUIState, useAIState } from 'ai/rsc'
import { Message, Session } from '@/lib/types'
import { usePathname, useRouter } from 'next/navigation'
import { useScrollAnchor } from '@/lib/hooks/use-scroll-anchor'
import { toast } from 'sonner'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { MdCheck as CheckIcon } from 'react-icons/md' // Importing CheckIcon from react-icons
import { useRef } from 'react'
import { IconUpload, IconBookmark } from '@/components/ui/icons'
import { modelOptions } from '@/lib/constants'
import { ChatPromptDialog } from './chat-prompt-dialog'
import { usePromptVariable } from './ui/prompt-variable'
import { getPromptsForUser } from '@/app/actions'
import { useModel } from '@/lib/hooks/use-model'
import { SheetDialog, SheetGrid, handleFileUpload } from '@/components/table'
import { useSheets, SheetsContextType } from '@/components/table/sheet'
import { Sheet } from './ui/sheet'
import { set } from 'date-fns'
import { useInput, InputContextType } from '@/components/input'

export function ToolBar() {
  const { input, setInput } = useInput() as InputContextType
  const [promptDialogOpen, setPromptDialogOpen] = useState(false)
  const [sheetDialogOpen, setSheetDialogOpen] = useState(false)
  const { setPromptVariables, prompts, setPrompts } = usePromptVariable()
  return (
    <div className="sticky top-0 flex w-full max-w-screen mx-auto bg-white z-50 bg-background dark:bg-zinc-900 overflow-auto">
      <div className="grow"></div>
      <div className="flex content-center">
        <button
          onClick={async () => {
            // setSheetDialogOpen(!sheetDialogOpen)
            if (prompts?.length === 0) {
              const fetchPrompts = await getPromptsForUser()
              setPrompts(fetchPrompts)
            }
            setPromptDialogOpen(!promptDialogOpen)
          }}
          className="rounded-m m-1 flex item-start transition-colors hover:bg-zinc-200/40 dark:hover:bg-zinc-300/10 pr-18 dark:bg-zinc-800 content-center"
        >
          <IconBookmark className="m-1" />
        </button>
      </div>
      <ChatPromptDialog
        onOpenChange={setPromptDialogOpen}
        setInput={setInput}
        open={promptDialogOpen}
      />
      <SheetDialog open={sheetDialogOpen} onOpenChange={setSheetDialogOpen}>
        <div>
          <FileUpload />
          <SheetGrid setInput={setInput} />
        </div>
      </SheetDialog>
    </div>
  )
}

export function FileUpload() {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const fileInputRef = useRef(null)
  const { setPromptVariables, prompts, setPrompts } = usePromptVariable()
  const { setSheetsData, setActiveSheet } = useSheets() as SheetsContextType

  async function oldhandleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = event.target.files
    if (files?.length && files.length > 0) {
      const formData = new FormData()
      formData.append('file', files[0]) // Assuming single file upload, adjust as needed

      try {
        const response = await fetch('/api/file/variable', {
          method: 'POST',
          body: formData
          // Do not set Content-Type header for FormData
        })

        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`)
        }

        const result = await response.json()
        setPromptVariables(result)
        console.log('Prompt variables:', JSON.stringify(result))
      } catch (error) {
        console.error('Error uploading file:', error)
      }
    }
  }
  const handleDragEnter = e => {
    e.preventDefault()
    // Only update state if isDragging is currently false
    if (!isDragging) setIsDragging(true)
  }

  const handleDragOver = e => {
    e.preventDefault()
    // Keep isDragging true while over the drop area
    if (!isDragging) setIsDragging(true)
  }

  const handleDragLeave = e => {
    e.preventDefault()
    // Only update state if isDragging is currently true
    if (isDragging) setIsDragging(false)
  }

  const handleDrop = e => {
    e.preventDefault()
    // Reset isDragging to false once the file is dropped
    setIsDragging(false)
    // Process the dropped file(s)
    const files = e.dataTransfer.files
    if (files.length) {
      setSelectedFile(files[0])
      // Additional file processing can be done here
    }
  }

  const handleChange = e => {
    if (e.target.files.length) {
      setSelectedFile(e.target.files[0])
      // Process the file here
      oldhandleFileChange(e)
      handleFileUpload(e, setSheetsData, setActiveSheet)
    }
  }

  const handleClick = () => {
    if (!fileInputRef.current) return
    fileInputRef.current.click()
  }

  const dropAreaStyle = {
    border: isDragging ? '2px dashed #000' : '2px dashed #ccc',
    padding: '20px',
    textAlign: 'center',
    cursor: 'pointer',
    backgroundColor: isDragging ? '#f0f0f0' : 'transparent'
  }

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      style={dropAreaStyle}
    >
      {isDragging ? (
        <div>Drop the files here ...</div>
      ) : (
        <div>{`Drag 'n' drop some files here, or click to select files`}</div>
      )}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleChange}
        style={{ display: 'none' }}
      />
      {selectedFile && <div>File: {selectedFile.name}</div>}
    </div>
  )
}
