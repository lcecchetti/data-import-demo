import {
  type PaginationState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"
import Papa from "papaparse"
import { Trash, Upload } from "lucide-react"
import { useCallback, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useImportContext } from "@/context/Import.context"
import { cn } from "@/lib/utils"
import { Step } from "./Step"
import type { DataTableRow } from "@/types/DataTable.types"
import { sanitizeRow } from "@/lib/validator"

export function DataTable() {
  const { schema, rows, importRows, resetRows, updateCell, deleteRow } =
    useImportContext()
  const [isImporting, setIsImporting] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [showOnlyErrors, setShowOnlyErrors] = useState(false)
  const [editingRowId, setEditingRowId] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const invalidRowCount = useMemo(
    () => rows.filter((row) => !row.isValid).length,
    [rows]
  )

  const submitRows = useCallback(() => {
    if (invalidRowCount) {
      window.alert("Fix the validation errors before submitting.")
      return
    }

    const payload = rows.map((row) => sanitizeRow(row.values, schema))
    window.alert(JSON.stringify(payload, null, 2))
  }, [invalidRowCount, rows, schema]);

  const visibleRows = useMemo(
    () =>
      showOnlyErrors
        ? rows.filter((row) => !row.isValid || row.id === editingRowId)
        : rows,
    [editingRowId, rows, showOnlyErrors]
  )

  const columns = useMemo(() => [
      {
        id: "index",
        header: "#",
        cell: ({ row }: { row: { index: number } }) => (
          <span className="text-sm text-muted-foreground">{row.index + 1}</span>
        ),
      },
      ...schema.map((field) => ({
        accessorKey: `values.${field.name}`,
        header: field.name,
        cell: ({ row }: { row: { original: DataTableRow } }) => {
          const messages = row.original.errors[field.name] ?? []

          return (
            <div className="space-y-1">
              <Input
                value={row.original.values[field.name] ?? ""}
                onChange={(event) =>
                  updateCell(row.original.id, field.name, event.target.value)
                }
                onFocus={() => setEditingRowId(row.original.id)}
                onBlur={() =>
                  setEditingRowId((current) =>
                    current === row.original.id ? null : current
                  )
                }
                aria-invalid={!!messages.length}
                className={cn(!!messages.length && "border-destructive")}
              />
              {messages.length > 0 ? (
                <p className="text-xs leading-5 text-destructive">
                  {messages.join(" ")}
                </p>
              ) : null}
            </div>
          )
        },
      })),
      {
        id: "actions",
        header: "",
        cell: ({ row }: { row: { original: DataTableRow } }) => (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="cursor-pointer"
              onClick={() => deleteRow(row.original.id)}
            >
              <Trash />
            </Button>
          </div>
        ),
      },
    ], [deleteRow, schema, updateCell])

  const table = useReactTable({
    data: visibleRows,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
  })

  const handleFileUpload = (file: File | null) => {
    if (!file) {
      return
    }

    setIsImporting(true)
    setUploadError(null)
    resetRows()

    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data, meta }) => {
        const schemaColumns = schema.map((column) => column.name)
        const fileColumns = meta.fields ?? []
        const matchesSchema =
          fileColumns.length === schemaColumns.length &&
          fileColumns.every((column, index) => column === schemaColumns[index])

        if (!matchesSchema) {
          setUploadError(
            `CSV columns must exactly match the schema. Expected: ${schemaColumns.join(", ")}. Received: ${fileColumns.join(", ")}.`
          )
          setIsImporting(false)
          return
        }

        importRows(data)
        setIsImporting(false)
      },
      error: () => {
        setUploadError("The CSV could not be parsed. Check the file and try again.")
        setIsImporting(false)
      },
    })
  }

  return (
    <Step title="2. Import and review" description="Upload a CSV with headers matching the column names above.">
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm">
          <Upload className="size-4" />
          {isImporting ? "Importing..." : "Upload CSV"}
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            disabled={isImporting}
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null
              handleFileUpload(file)

              // reset for reupload
              event.target.value = ""
            }}
          />
        </label>
        <Button variant="outline" onClick={resetRows} disabled={!rows.length || isImporting} className="cursor-pointer">
          Clear rows
        </Button>
        <Button
          type="button"
          variant={showOnlyErrors ? "default" : "outline"}
          onClick={() => {
            setShowOnlyErrors((current) => !current)
            setEditingRowId(null)
            setPagination((current) => ({
              ...current,
              pageIndex: 0,
            }))
          }}
          className="cursor-pointer"
          disabled={!rows.length || isImporting}
        >
          {showOnlyErrors ? "Show all rows" : `Show error rows${invalidRowCount ? ` (${invalidRowCount})` : ""}`}
        </Button>
        <Button onClick={submitRows} disabled={!rows.length || isImporting} className="cursor-pointer">
          Submit
        </Button>
      </div>

      {isImporting && (
        <p className="mt-4 text-sm text-muted-foreground">
          Parsing CSV and validating rows...
        </p>
      )}

      {uploadError && (
        <div className="mt-4 rounded-2xl border border-destructive bg-destructive/5 p-3">
          <p className="text-sm font-medium text-destructive">Import failed</p>
          <p className="mt-1 text-sm text-destructive">{uploadError}</p>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="mt-4 rounded-2xl border px-5 py-10 text-center">
          <p className="text-sm font-medium">No data loaded yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Define the schema, then upload a CSV file to preview and edit it.
          </p>
        </div>
      ) : visibleRows.length === 0 ? (
        <div className="mt-4 rounded-2xl border px-5 py-10 text-center">
          <p className="text-sm font-medium">No error rows to display.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            All imported rows are currently valid. Switch back to the full table to review everything.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-4 overflow-hidden rounded-2xl border">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead className="bg-muted">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="border-b p-4 text-left text-sm"
                        >
                          {!header.isPlaceholder && flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="align-top">
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="border-b p-4"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 flex flex-row justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </p>
            <div className="flex items-center gap-2">
              <Button
                className="cursor-pointer"
                variant="outline"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                className="cursor-pointer"
                variant="outline"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </Step>
  )
}
