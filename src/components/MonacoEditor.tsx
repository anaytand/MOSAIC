import { useEffect, useRef, useState } from 'react'

const monacoVersion = '0.57.0'
const monacoBaseUrl = `https://cdn.jsdelivr.net/npm/monaco-editor@${monacoVersion}/min/vs`

interface EditorInstance {
  getValue: () => string
  onDidChangeModelContent: (listener: () => void) => { dispose: () => void }
  updateOptions: (options: { fontSize?: number }) => void
  dispose: () => void
}

interface MonacoApi {
  editor: {
    create: (element: HTMLElement, options: Record<string, unknown>) => EditorInstance
    defineTheme: (name: string, theme: Record<string, unknown>) => void
    setTheme: (name: string) => void
  }
}

interface AmdRequire {
  (modules: string[], loaded: () => void, failed?: (error: unknown) => void): void
  config: (options: { paths: Record<string, string> }) => void
}

declare global {
  interface Window {
    require?: AmdRequire
    monaco?: MonacoApi
    MonacoEnvironment?: { getWorkerUrl: (moduleId: string, label: string) => string }
  }
}

let loaderPromise: Promise<MonacoApi> | undefined

function loadMonaco(): Promise<MonacoApi> {
  if (window.monaco) return Promise.resolve(window.monaco)
  if (!loaderPromise) {
    loaderPromise = new Promise<MonacoApi>((resolve, reject) => {
      const configure = () => {
        const amdRequire = window.require
        if (!amdRequire) { reject(new Error('Monaco loader did not initialize.')); return }
        window.MonacoEnvironment = {
          getWorkerUrl: () => `data:text/javascript;charset=utf-8,${encodeURIComponent(`self.MonacoEnvironment={baseUrl:'${monacoBaseUrl}'};importScripts('${monacoBaseUrl}/base/worker/workerMain.js');`)}`,
        }
        amdRequire.config({ paths: { vs: monacoBaseUrl } })
        amdRequire(['vs/editor/editor.main'], () => {
          const monaco = window.monaco
          if (!monaco) { reject(new Error('Monaco Editor did not finish loading.')); return }
          monaco.editor.defineTheme('mosaic-light', {
            base: 'vs', inherit: true, rules: [], colors: { 'editor.background': '#fbfdfb', 'editorLineNumber.foreground': '#8b9e9a', 'editorCursor.foreground': '#176f69', 'editor.selectionBackground': '#cde9df' },
          })
          monaco.editor.defineTheme('mosaic-dark', {
            base: 'vs-dark', inherit: true, rules: [], colors: { 'editor.background': '#122127', 'editorLineNumber.foreground': '#8aa09c', 'editorCursor.foreground': '#8bd8c9', 'editor.selectionBackground': '#27534c' },
          })
          monaco.editor.defineTheme('mosaic-light-high', {
            base: 'vs', inherit: true, rules: [], colors: { 'editor.background': '#ffffff', 'editor.foreground': '#071c22', 'editorLineNumber.foreground': '#354e52', 'editorLineNumber.activeForeground': '#071c22', 'editorCursor.foreground': '#004747', 'editor.selectionBackground': '#b8e0d7', 'editorLineHighlightBackground': '#eef6f3' },
          })
          monaco.editor.defineTheme('mosaic-dark-high', {
            base: 'vs-dark', inherit: true, rules: [], colors: { 'editor.background': '#050b0e', 'editor.foreground': '#ffffff', 'editorLineNumber.foreground': '#d0e0dc', 'editorLineNumber.activeForeground': '#ffffff', 'editorCursor.foreground': '#a8f1e3', 'editor.selectionBackground': '#245f56', 'editorLineHighlightBackground': '#13282a' },
          })
          resolve(monaco)
        }, reject)
      }
      if (window.require) { configure(); return }
      const existing = document.querySelector<HTMLScriptElement>('script[data-mosaic-monaco-loader]')
      if (existing) {
        existing.addEventListener('load', configure, { once: true })
        existing.addEventListener('error', () => { existing.remove(); reject(new Error('Monaco Editor could not load. Check your connection and retry.')) }, { once: true })
        return
      }
      const script = document.createElement('script')
      script.src = `${monacoBaseUrl}/loader.js`
      script.async = true
      script.dataset.mosaicMonacoLoader = 'true'
      script.onload = configure
      script.onerror = () => { script.remove(); reject(new Error('Monaco Editor could not load. Check your connection and retry.')) }
      document.head.append(script)
    }).catch((error: unknown) => {
      loaderPromise = undefined
      throw error
    })
  }
  return loaderPromise!
}

interface MonacoEditorProps {
  initialValue: string
  theme: 'light' | 'dark'
  highContrast: boolean
  fontSize: number
  onChange: (value: string) => void
  onError: (message: string | null) => void
  retryKey: number
}

export function MonacoEditor({ initialValue, theme, highContrast, fontSize, onChange, onError, retryKey }: MonacoEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<EditorInstance | null>(null)
  const changeRef = useRef(onChange)
  const errorRef = useRef(onError)
  const initialValueRef = useRef(initialValue)
  const optionsRef = useRef({ theme, highContrast, fontSize })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => { changeRef.current = onChange }, [onChange])
  useEffect(() => { errorRef.current = onError }, [onError])
  useEffect(() => { optionsRef.current = { theme, highContrast, fontSize } }, [fontSize, highContrast, theme])

  useEffect(() => {
    let disposed = false
    let subscription: { dispose: () => void } | undefined
    loadMonaco().then((monaco) => {
      if (disposed || !containerRef.current) return
      const editor = monaco.editor.create(containerRef.current, {
        value: initialValueRef.current,
        language: 'python',
        theme: optionsRef.current.theme === 'dark' ? optionsRef.current.highContrast ? 'mosaic-dark-high' : 'mosaic-dark' : optionsRef.current.highContrast ? 'mosaic-light-high' : 'mosaic-light',
        fontSize: optionsRef.current.fontSize,
        fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', monospace",
        automaticLayout: true,
        accessibilitySupport: 'on',
        ariaLabel: 'Python code editor. Use arrow keys to move through lines and type to edit your code.',
        lineNumbers: 'on',
        minimap: { enabled: false },
        folding: false,
        scrollBeyondLastLine: false,
        tabSize: 4,
        insertSpaces: true,
        autoIndent: 'full',
        autoClosingBrackets: 'always',
        autoClosingQuotes: 'always',
        bracketPairColorization: { enabled: true },
        wordWrap: 'on',
        smoothScrolling: false,
        renderLineHighlight: 'line',
        padding: { top: 16, bottom: 16 },
      })
      editorRef.current = editor
      subscription = editor.onDidChangeModelContent(() => changeRef.current(editor.getValue()))
      setLoaded(true)
      errorRef.current(null)
    }).catch((error: unknown) => {
      if (!disposed) errorRef.current(error instanceof Error ? error.message : 'Monaco Editor could not load.')
    })
    return () => {
      disposed = true
      subscription?.dispose()
      editorRef.current?.dispose()
      editorRef.current = null
    }
  }, [retryKey])

  useEffect(() => {
    editorRef.current?.updateOptions({ fontSize })
    if (window.monaco) window.monaco.editor.setTheme(theme === 'dark' ? highContrast ? 'mosaic-dark-high' : 'mosaic-dark' : highContrast ? 'mosaic-light-high' : 'mosaic-light')
  }, [fontSize, highContrast, theme])

  return <div className={`monaco-holder${loaded ? ' is-loaded' : ''}`}><div className="monaco-container" ref={containerRef} /><span className="monaco-loading" aria-live="polite">Loading Monaco Python editor…</span></div>
}
