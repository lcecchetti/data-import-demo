import { AlertCircle, CheckCircle, FileWarning } from "lucide-react"

import { useImportContext } from "@/context/Import.context.tsx"
import { useMemo } from "react";

export const Summary = () => {
  const { rows, schema } = useImportContext()

  const invalidRows = useMemo(() => rows.filter((row) => !row.isValid), [rows]);

  const stats = useMemo(() => ([
    {
      label: "Columns",
      value: schema.length,
      icon: FileWarning,
    },
    {
      label: "Invalid rows",
      value: invalidRows.length,
      icon: AlertCircle,
    },
    {
      label: "Valid rows",
      value: rows.length - invalidRows.length,
      icon: CheckCircle,
    },
  ]), [schema, rows.length, invalidRows.length])

  return (
    <section className="grid gap-3 md:grid-cols-3">
      {stats.map((item, index) => (
        <div
          key={index}
          className="rounded-2xl border border-border p-4"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <item.icon className="size-4" />
            {item.label}
          </div>
          <p className="mt-3 text-2xl font-semibold">{item.value}</p>
        </div>
      ))}
    </section>
  )
}
