import type { Difficulty, ExtendedConceptId, PythonLesson } from '../types.ts'
import type { LearningTheme } from './types.ts'
import { extendedContexts } from './extendedContent.ts'
const py = (value: unknown) => JSON.stringify(value)
const repr = (value: unknown): string => typeof value === 'string' ? `'${value.replaceAll("'", "\\'")}'` : Array.isArray(value) ? `[${value.map(repr).join(', ')}]` : value !== null && typeof value === 'object' ? `{${Object.entries(value).map(([key, item]) => `${repr(key)}: ${repr(item)}`).join(', ')}}` : String(value)
interface Case { args: unknown[]; expected: unknown }
function behaviorCheck(name: string, cases: Case[], expectedOutput: string, guidance: string, extra = ''): string {
  return `import ast, contextlib, io

def check(ns, output):
    fn = ns.get(${py(name)})
    if not callable(fn) or not any(isinstance(n, ast.FunctionDef) and n.name == ${py(name)} for n in ast.walk(ast.parse(learner_source))):
        return False, ${py(`Define ${name} with the parameters in the task.`)}
    ${extra || 'pass'}
    for args, expected in ${py(cases.map(item => [item.args, item.expected]))}:
        try:
            with contextlib.redirect_stdout(io.StringIO()):
                actual = fn(*args)
        except Exception as error:
            return False, "Your function stopped on another dataset: " + str(error)
        if actual != expected:
            return False, ${py(guidance)} + " Check the returned value for new input."
    normalized = "\\n".join(line.rstrip() for line in output.splitlines()).rstrip()
    if normalized != ${py(expectedOutput)}:
        return False, ${py(`The function checks passed. Now display the requested result exactly:\n${expectedOutput}`)}
    return True, "Your program produced the requested output and worked with other input data."
`
}
export function createExtendedLesson(theme: LearningTheme, id: ExtendedConceptId, difficulty: Difficulty): PythonLesson {
  const context = extendedContexts[theme.id]
  const guided = difficulty === 'guided'
  const challenge = difficulty === 'challenge'
  const chapter = theme.chapters[id]
  const base = { id, exerciseId: `journey-v1:${theme.id}:${id}:${difficulty}`, difficulty, interest: theme.id, themeId: theme.id, title: chapter.title, narrative: chapter.narrative, completionMessage: chapter.completion, validationMode: 'behavior' as const }
  const records = context.items.map((name,index) => ({ [context.nameKey]: name, [context.metricKey]: context.values[index] }))
  const alternate = [{ [context.nameKey]: 'New entry', [context.metricKey]: context.threshold + 3 }, { [context.nameKey]: 'Another entry', [context.metricKey]: 0 }]
  const recordCode = `records = ${py(records)}`
  const [firstName] = context.items
  const [firstValue] = context.values
  const named = context.nameKey, metric = context.metricKey
  const guide = (comment: string, body: string) => guided ? body : `    # ${comment}\n    pass`
  if (id === 'lists') {
    const expected = [...context.items, context.extra]
    const cases: Case[] = [{ args: [context.items, context.extra], expected }, { args: [['A','B'], 'C'], expected: ['A','B','C'] }, { args: [[], 'New'], expected: ['New'] }]
    if (challenge) cases.push({ args: [['A','B'], 'A'], expected: ['A','B'] })
    const task = `Write extend_collection(items, new_item). Return a new list with new_item at the end; keep the existing order.${challenge ? ' If new_item is already present, return the list without another copy.' : ''} Print the result for the supplied collection.`
    return { ...base, objective: 'Build and extend a Python list while preserving item order.', concept: 'Lists store ordered collections. list(items) makes a copy and append() adds one item.',
      challenge: task, instructions: [task, 'Use the supplied items and new_item in the final function call.', 'Return the list; then print the returned value.'],
      starterCode: `items = ${py(context.items)}\nnew_item = ${py(context.extra)}\ndef extend_collection(items, new_item):\n${guide('Return the extended list', '    updated = list(items)\n    # Add new_item to updated\n    return updated')}\n\nprint(extend_collection(items, new_item))`,
      sample: 'colors = ["blue", "gold"]\ncolors.append("teal")\nprint(colors)', expectedBehavior: repr(expected), hints: ['A list keeps its values in order.', challenge ? 'Check whether new_item is already in the list before appending.' : 'Make a copy, then call append(new_item) on the copy.', 'For another collection: snacks = ["apple"]; snacks.append("pear") adds one new value.'], checkSource: behaviorCheck('extend_collection', cases, repr(expected), 'Return the original items followed by the new item in the requested order.', `_list_fn = fn
    def checked_list(items, new_item):
        original = list(items)
        result = _list_fn(items, new_item)
        if items != original or result is items:
            raise ValueError("Return a new list without changing the original collection.")
        return result
    fn = checked_list`) }
  }
  if (id === 'strings') {
    const clean = (text: string) => (challenge ? text.trim().split(/\s+/).join(' ') : text.trim()).replace(/\b\w/g, c => c.toUpperCase()).replace(/\B[A-Z]/g,c=>c.toLowerCase())
    const expected = clean(context.rawLabel)
    const task = `Write clean_label(text). Remove outer spaces and use title case.${challenge ? ' Also collapse repeated spaces between words into one space.' : ''} Print the cleaned project label.`
    return { ...base, objective: 'Clean and format text with Python string methods.', concept: 'Strings hold text. strip() removes outer whitespace; title() makes title case. Methods return a new string.', challenge: task,
      instructions: [task, 'Return the new string from your function.', 'Your function must work with different labels too.'],
      starterCode: `raw_label = ${py(context.rawLabel)}\ndef clean_label(text):\n${guide('Return a cleaned title', '    # Use string methods on text\n    return text')}\n\nprint(clean_label(raw_label))`,
      sample: 'label = "  blue sky  "\nprint(label.strip().title())', expectedBehavior: expected, hints: ['Text methods create a transformed copy of a string.', challenge ? 'split() followed by " ".join(...) removes repeated spaces.' : 'Chain strip() and title() on the input string.', 'For another label: "  red kite  ".strip().title() becomes "Red Kite".'], checkSource: behaviorCheck('clean_label', [{ args: [context.rawLabel], expected }, { args: ['  bLuE sky  '], expected: 'Blue Sky' }, { args: [challenge ? ' a   new  label ' : ' another label '], expected: challenge ? 'A New Label' : 'Another Label' }], expected, 'Clean the supplied string instead of returning a fixed project name.') }
  }
  if (id === 'dictionaries') {
    const record = (name: string, value: number) => ({ [named]: name, [metric]: value, ...(challenge ? { status: value >= context.threshold ? 'selected' : 'standard' } : {}) })
    const expected = `${firstName}: ${firstValue}`
    const task = `Write make_record(name, value). Return a dictionary with keys ${py(named)} and ${py(metric)}.${challenge ? ` Also include status: "selected" when value is at least ${context.threshold}, otherwise "standard".` : ''} Print the supplied record as Name: Value.`
    return { ...base, objective: 'Use a dictionary to connect named fields with values.', concept: 'Dictionaries store key–value pairs. Read a field with record["key"]. A function can build a record from new data.', challenge: task,
      instructions: [task, 'Keep number values as numbers.', 'Return the dictionary before printing its fields in the main program.'],
      starterCode: `def make_record(name, value):\n${guide('Return a dictionary with the required fields', '    return {}')}\n\nrecord = make_record(${py(firstName)}, ${firstValue})\nprint(f"{record.get(${py(named)})}: {record.get(${py(metric)})}")`,
      sample: 'card = {"color": "teal", "count": 3}\nprint(card["color"])', expectedBehavior: expected, hints: ['Choose a key for each piece of information.', `Use the input name and value as the values of ${py(named)} and ${py(metric)}.`, 'For another record: {"city": city_name, "visits": visit_count} connects each label to its value.'], checkSource: behaviorCheck('make_record', [{ args: [firstName,firstValue], expected: record(firstName,firstValue) }, { args: ['New entry',0], expected: record('New entry',0) }, { args: ['Another entry',context.threshold+2], expected: record('Another entry',context.threshold+2) }], expected, 'Return a dictionary containing the required keys and the provided values.') }
  }
  if (id === 'user-input') {
    const expected = guided ? firstName : `${firstName}: ${firstValue}`
    const task = `Write read_entry(). Read ${named} with input().${guided ? ' Return the entered name.' : ` Then read ${metric} with input(), convert it using int(), and return a dictionary with keys ${py(named)} and ${py(metric)}.`}${challenge ? ' Trim/title-case the name and use 0 when the numeric input is invalid (catch ValueError).' : ''} Print the returned entry. Inputs are read from the editable queue below the editor.`
    const testInputs = guided ? [[firstName], ['New entry']] : [[firstName,String(firstValue)], ['Another Entry','7'], ...(challenge ? [['  new ENTRY  ','invalid']] : [])]
    const results = guided ? [firstName,'New entry'] : [{ [named]: firstName, [metric]: firstValue }, { [named]: 'Another Entry', [metric]: 7 }, ...(challenge ? [{ [named]: 'New Entry', [metric]: 0 }] : [])]
    return { ...base, objective: 'Read learner-supplied values with input() and use them in a program.', concept: 'input() returns text. MOSAIC supplies queued lines without blocking the page. Convert numeric text with int(); ValueError means the text is not a valid integer.', challenge: task,
      instructions: [task, 'Each input() call consumes one line from the queue.', 'Changing inputs should change the returned data. The checker also tries other queued values.'], defaultInputs: guided ? [firstName] : [firstName,String(firstValue)],
      starterCode: `def read_entry():\n${guide('Read and return the requested entry', `    name = input(${py(`${named}: `)})\n    ${guided ? 'return "Change this"' : '# Read the numeric field next\n    return {}'}`)}\n\nentry = read_entry()\n${guided ? 'print(entry)' : `print(f"{entry.get(${py(named)})}: {entry.get(${py(metric)})}")`}`,
      sample: 'visitor = input("Visitor name: ")\nprint(f"Welcome, {visitor}!")', expectedBehavior: expected, hints: ['Read a line using input() and keep its return value.', guided ? 'Return the name you read instead of a fixed message.' : 'Read the second line and pass it to int().', 'For another task: count = int(input("Tickets: ")) turns queued text "3" into the number 3.'],
      checkSource: `import contextlib, io, ast

def check(ns, output):
    fn = ns.get("read_entry")
    if not callable(fn) or not any(isinstance(n, ast.Call) and isinstance(n.func, ast.Name) and n.func.id == "input" for n in ast.walk(ast.parse(learner_source))):
        return False, "Define read_entry() and use input() to read queued values."
    original = ns["__builtins__"].get("input")
    try:
        for values, expected in ${py(testInputs.map((values,index)=>[values,results[index]]))}:
            queued = iter(values)
            ns["__builtins__"]["input"] = lambda prompt="": next(queued)
            with contextlib.redirect_stdout(io.StringIO()):
                actual = fn()
            if actual != expected:
                return False, "Read the queued values and return the requested entry; do not use a fixed name or number."
    except Exception as error:
        return False, "Check how read_entry() handles a different input: " + str(error)
    finally:
        ns["__builtins__"]["input"] = original
    if len(learner_inputs) < ${guided ? 1 : 2}:
        return False, "Provide one queued line for each input() call."
    actual_name = ${challenge ? 'learner_inputs[0].strip().title()' : 'learner_inputs[0]'}
    ${guided ? 'actual_expected = actual_name' : `try:
        actual_number = int(learner_inputs[1])
    except ValueError:
        actual_number = 0
    actual_expected = f"{actual_name}: {actual_number}"`}
    if output.rstrip() != actual_expected:
        return False, "Your function checks passed. Print the entry from your current input queue: " + actual_expected
    return True, "Your input function works with the supplied queue and other values."
` }
  }
  if (id === 'numbers') {
    const average = context.values.reduce((a,b)=>a+b,0)/3
    const expected = average.toFixed(2)
    const task = `Write calculate_average(values). Return the arithmetic mean rounded to two decimal places.${challenge ? ' Return 0 for an empty list.' : ''} Print the mean with exactly two decimal places.`
    return { ...base, objective: 'Calculate and round an average from numeric data.', concept: 'sum(values) totals numbers; len(values) counts them. / divides and round(value, 2) rounds to two decimals.', challenge: `${task} Data: ${context.metric.toLowerCase()}.`, instructions: [task, 'Use the list values; the checker tries other measurements.', 'Format the printed result with :.2f.'],
      starterCode: `values = ${py(context.values)}\ndef calculate_average(values):\n${guide('Return the rounded mean', '    return 0')}\n\nprint(f"{calculate_average(values):.2f}")`, sample: 'measurements = [2, 4, 6]\nprint(round(sum(measurements) / len(measurements), 2))', expectedBehavior: expected,
      hints: ['An average is the total divided by the number of values.', challenge ? 'Handle an empty list before dividing by len(values).' : 'Divide sum(values) by len(values), then round to two decimals.', 'For another dataset, [2, 4, 9] has mean 5.0; f"{mean:.2f}" displays 5.00.'], checkSource: behaviorCheck('calculate_average', [{ args:[context.values],expected:average },{ args:[[1,2,5]],expected:2.67 },{ args:[[7]],expected:7 },...(challenge ? [{ args:[[]],expected:0 }] : [])], expected, 'Calculate the rounded mean from the current list.') }
  }
  const makeReport = (data: Record<string,string|number>[]) => {
    const total = data.reduce((sum,record)=>sum+Number(record[metric]),0)
    const selected = data.filter(record=>Number(record[metric])>=context.threshold).map(record=>record[named])
    return id === 'combining-concepts' ? { total, selected, ...(challenge ? { average: data.length ? Math.round(total/data.length*100)/100 : 0 } : {}) } : { project: context.title, count: data.length, total, selected, ...(!guided ? { average: data.length ? Math.round(total/data.length*100)/100 : 0 } : {}), ...(challenge ? { maximum: data.length ? Math.max(...data.map(record=>Number(record[metric]))) : 0 } : {}) }
  }
  const final = id === 'final-project'
  const fn = final ? 'build_report' : 'analyze'
  const expectedReport = makeReport(records)
  const expected = final ? `${context.title}\nEntries: 3\nTotal: ${expectedReport.total}\nSelected: ${expectedReport.selected.join(', ')}` : `Total: ${expectedReport.total}\nSelected: ${expectedReport.selected.join(', ')}`
  const fields = `total (sum of ${metric}) and selected (names with ${metric} at least ${context.threshold}, in original order)${final ? `, project (${py(context.title)}), and count` : ''}${challenge || final && !guided ? ', average rounded to two decimals (0 for no records)' : ''}${final && challenge ? ', and maximum (0 for no records)' : ''}`
  const task = `Write ${fn}(records). Return a dictionary with ${fields}. Use a loop and a condition to process the records. Print the summary shown below.${final ? ' Keep the function reusable so you can revisit this project with new records.' : ''}`
  const starterBody = guided ? `    total = 0\n    selected = []\n    for record in records:\n        # Add this record's ${metric} and select qualifying ${named} values\n        pass\n    return {"total": total, "selected": selected${final ? `, "project": ${py(context.title)}, "count": 0` : ''}}` : `    # Build the requested report from records\n    pass`
  return { ...base, objective: final ? 'Build a reusable reporting program combining collections, conditions, loops, and functions.' : 'Combine dictionaries, loops, and conditions to analyze a collection.', concept: 'A list of dictionaries keeps related records together. A function can loop over records, total their values, and select names using a condition.', challenge: task,
    instructions: [chapter.narrative, task, `Every record has ${py(named)} and ${py(metric)}. The checker also supplies different records.${final ? ' Empty records must return zero totals and an empty selected list.' : ''}`],
    starterCode: `${recordCode}\ndef ${fn}(records):\n${starterBody}\n\nreport = ${fn}(records)\n${final ? `print(report["project"])\nprint(f"Entries: {report['count']}")\n` : ''}print(f"Total: {report['total']}")\nprint("Selected: " + ", ".join(report["selected"]))`,
    sample: 'def total_tickets(records):\n    total = 0\n    for record in records:\n        total += record["tickets"]\n    return total', expectedBehavior: expected,
    hints: ['Process each record inside a function and collect the requested results.', `Read record[${py(metric)}] for arithmetic and record[${py(named)}] for the selected names.`, 'For another report: for entry in records: followed by total += entry["tickets"] builds a total. Use a separate if block to append selected names.'],
    checkSource: behaviorCheck(fn, [{ args:[records],expected:expectedReport }, { args:[alternate],expected:makeReport(alternate) }, ...((final || challenge) ? [{ args:[[]],expected:makeReport([]) }] : [])], expected, 'Return every requested report field, calculated from the records.', `tree = ast.parse(learner_source)\n    if not any(isinstance(n, (ast.For, ast.ListComp)) for n in ast.walk(tree)) or not any(isinstance(n, (ast.If, ast.IfExp, ast.comprehension)) for n in ast.walk(tree)):\n        return False, "Use a loop and a condition to process the record collection."`) }
}
