import { useEffect, type PropsWithChildren } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Trash } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useImportContext } from "@/context/Import.context"
import { Step } from "@/components/Step"
import { columnsSchema } from "@/schema/columns.schema"
import type { DataTableColumn } from "@/types/DataTable.types"
import { toast } from "sonner"

type SchemaBuilderFieldProps = PropsWithChildren & {
  label: string
}

const SchemaBuilderField = ({ label, children }: SchemaBuilderFieldProps) => (
  <div className="flex flex-col gap-2">
    <label className="text-xs text-muted-foreground">{label}</label>
    {children}
  </div>
)

type FormValues = { columns: DataTableColumn[] }

export const SchemaBuilder = () => {
  const { schema, setSchema } = useImportContext()

  const form = useForm<FormValues>({
    resolver: zodResolver(columnsSchema),
    defaultValues: {
      columns: schema,
    },
    mode: "onChange",
  })
  const { control, register, handleSubmit, reset, setError, clearErrors, formState } =
    form

  const { fields, append, remove } = useFieldArray({
    control,
    name: "columns",
  })

  useEffect(() => {
    reset({ columns: schema })
  }, [schema, reset])

  const onSubmit = (values: FormValues) => {
    clearErrors()

    const { error, success, data } = columnsSchema.safeParse(values)

    if (!success) {
      for (const issue of error.issues) {
        const index = Number(issue.path[0])
        const fieldName = String(issue.path[1] ?? "name") as keyof DataTableColumn

        setError(`columns.${index}.${fieldName}`, {
          message: issue.message,
        })
      }

      return
    }

    setSchema(data.columns)
    toast("Schema applied", {
      description: "CSV preview cleared and validation rules updated.",
    })
  }

  return (
    <Step title="1. Define your schema" description="Set the CSV columns and the validation that will be applied to every row.">
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        {fields.map((column, index) => {
          const errors = formState.errors.columns?.[index]

          return (
            <div
              key={column.id}
              className="grid gap-4 rounded-2xl border p-4 md:grid-cols-5 relative pr-12"
            >
              <SchemaBuilderField label="Column name">
                <Input
                  placeholder="e.g. name"
                  {...register(`columns.${index}.name`)}
                  aria-invalid={!!errors?.name}
                />
                {errors?.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </SchemaBuilderField>

              <SchemaBuilderField label="Type">
                <Select
                  defaultValue={column.type}
                  onValueChange={(value) =>
                    form.setValue(`columns.${index}.type`, value as DataTableColumn["type"])
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">String</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                  </SelectContent>
                </Select>
              </SchemaBuilderField>

              <SchemaBuilderField label="Regex pattern">
                <Input
                  placeholder="^\d{1,3}$"
                  {...register(`columns.${index}.regex`)}
                  aria-invalid={!!errors?.regex}
                />
                {!!errors?.regex && (
                  <p className="text-xs text-destructive">{errors.regex.message}</p>
                )}
              </SchemaBuilderField>

              <SchemaBuilderField label="Custom error message">
                <Input
                  placeholder="Message shown when the regex check fails"
                  {...register(`columns.${index}.regexMessage`)}
                />
              </SchemaBuilderField>

              <div className="flex gap-8">
                <SchemaBuilderField label="Required">
                  <label className="flex h-8 items-center gap-2 rounded-lg text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      className="size-4 accent-primary"
                      {...register(`columns.${index}.required`)}
                    />
                    Yes
                  </label>
                </SchemaBuilderField>

                <SchemaBuilderField label="Unique">
                  <label className="flex h-8 items-center gap-2 rounded-lg text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      className="size-4 accent-primary"
                      {...register(`columns.${index}.unique`)}
                    />
                    Yes
                  </label>
                </SchemaBuilderField>
              </div>

              <div className="absolute right-2 top-2">
                <Button
                  className="cursor-pointer"
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                >
                  <Trash />
                </Button>
              </div>
            </div>
          )
        })}

        <Button
          className="cursor-pointer"
          type="button"
          variant="outline"
          onClick={() =>
            append({
              name: "",
              type: "string",
              required: false,
              unique: false,
              regex: "",
              regexMessage: "",
            })
          }
        >
          <Plus />
          Add field
        </Button>

        <div className="flex items-center justify-between rounded-2xl bg-muted p-4">
          <p className="text-sm text-muted-foreground">
            Applying a new schema clears the current CSV.
          </p>
          <Button type="submit" className="cursor-pointer">Apply schema</Button>
        </div>
      </form>
    </Step>
  )
}
