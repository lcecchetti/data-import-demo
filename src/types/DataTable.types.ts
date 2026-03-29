import type { columnSchema } from "@/schema/columns.schema"
import type z from "zod"

export type DataTableColumn = z.infer<typeof columnSchema>

export type DataTableRowErrors = Record<string, string[]>

export type DataTableRow = {
  id: string
  values: Record<string, string>
  errors: DataTableRowErrors
  isValid: boolean
}
