'use client'
import React, {
  useMemo,
  useRef,
  useState,
  ChangeEvent,
  useEffect,
  useCallback
} from 'react'
import { AgGridReact } from '@ag-grid-community/react'
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model'
import { ModuleRegistry, SelectionChangedEvent } from '@ag-grid-community/core'
import { useSheets, SheetsContextType, Sheets } from '@/components/table/sheet'
import * as XLSX from 'xlsx'
import { IconTrash } from '@/components/ui/icons'
import { validSheets } from '@/lib/xlsx'
import {
  CustomHeaderComponent,
  AddColumnComponent,
  NewSheetButton,
  SheetButton
} from '@/components/table/custom'
import { DialogProps } from '@radix-ui/react-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'

ModuleRegistry.registerModules([ClientSideRowModelModule])

interface SheetDialogProps extends DialogProps {
  onOpenChange: (value: boolean) => void
}

export function SheetDialog({ children, ...props }: SheetDialogProps) {
  return (
    <Dialog {...props}>
      <DialogContent className="overflow-scroll max-h-[84vh] left-1/2 max-w-[80vw]">
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
        <div className="w-full h-full">{children}</div>
      </DialogContent>
    </Dialog>
  )
}

export function handleFileUpload(
  e: ChangeEvent<HTMLInputElement>,
  setSheetsData: SheetsContextType['setSheetsData'],
  setActiveSheet: SheetsContextType['setActiveSheet']
): void {
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

export function SheetGrid({ setInput }: { setInput: (value: string) => void }) {
  const {
    sheetsData,
    activeSheet,
    setSheetsData,
    setActiveSheet,
    updateSheetColumn
  } = useSheets() as SheetsContextType
  const [rowData, setRowData] = useState<Record<string, any>[]>([])
  const [columnDefs, setColumnDefs] = useState<Record<string, any>[]>([])
  const [selectedRowLength, setSelectedRowLength] = useState(0)
  const [isEditing, setIsEditing] = useState<{ [key: string]: boolean }>({})
  const [editValue, setEditValue] = useState<{ [key: string]: string }>({})
  const gridRef = useRef<AgGridReact>(null)
  const handleTabChange = (sheetName: string) => {
    const currentGridData = gridRef.current?.api.forEachNode(node => node)
    setActiveSheet(sheetName)
  }

  const defaultColDef = useMemo(() => {
    return {
      flex: 1,
      editable: true,
      suppressHorizontalScroll: true
    }
  }, [])

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
      cellEditor: `${header}`.includes('template')
        ? 'agLargeTextCellEditor'
        : 'agTextCellEditor',
      cellEditorPopup: true,
      width: 100,
      minWidth: 100,
      cellEditorParams: {
        rows: 20,
        cols: 80
      },
      headerComponent: CustomHeaderComponent
    }))
    sheetColumnDefs.push({
      field: 'add_column',
      headerName: 'Add Column',
      headerComponent: AddColumnComponent,
      editable: false,
      resizable: false,
      minWidth: 50
    })
    setColumnDefs(sheetColumnDefs)
    setRowData(sheetsData[activeSheet].data)
  }, [activeSheet])

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

  const onSelectionChanged = useCallback((event: SelectionChangedEvent) => {
    let rowCount = event.api.getSelectedNodes().length
    setSelectedRowLength(rowCount)
  }, [])
  const addSheet = () => {
    setSheetsData({
      ...sheetsData,
      [`Sheet ${Object.keys(sheetsData).length + 1}`]: {
        headers: [],
        data: []
      }
    })
  }
  return (
    <div className="w-full h-full items-center justify-center">
      <div className="flex justify-between items-center">
        <div
          className={`w-96 mb-2 no-scrollbar inline-flex flex-nowrap overflow-x-auto p-1 bg-[var(--color-bg-secondary,#f9fafb)] ${Object.keys(sheetsData).length === 0 ? '' : 'border border-[var(--color-border-secondary,#eff0f1)]'} text-[#39485d] rounded-lg`}
        >
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
              <SheetButton
                key={sheetName}
                sheetName={sheetName}
                setActiveSheet={setActiveSheet}
                className={`flex-shrink px-4 py-2 m-1 text-sm font-medium leading-5 text-gray-700 transition-colors duration-150 border border-transparent rounded-lg focus:outline-none focus:shadow-outline-blue ${sheetName === activeSheet ? 'bg-white text-black shadow' : 'bg-gray-200 hover:bg-gray-300'} whitespace-nowrap`}
              />
            )
          )}
          <NewSheetButton addSheet={addSheet} />
        </div>
        <div className="flex">
          {selectedRowLength > 0 && (
            <div className="flex items-center justify-center m-2" role="group">
              <button
                className="inline-flex items-center px-2 py-1 text-sm font-medium text-primary bg-background border border-gray-200 rounded-l-lg hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-600"
                onClick={() => {
                  gridRef.current?.api.deselectAll()
                }}
              >
                {selectedRowLength} selected
              </button>
              <button className="inline-flex items-center px-2 py-1 text-sm font-medium text-primary bg-background border-t border-b border-r border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-600">
                Use prompt
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
          <div className="flex items-center justify-center m-2" role="group">
            <button
              disabled={activeSheet.length === 0}
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
      <div className="ag-theme-quartz h-[60vh]">
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
  )
}
