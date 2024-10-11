import React, { createContext, useContext, useState, ReactNode } from 'react'

export interface SheetData {
  headers: (string | number)[]
  data: Record<string, any>[]
}

export interface SheetsContextType {
  sheetsData: Record<string, SheetData>
  activeSheet: string
  setSheetsData: (sheets: Record<string, SheetData>) => void
  setActiveSheet: (sheetName: string) => void
  updateCell: (
    sheetName: string,
    rowIndex: number,
    colIndex: number,
    value: string
  ) => void
  updateSheet: (sheetName: string, data: Record<string, any>[]) => void
  updateSheetColumn: (
    sheetName: string,
    oldColName: string,
    newColName: string
  ) => void
  addSheetColumn: (sheetName: string, colName: string) => void
  deleteSheetColumn: (sheetName: string, colName: string) => void
}

const SheetsContext = createContext<SheetsContextType | null>(null)

export const useSheets = () => useContext(SheetsContext)

interface SheetsProviderProps {
  children: ReactNode
}

export const SheetsProvider: React.FC<SheetsProviderProps> = ({ children }) => {
  const [sheetsData, setSheetsData] = useState<Record<string, SheetData>>({})
  const [activeSheet, setActiveSheet] = useState<string>('')

  const updateCell = (
    sheetName: string,
    rowIndex: number,
    colIndex: number,
    value: any
  ) => {
    const newData = [...sheetsData[sheetName].data]
    if (!newData[rowIndex]) {
      newData[rowIndex] = []
    }
    newData[rowIndex][colIndex] = value
    setSheetsData({
      ...sheetsData,
      [sheetName]: { ...sheetsData[sheetName], data: newData }
    })
  }
  const updateSheet = (sheetName: string, data: Record<string, any>[]) => {
    setSheetsData({
      ...sheetsData,
      [sheetName]: { ...sheetsData[sheetName], data }
    })
  }
  const addSheetColumn = (sheetName: string, colName: string) => {
    setSheetsData(prevSheetsData => {
      const currentSheetData = { ...prevSheetsData[sheetName] }
      const updatedHeaders = currentSheetData.headers
        ? [...currentSheetData.headers, colName]
        : [colName]
      const updatedData = currentSheetData.data.map(row => ({
        ...row,
        [colName]: ''
      }))
      return {
        ...prevSheetsData,
        [sheetName]: {
          ...currentSheetData,
          headers: updatedHeaders,
          data: updatedData
        }
      }
    })
  }
  const updateSheetColumn = (
    sheetName: string,
    oldColName: string,
    newColName: string
  ) => {
    const headers = sheetsData[sheetName].headers
    const headerIndex = headers.indexOf(oldColName)
    if (headerIndex !== -1) {
      headers[headerIndex] = newColName // Step 2: Replace oldColName with newColName
    }
    const newData = sheetsData[sheetName].data.map(row => {
      const newRow = { ...row }
      newRow[newColName] = newRow[oldColName]
      delete newRow[oldColName]
      return newRow
    })
    setSheetsData(prev => ({
      ...prev,
      [sheetName]: { ...prev[sheetName], headers, data: newData }
    }))
  }
  const deleteSheetColumn = (sheetName: string, colName: string) => {
    setSheetsData(prevSheetsData => {
      const currentSheetData = { ...prevSheetsData[sheetName] }
      const updatedHeaders = currentSheetData.headers.filter(
        header => header !== colName
      )
      const updatedData = currentSheetData.data.map(row => {
        const newRow = { ...row }
        delete newRow[colName]
        return newRow
      })
      console.log(JSON.stringify(updatedData))
      console.log(updatedHeaders)
      return {
        ...prevSheetsData,
        [sheetName]: {
          ...currentSheetData,
          headers: updatedHeaders,
          data: updatedData
        }
      }
    })
  }
  return (
    <SheetsContext.Provider
      value={{
        sheetsData,
        activeSheet,
        setSheetsData,
        setActiveSheet,
        updateCell,
        updateSheet,
        updateSheetColumn,
        addSheetColumn,
        deleteSheetColumn
      }}
    >
      {children}
    </SheetsContext.Provider>
  )
}
export interface Sheets {
  [key: string]: SheetData
}
