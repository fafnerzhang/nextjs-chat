'use client'
import { SheetGrid, handleFileUpload, SheetDialog } from '@/components/table'
import { SheetsContextType, useSheets } from '@/components/table/sheet'
import { useRef, useState } from 'react'
import { DialogProps } from '@radix-ui/react-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
interface SheetDialogProps extends DialogProps {
  setInput: (value: string) => void
  onOpenChange: (value: boolean) => void
}

export default function SheetPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const { setSheetsData, setActiveSheet } = useSheets() as SheetsContextType
  const [promptDialogOpen, setPromptDialogOpen] = useState(false)
  const [input, setInput] = useState('')
  return (
    <div>
      <button onClick={() => setPromptDialogOpen(true)}>Open Dialog</button>
      <SheetDialog open={promptDialogOpen} onOpenChange={setPromptDialogOpen}>
        <input
          type="file"
          ref={fileRef}
          onChange={e => {
            handleFileUpload(e, setSheetsData, setActiveSheet)
          }}
        />
        <div className="w-full h-full">
          <FileUpload />
          {/* <SheetGrid setInput={setInput} /> */}
        </div>
      </SheetDialog>
    </div>
  )
}
export function FileUpload() {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const fileInputRef = useRef(null)

  const handleDragEnter = e => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragOver = e => {
    e.preventDefault()
  }

  const handleDragLeave = e => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = e => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length) {
      setSelectedFile(files[0])
      // Process the file here (e.g., upload to a server)
    }
  }

  const handleChange = e => {
    if (e.target.files.length) {
      setSelectedFile(e.target.files[0])
      // Process the file here
    }
  }

  const handleClick = () => {
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
        <div>Drag 'n' drop some files here, or click to select files</div>
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
