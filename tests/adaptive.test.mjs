import test from 'node:test'
import assert from 'node:assert/strict'
import { addTime, categorizeError, conceptOrder, emptyProgress, masteryFor, recordAttempt, recordHint, recommend, setDifficultyOverride, statsFor, suggestedDifficulty } from '../src/adaptive.ts'
import { getLesson } from '../src/lessons.ts'
import { parseLearningData } from '../src/preferences.ts'

let sequence = 0
function attempt(conceptId = 'hello-python', passed = false, hintsUsed = 0, difficulty = 'guided', errorCategory = passed ? null : 'check') {
  return { id: `attempt-${++sequence}`, conceptId, exerciseId: `${conceptId}:${difficulty}:ocean:${sequence}`,  difficulty, passed, errorCategory, hintsUsed, at: sequence }
}
function add(progress, ...entries) { return entries.reduce(recordAttempt, progress) }

test('repeated failures lower mastery and recommend reinforcement', () => {
  const progress = add(emptyProgress(), attempt('hello-python'), attempt('hello-python'), attempt('hello-python'))
  assert.equal(statsFor(progress, 'hello-python').failures, 3)
  assert.equal(masteryFor(progress.attempts, 'hello-python'), 0)
  assert.match(recommend(progress).reason, /last two attempts/)
})
test('independent success earns more mastery than hinted success', () => {
  const independent = add(emptyProgress(), attempt('hello-python', true))
  const hinted = add(emptyProgress(), attempt('hello-python', true, 3))
  assert.ok(statsFor(independent, 'hello-python').mastery > statsFor(hinted, 'hello-python').mastery)
  assert.equal(independent.completedLessonIds[0], 'hello-python')
})
test('hint requests are counted and a hinted success remains successful', () => {
  let progress = emptyProgress()
  for (const level of [1, 2, 3]) progress = recordHint(progress, { conceptId: 'variables', exerciseId: 'variables:guided:ocean', level, at: level })
  progress = recordAttempt(progress, attempt('variables', true, 3))
  assert.equal(statsFor(progress, 'variables').hintsRequested, 3)
  assert.equal(statsFor(progress, 'variables').successes, 1)
  assert.ok(statsFor(progress, 'variables').mastery < 90)
})
test('several successes can raise difficulty, one success cannot', () => {
  let progress = add(emptyProgress(), attempt('loops', true))
  assert.equal(suggestedDifficulty(progress, 'loops'), 'guided')
  progress = add(progress, attempt('loops', true), attempt('loops', true))
  assert.equal(suggestedDifficulty(progress, 'loops'), 'independent')
  progress = add(progress, attempt('loops', true, 0, 'independent'), attempt('loops', true, 0, 'independent'))
  assert.equal(suggestedDifficulty(progress, 'loops'), 'challenge')
})
test('manual difficulty overrides recommendation and can be cleared', () => {
  const override = setDifficultyOverride(emptyProgress(), 'challenge')
  assert.equal(override.recommendation.difficulty, 'challenge')
  assert.equal(setDifficultyOverride(override, null).recommendation.difficulty, 'guided')
})
test('interest changes lesson context without changing progress or objective', () => {
  const progress = add(emptyProgress(), attempt('variables', true))
  const ocean = getLesson('variables', 'guided', 'ocean')
  const space = getLesson('variables', 'guided', 'space')
  assert.equal(ocean.objective, space.objective)
  assert.notEqual(ocean.expectedBehavior, space.expectedBehavior)
  assert.equal(progress.completedLessonIds.length, 1)
})
test('versioned progress survives refresh with draft and current lesson', () => {
  const initial = { ...add(emptyProgress(), attempt('hello-python', true)), currentLessonId: 'variables', drafts: { 'variables:guided:ocean': 'item = "dolphin"' } }
  const loaded = parseLearningData(JSON.stringify(initial))
  assert.equal(loaded.currentLessonId, 'variables')
  assert.equal(loaded.drafts['variables:guided:ocean'], 'item = "dolphin"')
  assert.equal(loaded.attempts.length, 1)
})
test('completed concepts can be revisited without losing their completion', () => {
  const progress = add(emptyProgress(), attempt('hello-python', true))
  const revisited = { ...progress, currentLessonId: 'hello-python' }
  assert.equal(revisited.completedLessonIds.includes('hello-python'), true)
  assert.equal(revisited.currentLessonId, 'hello-python')
})
test('invalid saved data recovers and legacy completions migrate safely', () => {
  assert.deepEqual(parseLearningData('{bad').completedLessonIds, [])
  const legacy = JSON.stringify({ currentLessonId: 'variables', completedLessonIds: ['hello-python', 'unknown'], drafts: { variables: 'x = 1' } })
  const migrated = parseLearningData(null, legacy)
  assert.deepEqual(migrated.completedLessonIds, ['hello-python'])
  assert.equal(migrated.drafts.variables, 'x = 1')
  assert.equal(parseLearningData(JSON.stringify({ version: 99 }), null).version, 1)
})
test('failed Python execution never counts as completion', () => {
  const progress = recordAttempt(emptyProgress(), attempt('conditions', false, 0, 'guided', 'syntax'))
  assert.equal(progress.completedLessonIds.length, 0)
  assert.equal(statsFor(progress, 'conditions').errorCategories.syntax, 1)
  assert.equal(categorizeError('SyntaxError: invalid syntax', false), 'syntax')
})
test('all 105 curated concept, level, and interest combinations have checks and three hints', () => {
  const interests = ['ocean', 'space', 'trains', 'animals', 'music', 'sports', 'custom']
  const levels = ['guided', 'independent', 'challenge']
  for (const concept of conceptOrder) for (const level of levels) for (const interest of interests) {
    const lesson = getLesson(concept, level, interest, 'origami')
    assert.equal(lesson.hints.length, 3)
    assert.match(lesson.checkSource, /def check\(/)
    assert.ok(lesson.starterCode.length)
    assert.ok(lesson.expectedBehavior.length)
  }
})
test('time is tracked but does not change mastery or difficulty', () => {
  const progress = add(emptyProgress(), attempt('functions', true))
  const later = addTime(progress, 'functions', 600000)
  assert.equal(statsFor(later, 'functions').timeSpentMs, 600000)
  assert.equal(statsFor(later, 'functions').mastery, statsFor(progress, 'functions').mastery)
  assert.equal(suggestedDifficulty(later, 'functions'), suggestedDifficulty(progress, 'functions'))
})

test('legacy Python validation accepts working solutions and rejects untouched starters for every introductory variant', async () => {
  const { spawnSync } = await import('node:child_process')
  const cases = []
  for (const concept of conceptOrder.slice(0, 5)) for (const level of ['guided', 'independent', 'challenge']) for (const interest of ['ocean', 'space', 'trains', 'animals', 'music', 'sports', 'custom']) {
    const lesson = getLesson(concept, level, interest, 'paper cranes')
    let solution = ''
    if (concept === 'hello-python') solution = lesson.expectedBehavior.split('\n').map((line) => `print(${JSON.stringify(line)})`).join('\n')
    if (concept === 'variables') solution = level === 'guided' ? `${lesson.starterCode}\nprint(item)` : level === 'independent' ? `${lesson.starterCode}\nprint(f"{item} in {place}")` : `${lesson.starterCode}\nvisits += 1\nprint(f"{item}: {visits} visits")`
    if (concept === 'conditions') {
      const subject = lesson.expectedBehavior.replace(/ is ready$| needs a guide$/, '')
      const signal = level === 'challenge' ? 3 : 1
      const expression = level === 'challenge' ? 'signal >= 3' : 'signal == 1'
      solution = `signal = ${signal}\nif ${expression}:\n    print(${JSON.stringify(lesson.expectedBehavior)})\nelse:\n    print(${JSON.stringify(`${subject} can wait`)})`
    }
    if (concept === 'loops') {
      const lines = lesson.expectedBehavior.split('\n')
      const printed = level === 'challenge' ? `print(f"${lines[0].slice(0, -1)}{n}")` : 'print(n)'
      solution = `for n in range(1, ${lines.length + 1}):\n    ${printed}`
    }
    if (concept === 'functions') {
      const names = lesson.expectedBehavior.split('\n').map((line) => line.slice(7, -1))
      solution = `def greet(name):\n    return f"Hello, {name}!"\n${names.map((name) => `print(greet(${JSON.stringify(name)}))`).join('\n')}`
    }
    cases.push({ id: lesson.exerciseId, starter: lesson.starterCode, solution, checkSource: lesson.checkSource })
  }
  const harness = `import sys,json,io,contextlib\ncases=json.load(sys.stdin)\nfailures=[]\nfor case in cases:\n    def run(source):\n        ns={}\n        stream=io.StringIO()\n        try:\n            with contextlib.redirect_stdout(stream): exec(source,ns)\n            checks={'learner_source':source}\n            exec(case['checkSource'],checks)\n            return bool(checks['check'](ns,stream.getvalue())[0])\n        except Exception as error:\n            failures.append(case['id']+': '+str(error))\n            return False\n    if run(case['starter']): failures.append(case['id']+': starter passed')\n    if not run(case['solution']): failures.append(case['id']+': solution failed')\nprint(json.dumps(failures))`
  const result = spawnSync('python3', ['-c', harness], { input: JSON.stringify(cases), encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout), [])
})

test('saved learning record reloads through localStorage', async () => {
  const { loadLessonProgress, saveLessonProgress } = await import('../src/preferences.ts')
  const values = new Map()
  const previous = globalThis.localStorage
  globalThis.localStorage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }
  try {
    const progress = { ...add(emptyProgress(), attempt('hello-python', true)), currentLessonId: 'variables', drafts: { 'variables:guided:ocean': 'item = "dolphin"' } }
    saveLessonProgress(progress)
    const reloaded = loadLessonProgress()
    assert.equal(reloaded.currentLessonId, 'variables')
    assert.equal(reloaded.drafts['variables:guided:ocean'], 'item = "dolphin"')
    assert.equal(reloaded.completedLessonIds[0], 'hello-python')
  } finally { globalThis.localStorage = previous }
})

test('a completed prerequisite makes the next concept eligible', () => {
  const progress = add(emptyProgress(), attempt('hello-python', true), attempt('variables', true))
  assert.equal(recommend(progress).conceptId, 'conditions')
  const struggling = add(progress, attempt('conditions'), attempt('conditions'))
  assert.equal(recommend(struggling).conceptId, 'conditions')
})


test('consistent success across concepts can suggest independent on a new concept', () => {
  const progress = add(emptyProgress(), attempt('hello-python', true), attempt('variables', true), attempt('conditions', true))
  assert.equal(recommend(progress).conceptId, 'loops')
  assert.equal(recommend(progress).difficulty, 'independent')
  const hinted = add(emptyProgress(), attempt('hello-python', true, 1), attempt('variables', true, 1), attempt('conditions', true))
  assert.equal(recommend(hinted).difficulty, 'guided')
})

test('first Print Statements challenge validates, completes the concept, and recommends Variables', async () => {
  const { spawnSync } = await import('node:child_process')
  const lesson = getLesson('hello-python', 'guided', 'ocean')
  const source = `print(${JSON.stringify(lesson.expectedBehavior)})`
  const harness = `import sys,json,io,contextlib,ast\ndata=json.load(sys.stdin)\nns={}\nout=io.StringIO()\nwith contextlib.redirect_stdout(out): exec(data['source'],ns)\nchecks={'learner_source':data['source']}\nexec(data['checkSource'],checks)\npassed,feedback=checks['check'](ns,out.getvalue())\nprint(json.dumps({'passed':passed,'feedback':feedback,'output':out.getvalue()}))`
  const result = spawnSync('python3', ['-c', harness], { input: JSON.stringify({ source, checkSource: lesson.checkSource }), encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  const validation = JSON.parse(result.stdout)
  assert.equal(validation.passed, true)
  let progress = recordAttempt(emptyProgress(), { ...attempt('hello-python', validation.passed), exerciseId: lesson.exerciseId })
  assert.deepEqual(progress.completedLessonIds, ['hello-python'])
  assert.equal(statsFor(progress, 'hello-python').successes, 1)
  assert.equal(progress.recommendation.conceptId, 'variables')
})

test('replaying a successfully completed exercise does not create duplicate mastery credit', () => {
  const successful = { ...attempt('hello-python', true), exerciseId: 'hello-python:guided:ocean' }
  const progress = recordAttempt(emptyProgress(), successful)
  const replay = recordAttempt(progress, { ...successful, id: 'replay', at: successful.at + 1 })
  assert.equal(replay, progress)
  assert.equal(replay.attempts.length, 1)
  assert.equal(statsFor(replay, 'hello-python').successes, 1)
  assert.equal(replay.completedExerciseIds.length, 1)
})

async function validateWithPython(lesson, source) {
  const { spawnSync } = await import('node:child_process')
  const harness = `import sys,json,io,contextlib\ndata=json.load(sys.stdin)\nns={}\nout=io.StringIO()\nwith contextlib.redirect_stdout(out): exec(data['source'],ns)\nchecks={'learner_source':data['source']}\nexec(data['checkSource'],checks)\npassed,feedback=checks['check'](ns,out.getvalue())\nprint(json.dumps({'passed':bool(passed),'feedback':str(feedback),'output':out.getvalue()}))`
  const result = spawnSync('python3', ['-c', harness], { input: JSON.stringify({ source, checkSource: lesson.checkSource }), encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  return JSON.parse(result.stdout)
}

test('Hello accepts the reported two-line output when the required line is present', async () => {
  const lesson = getLesson('hello-python', 'guided', 'custom', 'basketball')
  assert.equal(lesson.validationMode, 'required-line')
  const result = await validateWithPython(lesson, 'print("Hello, Python!")\nprint("Hello, basketball!")')
  assert.equal(result.output, 'Hello, Python!\nHello, basketball!\n')
  assert.equal(result.passed, true)
})

test('Hello accepts the required single line and trims trailing whitespace only', async () => {
  const lesson = getLesson('hello-python', 'guided', 'custom', 'basketball')
  const result = await validateWithPython(lesson, 'print("Hello, basketball!   ")')
  assert.equal(result.passed, true)
})

test('Hello rejects incorrect output with specific corrective feedback', async () => {
  const lesson = getLesson('hello-python', 'guided', 'custom', 'basketball')
  const result = await validateWithPython(lesson, 'print("Hello, Python!")')
  assert.equal(result.passed, false)
  assert.match(result.feedback, /Print the required message as its own output line/)
  assert.match(result.feedback, /Hello, basketball!/)
})

test('strict exact-output checks still reject extra lines in other lesson types', async () => {
  const lesson = getLesson('loops', 'guided', 'ocean')
  assert.equal(lesson.validationMode, 'exact-output')
  const result = await validateWithPython(lesson, 'for n in range(1, 4):\n    print(n)\nprint("extra")')
  assert.equal(result.passed, false)
})
