import z from "zod"

export const columnSchema = z.object({
  name: z
    .string()
    .min(1, "Field name is required.")
    .regex(
      /^[a-zA-Z][a-zA-Z0-9_]*$/,
      "Use letters, numbers, and underscores only."
    ),
  type: z.enum(["string", "number", "date"]),
  required: z.boolean(),
  unique: z.boolean(),
  regex: z.string(),
  regexMessage: z.string(),
})


export const columnsSchema = z.object({
  columns: z.array(columnSchema).superRefine((items, ctx) => {
    const names = new Set<string>()

    items.forEach((item, index) => {
      const key = item.name.trim().toLowerCase()

      // uniqueness on name
      if (names.has(key)) {
        ctx.addIssue({
          code: 'custom',
          path: [index, "name"],
          message: "Field names must be unique.",
        })
      }

      names.add(key)

      // regex patterns
      if (item.regex.trim().length > 0) {
        try {
          new RegExp(item.regex)
        } catch {
          ctx.addIssue({
            code: 'custom',
            path: [index, "regex"],
            message: "Enter a valid regex pattern.",
          })
        }
      }
    })
  }),
})
