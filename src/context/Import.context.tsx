import {
  useCallback,
  createContext,
  useContext,
  useState,
  type Dispatch,
  type PropsWithChildren,
} from "react"

import {
  validateRow,
  validateRows,
} from "@/lib/validator"
import type { DataTableColumn, DataTableRow } from "@/types/DataTable.types"

type ImportContextValue = {
  schema: DataTableColumn[]
  setSchema: Dispatch<DataTableColumn[]>
  rows: DataTableRow[]
  importRows: (rows: Record<string, unknown>[]) => void
  updateCell: (rowId: string, fieldName: string, value: string) => void
  deleteRow: (rowId: string) => void
  resetRows: () => void
}

const defaultSchema: DataTableColumn[] = [
  {
    name: "name",
    type: "string",
    required: true,
    unique: true,
    regex: "",
    regexMessage: "",
  },
  {
    name: "age",
    type: "number",
    required: true,
    unique: false,
    regex: "^\\d{1,3}$",
    regexMessage: "Age must be a number with up to 3 digits.",
  },
]

const ImportContext = createContext<ImportContextValue | null>(null)

const mapRowToSchema = (
  row: Record<string, unknown>,
  schema: DataTableColumn[]
): Record<string, string> =>
  Object.fromEntries(
    schema.map((field) => [field.name, String(row[field.name] ?? "")])
  )

const createValidatedRows = (
  rowEntries: Pick<DataTableRow, "id" | "values">[],
  schema: DataTableColumn[]
): DataTableRow[] => {
  const errorsByRow = validateRows(
    rowEntries.map((row) => row.values),
    schema
  )

  return rowEntries.map((row, index) => ({
    id: row.id,
    values: row.values,
    errors: errorsByRow[index] ?? {},
    isValid: Object.keys(errorsByRow[index] ?? {}).length === 0,
  }))
}

export const ImportProvider = ({ children }: PropsWithChildren) => {
  const [schema, setSchemaState] = useState<DataTableColumn[]>(defaultSchema)
  const [rows, setRows] = useState<DataTableRow[]>([])

  const resetRows = useCallback(() => {
    setRows([])
  }, [])

  const setSchema = useCallback((fields: DataTableColumn[]) => {
    setSchemaState(fields)
    setRows([])
  }, [])

  const importRows = useCallback((rows: Record<string, unknown>[]) => {
    setRows(
      createValidatedRows(
        rows.map((row) => ({
          id: crypto.randomUUID(),
          values: mapRowToSchema(row, schema),
        })),
        schema
      )
    )
  }, [schema])

  const updateCell = useCallback((rowId: string, fieldName: string, value: string) => {
    setRows((currentRows) => {
      const column = schema.find((item) => item.name === fieldName)

      if (column?.unique) {
        return createValidatedRows(
          currentRows.map((row) =>
            row.id === rowId
              ? {
                  ...row,
                  values: {
                    ...row.values,
                    [fieldName]: value,
                  },
                }
              : row
          ),
          schema
        )
      }

      return currentRows.map((row) => {
        if (row.id !== rowId) {
          return row
        }

        const values = {
          ...row.values,
          [fieldName]: value,
        }
        const errors = validateRow(values, schema)

        return {
          ...row,
          values,
          errors,
          isValid: Object.keys(errors).length === 0,
        }
      })
    })
  }, [schema])

  const deleteRow = useCallback((rowId: string) => {
    setRows((currentRows) => {
      const nextRows = currentRows.filter((row) => row.id !== rowId)

      if (nextRows.length === currentRows.length) {
        return currentRows
      }

      return createValidatedRows(nextRows, schema)
    })
  }, [schema])

  return (
    <ImportContext.Provider
      value={{
        schema,
        rows,
        setSchema,
        importRows,
        updateCell,
        deleteRow,
        resetRows,
      }}
    >
      {children}
    </ImportContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useImportContext = () => {
  const context = useContext(ImportContext)

  if (!context) {
    throw new Error("useImportContext must be used within ImportProvider")
  }

  return context
}
