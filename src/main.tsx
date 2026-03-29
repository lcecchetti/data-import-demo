import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App.tsx"
import { ImportProvider } from "@/context/Import.context.tsx"
import { Toaster } from "@/components/ui/sonner"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ImportProvider>
      <App />
      <Toaster richColors />
    </ImportProvider>
  </StrictMode>
)
