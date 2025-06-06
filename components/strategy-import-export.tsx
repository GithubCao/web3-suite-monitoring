"use client"

import type React from "react"
import { useState, useCallback } from "react"

interface Strategy {
  name: string
  description: string
  // Add more properties as needed
}

const StrategyImportExport: React.FC = () => {
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [importError, setImportError] = useState<string | null>(null)

  const handleExport = useCallback(() => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(strategies))
    const downloadAnchorNode = document.createElement("a")
    downloadAnchorNode.setAttribute("href", dataStr)
    downloadAnchorNode.setAttribute("download", "strategies.json")
    document.body.appendChild(downloadAnchorNode) // required for firefox
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
  }, [strategies])

  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const jsonString = e.target?.result as string
        const parsedStrategies: Strategy[] = JSON.parse(jsonString)
        setStrategies(parsedStrategies)
        setImportError(null)
      } catch (error: any) {
        setImportError(`Error parsing JSON: ${error.message}`)
        console.error("JSON parsing error:", error)
      }
    }

    reader.onerror = () => {
      setImportError("Error reading file.")
      console.error("File reading error")
    }

    reader.readAsText(file)
  }, [])

  return (
    <div>
      <h2>Strategy Import/Export</h2>

      <div>
        <button onClick={handleExport}>Export Strategies</button>
      </div>

      <div>
        <label htmlFor="importStrategies">Import Strategies:</label>
        <input type="file" id="importStrategies" accept=".json" onChange={handleImport} />
        {importError && <p style={{ color: "red" }}>{importError}</p>}
      </div>

      {strategies.length > 0 && (
        <div>
          <h3>Imported Strategies:</h3>
          <ul>
            {strategies.map((strategy, index) => (
              <li key={index}>
                <strong>Name:</strong> {strategy.name}, <strong>Description:</strong> {strategy.description}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default StrategyImportExport
