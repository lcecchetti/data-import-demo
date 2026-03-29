import { DataTable } from "@/components/DataTable"
import { SchemaBuilder } from "@/components/SchemaBuilder"
import { Summary } from "@/components/Summary"
import { Intro } from "./components/Intro"

export function App() {
  return (
    <main className="flex flex-col gap-4 mx-auto w-full max-w-5xl p-4">
      <Intro />
      <SchemaBuilder />
      <Summary />
      <DataTable />
    </main>
  )
}

export default App
