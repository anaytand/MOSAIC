import { spawnSync } from 'node:child_process'
import assert from 'node:assert/strict'
import { createPythonRunSource, pythonBootstrap } from '../src/pythonExecution.ts'
export function executePythonCases(cases) {
  const sources = cases.map(({ lesson, code, inputLines = lesson.defaultInputs ?? [] }) => createPythonRunSource(code, lesson.checkSource, inputLines))
  const harness = `import ast,json,sys\ndata=json.load(sys.stdin)\nnamespace={}\nexec(data['bootstrap'],namespace)\nresults=[]\nfor source in data['sources']:\n    tree=ast.parse(source)\n    last=tree.body.pop()\n    exec(compile(tree,'<worker-program>','exec'),namespace)\n    results.append(json.loads(eval(compile(ast.Expression(last.value),'<worker-result>','eval'),namespace)))\nprint(json.dumps(results))`
  const run = spawnSync('python3', ['-c', harness], { input: JSON.stringify({ bootstrap: pythonBootstrap, sources }), encoding: 'utf8', timeout: 5000, maxBuffer: 4_000_000 })
  assert.equal(run.status, 0, run.error?.message ?? run.stderr)
  return JSON.parse(run.stdout)
}
