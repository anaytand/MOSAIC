import test from 'node:test'
import assert from 'node:assert/strict'
import { executePythonCases } from './python-harness.mjs'
import { themeCatalog } from '../src/themes/catalog.ts'
import { extendedContexts, extendedIds } from '../src/themes/extendedContent.ts'
import { createThemeLesson } from '../src/themes/lessons.ts'
import { emptyProgress, conceptOrder, recordAttempt, statsFor, recommend } from '../src/adaptive.ts'
import { parseLearningData } from '../src/preferences.ts'
const levels = ['guided','independent','challenge']
function solution(theme, id, level) {
  const c = extendedContexts[theme.id], challenge = level === 'challenge', guided = level === 'guided'
  const q = JSON.stringify
  const records = c.items.map((name,i)=>({[c.nameKey]:name,[c.metricKey]:c.values[i]}))
  if(id==='lists') return `def extend_collection(items, new_item):\n    return list(items)${challenge ? ' if new_item in items else list(items)' : ''} + ${challenge ? '([] if new_item in items else [new_item])' : '[new_item]'}\nprint(extend_collection(${q(c.items)}, ${q(c.extra)}))`
  if(id==='strings') return `def clean_label(text):\n    return ${challenge ? '" ".join(text.split()).title()' : 'text.strip().title()'}\nprint(clean_label(${q(c.rawLabel)}))`
  if(id==='dictionaries') return `def make_record(name, value):\n    return {${q(c.nameKey)}: name, ${q(c.metricKey)}: value${challenge ? `, "status": "selected" if value >= ${c.threshold} else "standard"` : ''}}\nr=make_record(${q(c.items[0])},${c.values[0]})\nprint(f"{r[${q(c.nameKey)}]}: {r[${q(c.metricKey)}]}")`
  if(id==='user-input') return `def read_entry():\n    name = input("Name: ")${challenge ? '.strip().title()' : ''}\n${guided ? '    return name' : challenge ? `    try:\n        value = int(input("Value: "))\n    except ValueError:\n        value = 0\n    return {${q(c.nameKey)}: name, ${q(c.metricKey)}: value}` : `    value = int(input("Value: "))\n    return {${q(c.nameKey)}: name, ${q(c.metricKey)}: value}`}\nr=read_entry()\n${guided ? 'print(r)' : `print(f"{r[${q(c.nameKey)}]}: {r[${q(c.metricKey)}]}")`}`
  if(id==='numbers') return `def calculate_average(values):\n${challenge ? '    if not values:\n        return 0\n' : ''}    return round(sum(values)/len(values),2)\nprint(f"{calculate_average(${q(c.values)}):.2f}")`
  const final = id==='final-project', fn = final?'build_report':'analyze'
  return `def ${fn}(records):\n    total = 0\n    selected = []\n    for record in records:\n        total += record[${q(c.metricKey)}]\n        if record[${q(c.metricKey)}] >= ${c.threshold}:\n            selected.append(record[${q(c.nameKey)}])\n    return {"total":total,"selected":selected${final ? `,"project":${q(c.title)},"count":len(records)` : ''}${challenge || final&&!guided ? ',"average":round(total/len(records),2) if records else 0' : ''}${final&&challenge ? `,"maximum":max([r[${q(c.metricKey)}] for r in records]) if records else 0` : ''}}\nr=${fn}(${q(records)})\n${final ? 'print(r["project"])\nprint(f"Entries: {r[\'count\']}")\n' : ''}print(f"Total: {r['total']}")\nprint("Selected: " + ", ".join(r["selected"]))`
}
test('all 126 additional themed level variants execute and reject untouched starters', () => {
  const cases=[]
  for(const theme of Object.values(themeCatalog)) for(const id of extendedIds) for(const level of levels) {
    const lesson=createThemeLesson(theme,id,level)
    assert.equal(lesson.hints.length,3)
    assert.ok(lesson.narrative.length>20)
    cases.push({lesson,code:solution(theme,id,level),passed:true},{lesson,code:lesson.starterCode,passed:false})
  }
  const results=executePythonCases(cases)
  results.forEach((result,i)=>assert.equal(result.passed,cases[i].passed,`${cases[i].lesson.exerciseId}: ${result.error || result.feedback}`))
})
test('print-only answers and hardcoded final report functions cannot pass behavioral assessments', () => {
  const theme=themeCatalog.basketball
  const lesson=createThemeLesson(theme,'final-project','guided')
  const result=executePythonCases([{lesson,code:`print(${JSON.stringify(lesson.expectedBehavior)})`},{lesson,code:`def build_report(records):\n    for record in records:\n        if True:\n            pass\n    return {"project":"Mosaic Falcons statistics","count":3,"total":54,"selected":["Casey","Ari"]}\nr=build_report([])\nprint("Mosaic Falcons statistics")\nprint("Entries: 3")\nprint("Total: 54")\nprint("Selected: Casey, Ari")`}])
  assert.ok(result.every(r=>!r.passed))
})
test('real queued input is consumed, exhausted input errors, and user input failure is not completion', () => {
  const theme=themeCatalog.ocean,lesson=createThemeLesson(theme,'user-input','independent')
  const results=executePythonCases([{lesson,code:solution(theme,'user-input','independent')},{lesson,code:solution(theme,'user-input','independent'),inputLines:[]},{lesson,code:solution(theme,'user-input','independent'),inputLines:['Other site','5']}])
  assert.equal(results[0].passed,true)
  assert.match(results[1].error,/EOFError/)
  assert.equal(results[1].passed,false)
  assert.equal(results[2].output.trim(),'Other site: 5')
  assert.equal(results[2].passed,true) // actual input drives both execution and assessment
})
test('old five-lesson records, mastery, drafts, and hint history survive expansion to twelve lessons', () => {
  let progress=emptyProgress()
  for(const id of conceptOrder.slice(0,5)) progress=recordAttempt(progress,{id,conceptId:id,exerciseId:`journey-v1:basketball:${id}:guided`,difficulty:'guided',passed:true,errorCategory:null,hintsUsed:0,at:1})
  const legacy={...progress,drafts:{'journey-v1:basketball:functions:guided':'my saved code'},timeSpentMs:{'hello-python':20,variables:0,conditions:0,loops:0,functions:0}}
  delete legacy.inputDrafts
  const loaded=parseLearningData(JSON.stringify(legacy))
  assert.equal(conceptOrder.length,12)
  assert.equal(loaded.completedLessonIds.length,5)
  assert.equal(loaded.recommendation.conceptId,'lists')
  assert.equal(loaded.drafts['journey-v1:basketball:functions:guided'],'my saved code')
  assert.equal(statsFor(loaded,'functions').mastery,statsFor(progress,'functions').mastery)
  assert.equal(loaded.timeSpentMs['final-project'],0)
  assert.deepEqual(loaded.inputDrafts,{})
  assert.equal(recommend({...loaded,completedLessonIds:[...loaded.completedLessonIds,'lists']}).conceptId,'strings')
})
test('new lesson completion records once and queued-input drafts restore across refresh', () => {
  const attempt={id:'list-pass',conceptId:'lists',exerciseId:'journey-v1:ocean:lists:guided',difficulty:'guided',passed:true,errorCategory:null,hintsUsed:0,at:1}
  const progress=recordAttempt(emptyProgress(),attempt)
  assert.equal(recordAttempt(progress,attempt),progress)
  const loaded=parseLearningData(JSON.stringify({...progress,currentLessonId:'user-input',inputDrafts:{'journey-v1:ocean:user-input:guided':'Reef A'}}))
  assert.equal(loaded.currentLessonId,'user-input')
  assert.equal(loaded.inputDrafts['journey-v1:ocean:user-input:guided'],'Reef A')
  const other=createThemeLesson(themeCatalog.space,'lists','guided')
  assert.notEqual(other.narrative,createThemeLesson(themeCatalog.ocean,'lists','guided').narrative)
  assert.deepEqual(loaded.completedLessonIds,['lists'])
})


test('list challenges require a new collection instead of silently mutating the input', () => {
  const theme=themeCatalog.basketball,lesson=createThemeLesson(theme,'lists','guided'),c=extendedContexts.basketball
  const code=`def extend_collection(items,new_item):\n    items.append(new_item)\n    return items\nprint(extend_collection(${JSON.stringify(c.items)},${JSON.stringify(c.extra)}))`
  const [result]=executePythonCases([{lesson,code}])
  assert.equal(result.passed,false)
  assert.match(result.feedback,/new list/)
})
