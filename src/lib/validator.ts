import type { DataTableColumn, DataTableRowErrors } from "@/types/DataTable.types"
import { z } from "zod"

/**
 * Create cell schema based on column definition
 */
const createCellSchema = (column: DataTableColumn) => {
  return z.string().superRefine((value, ctx) => {
    const trimmedValue = value.trim()

    if (!column.required && !trimmedValue.length) {
      return
    }

    if (column.required && !trimmedValue.length) {
      ctx.addIssue({
        code: 'custom',
        message: "This field is required.",
      })
      return
    }

    if (column.type === "number" && Number.isNaN(Number(trimmedValue))) {
      ctx.addIssue({
        code: 'custom',
        message: "Enter a valid number.",
      })
    }

    if (column.type === "date" && Number.isNaN(Date.parse(trimmedValue))) {
      ctx.addIssue({
        code: 'custom',
        message: "Enter a valid date.",
      })
    }

    if (column.regex.length) {
      try {
        const pattern = new RegExp(column.regex)
        if (!pattern.test(trimmedValue)) {
          ctx.addIssue({
            code: 'custom',
            message:
              column.regexMessage || "Value does not match the required pattern.",
          })
        }
      } catch {
        ctx.addIssue({
          code: 'custom',
          message: "Schema regex is invalid.",
        })
      }
    }
  })
}

/**
 * Validate a single row against the column definition and return the errors
 */
export const validateRow = (
  row: Record<string, string>,
  columns: DataTableColumn[]
): DataTableRowErrors => {
  const shape = Object.fromEntries(
    columns.map((column) => [column.name, createCellSchema(column)])
  )
  const result = z.object(shape).safeParse(row)

  if (result.success) {
    return {}
  }

  const errors: DataTableRowErrors = {}

  for (const issue of result.error.issues) {
    const fieldName = String(issue.path[0] ?? "")

    if (!errors[fieldName]) {
      errors[fieldName] = []
    }

    errors[fieldName].push(issue.message)
  }

  return errors
}

/**
 * Validate multiple rows against their definition and return a list of errors for each row
 */
export const validateRows = (
  rows: Record<string, string>[],
  columns: DataTableColumn[]
): DataTableRowErrors[] => {
  const errorsByRow = rows.map((row) => validateRow(row, columns))
  const uniqueColumns = columns.filter((column) => column.unique)

  for (const column of uniqueColumns) {
    const occurrences = new Map<string, number[]>()

    rows.forEach((row, index) => {
      const value = (row[column.name] ?? "")

      if (!value.length) {
        return
      }

      const matchingRows = occurrences.get(value) ?? []
      matchingRows.push(index)
      occurrences.set(value, matchingRows)
    })

    occurrences.forEach((indexes) => {
      if (indexes.length < 2) {
        return
      }

      indexes.forEach((index) => {
        const existingErrors = errorsByRow[index][column.name] ?? []

        // @todo check error codes rather than error message
        errorsByRow[index][column.name] = existingErrors.includes("Value must be unique.")
          ? existingErrors
          : [...existingErrors, "Value must be unique."]
      })
    })
  }

  return errorsByRow
}

/**
 * Clean up the row for submission
 */
export const sanitizeRow = (
  row: Record<string, string>,
  columns: DataTableColumn[]
): Record<string, string | number> => {
  return Object.fromEntries(
    columns.map((column) => {
      const rawValue = row[column.name] ?? ""
      const trimmedValue = rawValue.trim()

      if (column.type === "number" && trimmedValue.length > 0) {
        return [column.name, Number(trimmedValue)]
      }

      return [column.name, trimmedValue]
    })
  )
}
