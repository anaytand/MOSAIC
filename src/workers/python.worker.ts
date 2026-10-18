const pyodideVersion = '0.29.5'
const pyodideIndex = `https://cdn.jsdelivr.net/pyodide/v${pyodideVersion}/full/`
const pyodideEntry = `https://cdn.jsdelivr.net/pyodide/v${pyodideVersion}/full/pyodide.mjs`

interface RuntimeMessage {
  type: 'run'
  id: number
  code: string
  checkSource: string
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
      await pyodide.runPythonAsync(`
import builtins as _mosaic_builtins
_mosaic_safe_names = (
    "abs", "all", "any", "bool", "dict", "enumerate", "Exception", "filter",
    "float", "format", "int", "isinstance", "issubclass", "iter", "KeyError",
    "len", "list", "map", "max", "min", "NameError", "next", "NotImplementedError",
    "print", "range", "repr", "reversed", "round", "set", "slice", "sorted", "str",
    "sum", "tuple", "TypeError", "ValueError", "zip", "True", "False", "None"
)
_mosaic_safe_builtins = {name: getattr(_mosaic_builtins, name.strip()) for name in _mosaic_safe_names if hasattr(_mosaic_builtins, name.strip())}
`)
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
  const { id, code, checkSource } = event.data
  try {
    const pyodide = await loadRuntime()
    // Learner code receives only selected builtins. It never receives the page, app state, storage, or credentials.
    const result = await pyodide.runPythonAsync(`
import builtins as _b, contextlib, io, json, traceback, ast
_source = ${JSON.stringify(code)}
_check_source = ${JSON.stringify(checkSource)}
_output = io.StringIO()
_error = ""
_passed = False
_feedback = "Run the code and follow the lesson steps to check your work."
_learner_builtins = dict(_mosaic_safe_builtins)
_learner_builtins["__build_class__"] = _b.__build_class__
_namespace = {"__builtins__": _learner_builtins, "__name__": "__main__"}
_learner_exception = None
_trusted_compile = _b.compile
_trusted_exec = _b.exec
_blocked_builtin_names = ("__import__", "eval", "exec", "compile", "open", "input")
_original_builtins = {name: getattr(_b, name) for name in _blocked_builtin_names}
try:
    for _name in _blocked_builtin_names:
        setattr(_b, _name, None)
    with contextlib.redirect_stdout(_output), contextlib.redirect_stderr(_output):
        try:
            _trusted_exec(_trusted_compile(_source, "<learner>", "exec"), _namespace)
        except BaseException as _caught:
            _learner_exception = _caught
finally:
    for _name, _value in _original_builtins.items():
        setattr(_b, _name, _value)
if _learner_exception is not None:
    _error = "".join(traceback.format_exception(type(_learner_exception), _learner_exception, _learner_exception.__traceback__))
_captured = _output.getvalue()
if not _error:
    try:
        _check_namespace = {"__builtins__": _b.__dict__, "learner_source": _source, "ast": ast}
        exec(compile(_check_source, "<lesson-check>", "exec"), _check_namespace)
        _passed, _feedback = _check_namespace["check"](_namespace, _captured)
    except BaseException as _check_error:
        _error = "Lesson check error: " + str(_check_error)
json.dumps({"output": _captured, "error": _error, "passed": bool(_passed), "feedback": str(_feedback)})
`)
    emit({ type: 'result', id, result: String(result) })
  } catch (error) {
    emit({ type: 'failure', id, message: error instanceof Error ? error.message : 'Python could not start. Check your connection and try again.' })
  }
})

void loadRuntime().then(() => emit({ type: 'ready' })).catch((error: unknown) => {
  emit({ type: 'initialization-error', message: error instanceof Error ? error.message : 'Python could not start.' })
})
