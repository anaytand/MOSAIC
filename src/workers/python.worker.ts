import { createPythonRunSource, pythonBootstrap } from '../pythonExecution.ts'
const pyodideVersion = '0.29.5'
const pyodideIndex = `https://cdn.jsdelivr.net/pyodide/v${pyodideVersion}/full/`
const pyodideEntry = `https://cdn.jsdelivr.net/pyodide/v${pyodideVersion}/full/pyodide.mjs`

interface RuntimeMessage {
  type: 'run'
  id: number
  code: string
  checkSource: string
  inputLines?: string[]
}

interface PyodideRuntime {
  runPythonAsync: (code: string) => Promise<unknown>
  globals: { get: (name: string) => { toJs: () => unknown; destroy: () => void } }
}

let runtimePromise: Promise<PyodideRuntime> | undefined
const postMessageToApp = self.postMessage.bind(self)
const emit = (message: unknown) => postMessageToApp(message)

function removeWorkerCapabilities(): void {
  const workerGlobal = self as unknown as Record<string, unknown>
  for (const capability of ['fetch', 'importScripts', 'postMessage', 'close', 'Worker', 'SharedWorker', 'WebSocket', 'XMLHttpRequest', 'EventSource', 'indexedDB', 'caches', 'crypto', 'location', 'navigator', 'addEventListener', 'removeEventListener', 'dispatchEvent', 'onmessage', 'onmessageerror']) {
    try { Object.defineProperty(workerGlobal, capability, { value: undefined, configurable: false, writable: false }) } catch {
      try { workerGlobal[capability] = undefined } catch { /* This API is unavailable or read-only in this browser. */ }
    }
  }
}

async function loadRuntime(): Promise<PyodideRuntime> {
  if (!runtimePromise) {
    runtimePromise = (async () => {
      const pyodideUrl = pyodideEntry
      const pyodideModule = await import(/* @vite-ignore */ pyodideUrl) as { loadPyodide: (options: { indexURL: string }) => Promise<PyodideRuntime> }
      const pyodide = await pyodideModule.loadPyodide({ indexURL: pyodideIndex })
      await pyodide.runPythonAsync(pythonBootstrap)
      removeWorkerCapabilities()
      return pyodide
    })().catch((error: unknown) => {
      runtimePromise = undefined
      throw error
    })
  }
  return runtimePromise
}

self.addEventListener('message', async (event: MessageEvent<RuntimeMessage>) => {
  if (event.data.type !== 'run') return
  const { id, code, checkSource, inputLines } = event.data
  try {
    const pyodide = await loadRuntime()
    // Learner code receives only selected builtins. It never receives the page, app state, storage, or credentials.
    const result = await pyodide.runPythonAsync(createPythonRunSource(code, checkSource, inputLines))
    emit({ type: 'result', id, result: String(result) })
  } catch (error) {
    emit({ type: 'failure', id, message: error instanceof Error ? error.message : 'Python could not start. Check your connection and try again.' })
  }
})

void loadRuntime().then(() => emit({ type: 'ready' })).catch((error: unknown) => {
  emit({ type: 'initialization-error', message: error instanceof Error ? error.message : 'Python could not start.' })
})
