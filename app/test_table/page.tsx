'use client'

import React, {
  useMemo,
  useRef,
  useState,
  StrictMode,
  ChangeEvent,
  useEffect,
  useCallback
} from 'react'
import { IRowNode } from '@ag-grid-community/core'
import { AgGridReact } from '@ag-grid-community/react'
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model'
import { ModuleRegistry, SelectionChangedEvent } from '@ag-grid-community/core'
import {
  useSheets,
  SheetData,
  SheetsContextType
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
import { validSheets } from '@/lib/xlsx'
import { SheetGrid } from '@/components/table/table'

ModuleRegistry.registerModules([ClientSideRowModelModule])
interface RowData {
  id: number
  name: string
  value: any // Replace 'any' with a more specific type as needed
}

interface Sheets {
  [key: string]: SheetData
}

function ColorPanel() {
  const colorNames = [
    'background',
    'foreground',
    'card',
    'card-foreground',
    'popover',
    'popover-foreground',
    'primary',
    'primary-foreground',
    'secondary',
    'secondary-foreground',
    'muted',
    'muted-foreground',
    'accent',
    'accent-foreground',
    'destructive',
    'destructive-foreground',
    'border',
    'input',
    'ring'
  ]
  return (
    <div className="fixed bottom-0 right-0 z-50 bg-indigo-300 p-2">
      <div className="grid grid-cols-3 gap-2">
        {colorNames.map(colorName => (
          <div key={colorName} className="flex items-center space-x-1">
            <div className={`w-6 h-6 rounded-full bg-${colorName}`}></div>
            <span className="text-xs">{colorName}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
function AddColumnComponent(props: CustomHeaderProps) {
  const addColumn = () => {
    const columns = props.api.getColumnDefs() as Record<string, any>[]
    const newColumn = {
      field: 'new_column',
      headerName: 'New Column',
      cellEditor: 'agTextCellEditor'
    }
    // append new column to n-1 index
    const lastColumn = columns.pop()
    if (lastColumn) {
      columns.push(newColumn)
      columns.push(lastColumn)
    }
    props.api.setGridOption('columnDefs', columns)
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button onClick={addColumn}>
          <IconPlus className="size-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent sideOffset={16} align="start" className="w-fit">
        {/* <DropdownMenuItem className="flex items-center"> */}
        <input className="m-2"></input>
        {/* </DropdownMenuItem> */}
        <DropdownMenuItem className="flex items-center">
          <IconPlus className="size-3 m-1" />
          <div className="text-xs text-zinc-700">Add Column</div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function CustomHeaderComponent(props: CustomHeaderProps) {
  const coldefs = props.column.getColDef() as Record<string, any>
  const [colName, setColName] = useState<string>(coldefs.field)
  const { activeSheet, updateSheetColumn } = useSheets() as SheetsContextType

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
    const colId = props.column.getId()
    const columns = props.api.getColumnDefs() as Record<string, any>[]
    const newColumns = columns.filter(column => column.colId !== colId)
    props.api.setGridOption('columnDefs', newColumns)
  }, [])

  return (
    <DropdownMenu>
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
                const newColumns = columns.map(column => {
                  if (column.colId === colId) {
                    column.headerName = colName
                    column.field = colName
                  }
                  return column
                })
                updateSheetColumn(activeSheet, oldColName, colName)
                props.api.setGridOption('columnDefs', newColumns)
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
        <DropdownMenuItem className="flex items-center">
          <IconTrash className="size-3 m-1" />
          <div onClick={deleteProptery}>Delete property</div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const GridExample = () => {
  const handleTabChange = (sheetName: string) => {
    // Save current AgGridReact data to sheet
    const currentGridData = gridRef.current?.api.forEachNode(node => node)
    // Set active sheet to the selected tab's value
    setActiveSheet(sheetName)
  }
  const {
    sheetsData,
    activeSheet,
    setSheetsData,
    setActiveSheet,
    updateSheetColumn
  } = useSheets() as SheetsContextType
  const gridRef = useRef<AgGridReact>(null)
  const containerStyle = useMemo(
    () => ({ width: '1000px', height: '100vh' }),
    []
  )

  useEffect(() => {
    if (!activeSheet || !sheetsData[activeSheet]?.headers) return
    setRowData(sheetsData[activeSheet].data)
  }, [updateSheetColumn])

  useEffect(() => {
    if (!activeSheet || !sheetsData[activeSheet]?.headers) return
    const sheetColumnDefs: Record<string, any>[] = sheetsData[
      activeSheet
    ].headers.map(header => ({
      field: `${header}`, // Convert header to string using template literals
      headerName: `${header}`,
      cellEditor: 'agTextCellEditor',
      headerComponent: CustomHeaderComponent
    }))
    sheetColumnDefs.push({
      field: 'add_column',
      headerName: 'Add Column',
      headerComponent: AddColumnComponent
    })
    setColumnDefs(sheetColumnDefs)
    setRowData(sheetsData[activeSheet].data)
  }, [activeSheet])

  const [rowData, setRowData] = useState<Record<string, any>[]>([])
  const [columnDefs, setColumnDefs] = useState<Record<string, any>[]>([])
  const defaultColDef = useMemo(() => {
    return {
      flex: 1,
      editable: true
    }
  }, [])
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.name.endsWith('.xlsx')) return
      const reader = new FileReader()
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheets: Sheets = workbook.SheetNames.reduce(
          (acc: Sheets, sheetName) => {
            const sheet = workbook.Sheets[sheetName]
            // Convert sheet to JSON with objects instead of arrays
            const jsonData = XLSX.utils.sheet_to_json(sheet, {
              header: 1
            }) as (string | number)[][]

            // Assuming the first row contains headers
            const headers = jsonData[0] || []
            const data = jsonData.slice(1).map(row => {
              return row.reduce(
                (acc: Record<string, string>, cellValue, index) => {
                  const header = headers[index]
                  acc[header] = cellValue.toString() // Convert all values to strings
                  return acc
                },
                {}
              )
            })

            acc[sheetName] = { headers, data }
            return acc
          },
          {}
        )
        setSheetsData(sheets)
        setActiveSheet(workbook.SheetNames[0])
      }
      reader.readAsArrayBuffer(file)
    }
  }

  const removeSelectRows = () => {
    const selectedData = gridRef.current?.api.getSelectedRows()
    const res = gridRef.current?.api.applyTransaction({ remove: selectedData })
    const currentGridData: any[] = []
    gridRef.current!.api.forEachNode(function (node) {
      currentGridData.push(node.data)
    })
    setSheetsData({
      ...sheetsData,
      [activeSheet]: {
        headers: sheetsData[activeSheet].headers,
        data: currentGridData
      }
    })
  }

  const addRow = () => {
    const columns = sheetsData[activeSheet].headers
    const newRow = columns.reduce<Record<string, string>>((acc, header) => {
      acc[header] = ''
      return acc
    }, {})
    console.log(newRow)
    const res = gridRef.current?.api.applyTransaction({ add: [newRow] })
    const IrNode = res?.add
    if (IrNode) {
      gridRef.current?.api.setNodesSelected({ nodes: IrNode, newValue: true })
    }
  }

  const [isEditing, setIsEditing] = useState<{ [key: string]: boolean }>({})
  const [editValue, setEditValue] = useState<{ [key: string]: string }>({})
  const handleDoubleClick = (sheetName: string) => {
    setActiveSheet(sheetName)
    setIsEditing({ ...isEditing, [sheetName]: true })
    setEditValue({ ...editValue, [sheetName]: sheetName })
  }
  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    sheetName: string
  ) => {
    setEditValue({ ...editValue, [sheetName]: e.target.value })
  }
  const handleKeyPress = (
    e: React.KeyboardEvent<HTMLInputElement>,
    oldSheetName: string
  ) => {
    if (e.key === 'Enter') {
      const newSheetName = editValue[oldSheetName]
      // Update sheetsData with new sheet name
      const newData = { ...sheetsData }
      newData[newSheetName] = newData[oldSheetName]
      delete newData[oldSheetName]

      setSheetsData(newData)
      setActiveSheet(newSheetName)

      // Exit editing mode
      setIsEditing({ ...isEditing, [oldSheetName]: false })
    }
  }
  const [selectedRowLength, setSelectedRowLength] = useState(0)
  const onSelectionChanged = useCallback((event: SelectionChangedEvent) => {
    let rowCount = event.api.getSelectedNodes().length
    setSelectedRowLength(rowCount)
  }, [])
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ColorPanel />
      <div className="flex">
        <input
          type="file"
          accept="application/xlsx"
          onChange={handleFileUpload}
          onClick={e => {
            const element = e.target as HTMLInputElement
            element.value = ''
          }}
          className="mb-4"
        />
        <button onClick={removeSelectRows}> Delete selete row</button>
        <button onClick={addRow}>Add Row</button>
        <button onClick={() => setActiveSheet('concat_prompt')}>
          Set Active Sheet
        </button>
      </div>
      <div style={{ flexGrow: '1' }}>
        {selectedRowLength}
        <button
          className="inline-block px-4 py-2 m-1 text-sm font-medium leading-5 text-gray-700 transition-colors duration-150 border border-transparent rounded-lg focus:outline-none focus:shadow-outline-blue"
          onClick={() => {
            console.table(sheetsData)
          }}
        >
          log
        </button>
        <div className="ag-theme-quartz w-[80%] h-full m-6">
          <div className="flex justify-between items-center">
            <div
              className={`w-96 mb-2 no-scrollbar inline-flex flex-nowrap overflow-x-auto p-1 bg-[var(--color-bg-secondary,#f9fafb)] ${Object.keys(sheetsData).length === 0 ? '' : 'border border-[var(--color-border-secondary,#eff0f1)]'} text-[#39485d] rounded-lg`}
            >
              {Object.keys(sheetsData).length === 0 && (
                <button className="flex-shrink px-4 py-2 m-1 text-sm font-medium leading-5 text-gray-700 transition-colors duration-150 border border-transparent rounded-lg focus:outline-none whitespace-nowrap bg-gray-200 hover:bg-gray-300">
                  No sheets
                </button>
              )}
              {Object.keys(sheetsData).map(sheetName =>
                isEditing[sheetName] ? (
                  <input
                    key={sheetName}
                    value={editValue[sheetName]}
                    onChange={e => handleEditChange(e, sheetName)}
                    onKeyPress={e => handleKeyPress(e, sheetName)}
                    onBlur={() =>
                      setIsEditing({ ...isEditing, [sheetName]: false })
                    }
                    autoFocus
                    className="flex-shrink px-4 py-2 m-1 text-sm font-medium leading-5 text-gray-700 transition-colors duration-150 border border-transparent rounded-lg focus:outline-none whitespace-nowrap"
                  />
                ) : (
                  <button
                    key={sheetName}
                    onClick={() => handleTabChange(sheetName)}
                    onDoubleClick={() => handleDoubleClick(sheetName)}
                    className={`flex-shrink px-4 py-2 m-1 text-sm font-medium leading-5 text-gray-700 transition-colors duration-150 border border-transparent rounded-lg focus:outline-none focus:shadow-outline-blue ${sheetName === activeSheet ? 'bg-white text-black shadow' : 'bg-gray-200 hover:bg-gray-300'} whitespace-nowrap`}
                  >
                    {sheetName}
                  </button>
                )
              )}
            </div>
            <div className="flex">
              {selectedRowLength > 0 && (
                <div
                  className="flex items-center justify-center m-2"
                  role="group"
                >
                  <button
                    className="inline-flex items-center px-2 py-1 text-sm font-medium text-primary bg-background border border-gray-200 rounded-l-lg hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-600"
                    onClick={() => {
                      gridRef.current?.api.deselectAll()
                    }}
                  >
                    {selectedRowLength} selected
                  </button>
                  <button className="inline-flex items-center px-2 py-1 text-sm font-medium text-red-500 bg-background border-t border-b border-r rounded-r-lg border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-red-500 dark:hover:bg-gray-600">
                    <IconTrash
                      className="size-5"
                      onClick={() => {
                        removeSelectRows()
                      }}
                    />
                  </button>
                </div>
              )}
              <div
                className="flex items-center justify-center m-2"
                role="group"
              >
                <button
                  disabled={rowData.length === 0}
                  className="inline-flex items-center px-2 py-1 text-sm font-medium text-primary bg-background border border-gray-200 rounded-lg hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-600 disabled:text-gray-400 dark:disabled:bg-gray-700 dark:disabled:text-gray-600"
                  onClick={() => {
                    const res = validSheets(sheetsData)
                    console.log(JSON.stringify(res))
                    addRow()
                  }}
                >
                  New
                </button>
              </div>
            </div>
          </div>
          <div className="h-96">
            <AgGridReact
              ref={gridRef}
              rowData={rowData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              rowSelection={'multiple'}
              rowMultiSelectWithClick={true}
              copyHeadersToClipboard={true}
              pagination={true}
              onSelectionChanged={onSelectionChanged}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <StrictMode>
      <GridExample />
    </StrictMode>
  )
}
