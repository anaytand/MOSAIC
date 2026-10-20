import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { themeCatalog } from '../src/themes/catalog.ts'
import { createThemeLesson } from '../src/themes/lessons.ts'
import { createPythonRunSource, pythonBootstrap } from '../src/pythonExecution.ts'
import { parseProjectSnapshot } from '../src/themes/projects.ts'
import { lessonDraft, previousDrafts } from '../src/themes/drafts.ts'
import { emptyProgress, recordAttempt, statsFor } from '../src/adaptive.ts'
import { parseLearningData } from '../src/preferences.ts'
const ids = ['hello-python', 'variables', 'conditions', 'loops', 'functions']
const levels = ['guided', 'independent', 'challenge']
export function solve(theme, id, level) {
  const quote = JSON.stringify
  const [a, b, c, d, e, f] = theme.fields
  const assignments = theme.fields.map((field) => `${field.key} = ${field.key === c.key && level === 'challenge' ? `${field.value} + 0` : quote(field.value)}`).join('\n')
  if (id === 'hello-python') return theme.introduction.map((line) => `print(${quote(line)})`).join('\n')
  if (id === 'variables') return assignments + `\nprint(f"{${a.key}}: {${c.key}}")\nprint(f"{${b.key}}: {${d.key}}")\nprint(f"{${e.key}}: {${f.key}}")`
  if (id === 'conditions') return assignments + `\nif ${c.key} > ${d.key}:\n    status = ${quote(theme.decision.ready)}\nelse:\n    status = ${quote(theme.decision.wait)}\nprint(status)\n` + (level === 'challenge' ? `if ${f.key} >= 10:\n    goal_status = ${quote(theme.decision.extraReady)}\nelse:\n    goal_status = ${quote(theme.decision.extraWait)}\nprint(goal_status)` : '')
  const series = theme.series
  const seriesCode = `${series.key} = ${quote(series.values)}`
  if (id === 'loops') return level === 'guided' ? seriesCode + `\nfor value in ${series.key}:\n    print(value)` : seriesCode + `\n${series.totalKey} = 0\n${series.countKey} = 0\nfor value in ${series.key}:\n    ${series.totalKey} += value\n    if value > ${series.threshold}:\n        ${series.countKey} += 1\nprint(f"${series.totalLabel}: {${series.totalKey}}")` + (level === 'challenge' ? `\nprint(f"${series.countLabel}: {${series.countKey}}")` : '')
  return `${theme.calculator.inputKey ?? series.key} = ${quote(theme.calculator.values ?? series.values)}` + `\ndef ${theme.calculator.name}(values):\n` + (level === 'challenge' ? '    if not values:\n        return 0\n' : '') + `    return sum(values) / len(values)\nprint(f"${theme.calculator.label}: {${theme.calculator.name}(${theme.calculator.inputKey ?? series.key})}")`
}
export function executeCases(cases) {
  const sources = cases.map(({ lesson, code }) => createPythonRunSource(code, lesson.checkSource))
  const harness = `import ast,json,sys\ndata=json.load(sys.stdin)\nnamespace={}\nexec(data['bootstrap'],namespace)\nresults=[]\nfor source in data['sources']:\n    tree=ast.parse(source)\n    last=tree.body.pop()\n    exec(compile(tree,'<worker-program>','exec'),namespace)\n    results.append(json.loads(eval(compile(ast.Expression(last.value),'<worker-result>','eval'),namespace)))\nprint(json.dumps(results))`
  const run = spawnSync('python3', ['-c', harness], { input: JSON.stringify({ bootstrap: pythonBootstrap, sources }), encoding: 'utf8', timeout: 5000, maxBuffer: 4_000_000 })
  assert.equal(run.status, 0, run.stderr)
  return JSON.parse(run.stdout)
}

test('every available themed lesson runs through the actual worker Python program and checks real behavior', () => {
  const cases = []
  for (const theme of Object.values(themeCatalog)) for (const id of ids) for (const level of levels) {
    const lesson = createThemeLesson(theme, id, level)
    cases.push({ lesson, code: solve(theme, id, level), passes: true }, { lesson, code: lesson.starterCode, passes: false })
  }
  const results = executeCases(cases)
  results.forEach((result, index) => {
    assert.equal(result.passed, cases[index].passes, `${cases[index].lesson.exerciseId}: ${result.error || result.feedback}`)
    if (result.passed) assert.equal(result.error, '')
  })
})

test('basketball scoreboard is built from checked variables; failures and arbitrary output cannot produce a preview', () => {
  const theme = themeCatalog.basketball
  const lesson = createThemeLesson(theme, 'variables', 'guided')
  const [good, bad, spoof] = executeCases([{ lesson, code: solve(theme, 'variables', 'guided') }, { lesson, code: 'print("Mosaic Falcons: 24")' }, { lesson, code: 'print("{\\"team_score\\": 999}")' }])
  assert.equal(good.passed, true)
  const snapshot = parseProjectSnapshot(good.project, 'basketball')
  assert.equal(snapshot.values.team_score, 24)
  assert.equal(snapshot.values.opponent_score, 18)
  assert.equal(bad.project, null)
  assert.equal(spoof.project, null)
  assert.equal(parseProjectSnapshot({ ...good.project, values: { ...good.project.values, team_score: 999 } }), null)
})

test('theme progress and project snapshots reload without discarding historical progress', () => {
  let progress = recordAttempt(emptyProgress(), { id: 'theme-pass', conceptId: 'variables', exerciseId: 'journey-v1:basketball:variables:guided', difficulty: 'guided', passed: true, errorCategory: null, hintsUsed: 0, at: 1 })
  const theme = themeCatalog.basketball
  const snapshot = { version: 1, themeId: 'basketball', values: Object.fromEntries(theme.fields.map((field) => [field.key, field.value])) }
  progress = { ...progress, projectSnapshots: { basketball: snapshot } }
  const loaded = parseLearningData(JSON.stringify(progress))
  assert.equal(loaded.projectSnapshots.basketball.values.team_score, 24)
  assert.equal(statsFor(loaded, 'variables').mastery, statsFor(progress, 'variables').mastery)
})

test('a new themed draft does not silently replace or load legacy learner code', () => {
  const lesson = createThemeLesson(themeCatalog.basketball, 'variables', 'guided')
  const progress = { ...emptyProgress(), drafts: { variables: 'favorite = "basketball"', 'variables:guided:ocean': 'item = "dolphin"' } }
  assert.equal(lessonDraft(progress, lesson), lesson.starterCode)
  assert.equal(previousDrafts(progress, lesson).length, 2)
  assert.equal(progress.drafts.variables, 'favorite = "basketball"')
})

test('all six themes share the same objectives and keep concept mastery when switching', async () => {
  const { getLearningLesson } = await import('../src/lessons.ts')
  const { defaultPreferences } = await import('../src/preferences.ts')
  const baseline = recordAttempt(emptyProgress(), { id: 'known', conceptId: 'variables', exerciseId: 'journey-v1:basketball:variables:guided', difficulty: 'guided', passed: true, errorCategory: null, hintsUsed: 0, at: 1 })
  const before = JSON.stringify(baseline)
  for (const id of ids) {
    const objectives = new Set()
    for (const theme of Object.values(themeCatalog)) {
      const lesson = getLearningLesson(id, 'guided', { ...defaultPreferences, interest: theme.id })
      assert.equal(lesson.id, id)
      assert.equal(lesson.themeId, theme.id)
      objectives.add(lesson.objective)
    }
    assert.equal(objectives.size, 1)
  }
  assert.equal(JSON.stringify(baseline), before)
})

test('each theme supplies a valid preview contract with accessible light and dark colors', () => {
  const luminance = (hex) => { const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4); return v[0] * .2126 + v[1] * .7152 + v[2] * .0722 }
  const contrast = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((a, b) => a - b); return (y + .05) / (x + .05) }
  for (const theme of Object.values(themeCatalog)) {
    const palette = theme.palette
    assert.ok(contrast(palette.ink, palette.soft) >= 4.5, theme.id)
    assert.ok(contrast(palette.darkInk, palette.darkSoft) >= 4.5, theme.id)
    assert.ok(contrast(palette.accent, palette.soft) >= 4.5, `${theme.id} marker`)
    assert.ok(contrast(palette.darkAccent, palette.darkSoft) >= 4.5, `${theme.id} dark marker`)
    const snapshot = { version: 1, themeId: theme.id, values: Object.fromEntries(theme.fields.map((field) => [field.key, field.value])) }
    assert.ok(parseProjectSnapshot(snapshot))
  }
})

test('a hardcoded loop summary cannot pass without processing the supplied data', () => {
  const theme = themeCatalog.basketball
  const lesson = createThemeLesson(theme, 'loops', 'independent')
  const [result] = executeCases([{ lesson, code: 'game_scores = [24, 18, 30]\nseason_points = 72\nfor value in []:\n    pass\nprint("Season points: 72")' }])
  assert.equal(result.passed, false)
  assert.match(result.feedback, /values change/)
})

test('Python errors after output prevent completion and project generation', () => {
  const theme = themeCatalog.basketball
  const lesson = createThemeLesson(theme, 'variables', 'guided')
  const [result] = executeCases([{ lesson, code: solve(theme, 'variables', 'guided') + '\n1 / 0' }])
  assert.match(result.output, /Mosaic Falcons/)
  assert.match(result.error, /ZeroDivisionError/)
  assert.equal(result.passed, false)
  assert.equal(result.project, null)
})

test('long historical custom-topic draft keys remain intact during migration', () => {
  const key = `variables:guided:custom:${encodeURIComponent('海'.repeat(48))}`
  const progress = { ...emptyProgress(), drafts: { [key]: 'favorite_topic = "海"' } }
  assert.equal(parseLearningData(JSON.stringify(progress)).drafts[key], progress.drafts[key])
})
