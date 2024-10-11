'use client'
import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  useSheets,
  SheetData,
  SheetsContextType,
  Sheets
} from '@/components/table/sheet'
import * as XLSX from 'xlsx'
import {
  IconArrowDown,
  IconArrowUp,
  IconEdit,
  IconPlus,
  IconClockwise,
  IconTrash
} from '@/components/ui/icons'
import { CustomHeaderProps } from '@ag-grid-community/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { set } from 'date-fns'
import { cn } from '@/lib/utils'

export function AddColumnComponent(props: CustomHeaderProps) {
  const { activeSheet, addSheetColumn } = useSheets() as SheetsContextType
  const addColumn = () => {
    const columns = props.api.getColumnDefs() as Record<string, any>[]
    const columnNum = columns.length
    const newColumn = {
      field: `column${columnNum}`,
      headerName: `Column ${columnNum}`,
      cellEditor: 'agTextCellEditor',
      headerComponent: CustomHeaderComponent,
      width: 100,
      minWidth: 100
    }
    // append new column to n-1 index
    const lastColumn = columns.pop()
    if (lastColumn) {
      columns.push(newColumn)
      columns.push(lastColumn)
    }
    props.api.setGridOption('columnDefs', columns)
    addSheetColumn(activeSheet, `column${columnNum}`)
  }
  return (
    <div className="flex">
      <button onClick={addColumn}>
        <IconPlus className="size-5 mr-4" />
      </button>
    </div>
  )
}

export function CustomHeaderComponent(props: CustomHeaderProps) {
  const coldefs = props.column.getColDef() as Record<string, any>
  const [colName, setColName] = useState<string>(coldefs.field)
  const { activeSheet, updateSheetColumn, deleteSheetColumn } =
    useSheets() as SheetsContextType
  const [menuOpen, setMenuOpen] = useState(false) // State to control menu visibility

  useEffect(() => {
    setColName(coldefs.field)
  }, [menuOpen])

  const sortAsc = useCallback(() => {
    const colId = props.column.getId()
    props.api.applyColumnState({
      state: [{ colId: colId, sort: 'asc' }],
      defaultState: { sort: null }
    })
  }, [])

  const sortDesc = useCallback(() => {
    const colId = props.column.getId()
    props.api.applyColumnState({
      state: [{ colId: colId, sort: 'desc' }],
      defaultState: { sort: null }
    })
  }, [])

  const clearSort = useCallback(() => {
    props.api.applyColumnState({
      defaultState: { sort: null }
    })
  }, [])

  const deleteProptery = useCallback(() => {
    const col = props.column.getColDef()
    const colId = props.column.getColId()
    const colField = col.field as string
    const columns = props.api.getColumnDefs() as Record<string, any>[]
    const newColumns = columns.filter(column => column.colId !== colId)
    props.api.setGridOption('columnDefs', newColumns)
    deleteSheetColumn(activeSheet, colField)
  }, [])

  return (
    <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <DropdownMenuTrigger
        asChild
        className="border-none active:border-none focus:shadow-none shadow-none focus:border-0"
      >
        <button className="w-full border-none active:border-none active:border-0 focus:shadow-none shadow-none focus:border-0 focus:outline-none active:outline-none">
          <p>{props.displayName}</p>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent sideOffset={16} align="start" className="w-fit">
        <div className="flex items-center">
          <IconEdit className="size-4 m-1" />
          <input
            value={colName}
            onChange={e => {
              setColName(e.target.value)
            }}
            onKeyPress={e => {
              if (e.key === 'Enter') {
                const columns = props.api.getColumnDefs() as Record<
                  string,
                  any
                >[]
                const colId = props.column.getId()
                const oldColName = props.column.getColDef().field as string
                if (oldColName === colName && colName.length === 0) return
                const isDuplicate = columns.some(
                  column => column.field === colName && column.colId !== colId
                )
                if (isDuplicate) {
                  toast.error('Column name already exists')
                  return
                }
                const newColumns = columns.map(column => {
                  if (column.colId === colId) {
                    column.headerName = colName
                    column.field = colName
                  }
                  return column
                })
                updateSheetColumn(activeSheet, oldColName, colName)
                props.api.setGridOption('columnDefs', newColumns)
                setMenuOpen(false)
              }
            }}
            className="rounded m-2 outline outline-2 outline-offset-2 outline-border focus:outline-border"
          ></input>
        </div>
        <DropdownMenuItem className="flex items-center" onSelect={sortAsc}>
          <IconArrowUp className="size-3 m-1" />
          <div>Sort ascending</div>
        </DropdownMenuItem>
        <DropdownMenuItem className="flex items-center" onSelect={sortDesc}>
          <IconArrowDown className="size-3 m-1" />
          <div>Sort descending</div>
        </DropdownMenuItem>
        <DropdownMenuItem className="flex items-center" onSelect={clearSort}>
          <IconClockwise className="size-3 m-1" />
          <div>Clear sort</div>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex items-center"
          onSelect={deleteProptery}
        >
          <IconTrash className="size-3 m-1" />
          <div>Delete property</div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function NewSheetButton({ addSheet }: { addSheet: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex-shrink px-2 py-2 m-1 text-sm font-medium leading-5 text-gray-700 transition-colors duration-150 border border-transparent rounded-lg focus:outline-none whitespace-nowrap bg-gray-200 hover:bg-gray-300">
          <IconPlus />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent sideOffset={16} align="start" className="w-fit">
        <DropdownMenuItem className="flex items-center" onClick={addSheet}>
          <IconPlus className="size-3 m-1" />
          <div className="text-xs text-zinc-700">New Sheet</div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function SheetButton({
  sheetName,
  setActiveSheet,
  className
}: {
  sheetName: string
  setActiveSheet: (sheet: string) => void
  className?: string
}) {
  const [onMenuOpen, setOnMenuOpen] = useState(false)
  const buttonRef = useRef(null)
  return (
    <div>
      <DropdownMenu
        open={onMenuOpen}
        onOpenChange={setOnMenuOpen}
        defaultOpen={false}
      >
        <DropdownMenuTrigger>
          <div></div>
        </DropdownMenuTrigger>
        <DropdownMenuContent sideOffset={10} align="start" className="w-fit">
          hellop
        </DropdownMenuContent>
      </DropdownMenu>
      <button
        ref={buttonRef}
        onClick={() => {
          setActiveSheet(sheetName)
        }}
        onDoubleClick={() => {
          setOnMenuOpen(!onMenuOpen)
        }}
        className={cn(className)}
      >
        {sheetName}
      </button>
    </div>
  )
}
