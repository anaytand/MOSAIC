import { createExtendedLesson } from './extendedLessons.ts'
import { extendedIds } from './extendedContent.ts'
import type { ExtendedConceptId } from '../types.ts'
import type { ConceptId, IntroConceptId, Difficulty, PythonLesson } from '../types.ts'
import type { LearningTheme } from './types.ts'
const py = (value: unknown) => JSON.stringify(value)
const normalize = '"\\n".join(line.rstrip() for line in output.splitlines()).rstrip()'
const concepts: Record<IntroConceptId, string> = {
  'hello-python': 'print() displays text. Put your message inside quotes and parentheses.',
  variables: 'A variable gives a value a name. Store it with = and use the name again when you print.',
  conditions: 'if checks a condition. Its indented block runs when true; else handles the other cases.',
  loops: 'A for loop visits each item in a list. Its indented body repeats for every item.',
  functions: 'A function groups reusable instructions. Parameters let it work with new input, and return sends a result back.',
}
export function createThemeLesson(theme: LearningTheme, id: ConceptId, difficulty: Difficulty): PythonLesson {
  if (extendedIds.includes(id as ExtendedConceptId)) return createExtendedLesson(theme, id as ExtendedConceptId, difficulty)
  const introId = id as IntroConceptId
  const chapter = theme.chapters[id]
  const base = { id, exerciseId: `journey-v1:${theme.id}:${id}:${difficulty}`, difficulty, interest: theme.id,
    themeId: theme.id, narrative: chapter.narrative, completionMessage: chapter.completion, title: chapter.title, concept: concepts[introId] }
  const guided = difficulty === 'guided'
  const challenge = difficulty === 'challenge'
  const [name, peer, metric, peerMetric, person, stat] = theme.fields
  const assignments = theme.fields.map((field) => `${field.key} = ${py(field.value)}`).join('\n')
  if (id === 'hello-python') {
    const expected = theme.introduction.join('\n')
    const criteria = challenge ? `${normalize} == ${py(expected)}` : `all(line in [part.rstrip() for part in output.splitlines()] for line in ${py(theme.introduction)})`
    return { ...base, objective: 'Display a team or project introduction with print().', validationMode: challenge ? 'exact-output' : 'required-line',
      instructions: [`Display ${py(theme.introduction[0])} on one line.`, `Display ${py(theme.introduction[1])} on another line.`, challenge ? 'Match the two lines in order with no extra output.' : 'Extra output lines are welcome; keep each required message complete.'],
      sample: 'print("Mosaic Makers")\nprint("Ready to build!")', challenge: `Introduce the project by printing these two messages: ${theme.introduction.map(py).join(' and ')}.`,
      starterCode: guided ? `print(${py(theme.introduction[0])})\nprint("Add your welcome message")` : '# Introduce your project with two print() calls\n',
      hints: ['Each print() call can display a message on its own line.', `The first message names ${theme.introduction[0]}. Keep the spelling and punctuation shown in the task.`, 'For another project:\nprint("Mosaic Makers")\nprint("Ready to build!")'],
      expectedBehavior: expected, checkSource: `def check(ns, output):\n    passed = ${criteria}\n    return passed, ${py(`Include both complete lines shown in the task${challenge ? ', in order with no extra output' : ''}. Check spelling and punctuation.`)}` }
  }
  if (id === 'variables') {
    const expected = `${name.value}: ${metric.value}\n${peer.value}: ${peerMetric.value}\n${person.value}: ${stat.value}`
    const prints = `print(f"{${name.key}}: {${metric.key}}")\nprint(f"{${peer.key}}: {${peerMetric.key}}")\nprint(f"{${person.key}}: {${stat.key}}")`
    const starter = guided ? `${assignments.replace(`${metric.key} = ${metric.value}`, `${metric.key} = 0`)}\n\n${prints}` : `${name.key} = ${py(name.value)}\n${peer.key} = ${py(peer.value)}\n# Add the remaining variables and display three lines.\n`
    return { ...base, objective: 'Store project values in named variables and display a useful summary.', validationMode: 'exact-output',
      instructions: [`Use these variables: ${theme.fields.map((field) => `${field.key} = ${py(field.value)}`).join(', ')}.`, `Print the name and number for the project, its comparison, and ${person.value}, in that order.`, ...(challenge ? [`Calculate ${metric.key} with arithmetic rather than assigning the final number directly.`] : [])],
      sample: 'club = "Mosaic Makers"\npoints = 8\nprint(f"{club}: {points}")', challenge: `Build ${theme.projectName}. Store all six task values and print the three summary lines shown below${challenge ? '. Use arithmetic for the main numeric value' : ''}.`, starterCode: starter,
      hints: ['Names store text in quotes; numbers can be stored directly. You can use both in an f-string.', `Use print(f"{${name.key}}: {${metric.key}}") for the first summary line.`, 'For a different club:\nclub = "Mosaic Makers"\npoints = 4 * 2\nprint(f"{club}: {points}")'], expectedBehavior: expected,
      checkSource: `import ast\ndef check(ns, output):\n    expected = ${py(Object.fromEntries(theme.fields.map((field) => [field.key, field.value])))}\n    tree = ast.parse(learner_source)\n    values_match = all(type(ns.get(key)) is type(value) and ns.get(key) == value for key, value in expected.items())\n    used = {node.id for node in ast.walk(tree) if isinstance(node, ast.Name) and isinstance(node.ctx, ast.Load)}\n    arithmetic = ${challenge ? `any(isinstance(node, ast.Assign) and any(isinstance(t, ast.Name) and t.id == ${py(metric.key)} for t in node.targets) and isinstance(node.value, ast.BinOp) for node in ast.walk(tree))` : 'True'}\n    passed = values_match and set(expected).issubset(used) and arithmetic and ${normalize} == ${py(expected)}\n    if not passed:\n        return False, "Store all six named values, use those variables in the output, and match the three summary lines.${challenge ? ' Calculate the main number with arithmetic.' : ''}"\n    project = {"version": 1, "themeId": ${py(theme.id)}, "values": {key: ns[key] for key in expected}}\n    return True, "Your stored values and output match the project contract.", project` }
  }
  if (id === 'conditions') {
    const decision = theme.decision
    const expected = decision.ready + (challenge ? '\n' + decision.extraReady : '')
    const task = `If ${metric.key} is greater than ${peerMetric.key}, set status to ${py(decision.ready)}; otherwise use ${py(decision.wait)}.`
    return { ...base, objective: 'Choose a project decision with if and else, and test both paths.', validationMode: 'behavior',
      instructions: [task, 'Print status. The checker also tries different values to check both branches.', ...(challenge ? [`Also set goal_status to ${py(decision.extraReady)} when ${stat.key} is at least 10, or ${py(decision.extraWait)} otherwise. Print it on a second line.`] : [])],
      sample: 'if temperature > 20:\n    status = "Open the window"\nelse:\n    status = "Keep it closed"\nprint(status)', challenge: task + (challenge ? ` Add a second decision for ${stat.key} reaching 10.` : ' Print the decision.'),
      starterCode: `${assignments}\n\n${guided ? `if ${metric.key} > ${peerMetric.key}:\n    status = "Choose a decision"\nelse:\n    status = "Choose the other decision"\nprint(status)` : '# Write the decisions below.\n'}`,
      hints: ['An if/else chooses a different result for different input. A message that always prints will not handle both cases.', `Compare ${metric.key} > ${peerMetric.key}, then set status inside each indented branch.`, 'For a different task:\nif temperature > 20:\n    status = "Open"\nelse:\n    status = "Closed"\nprint(status)'], expectedBehavior: expected,
      checkSource: `import ast, io, contextlib\ndef check(ns, output):\n    if not any(isinstance(node, ast.If) and node.orelse for node in ast.walk(ast.parse(learner_source))):\n        return False, "Use an if statement with an else branch."\n    if ${normalize} != ${py(expected)}:\n        return False, "Print the decision or decisions shown for the starting values."\n    trials = [(24, 18, 12), (12, 18, 6), (18, 18, 12)]\n    for a, b, c in trials:\n        tree = ast.parse(learner_source)\n        replacements = {${py(metric.key)}: a, ${py(peerMetric.key)}: b, ${py(stat.key)}: c}\n        found = set()\n        for node in tree.body:\n            if isinstance(node, ast.Assign):\n                for target in node.targets:\n                    if isinstance(target, ast.Name) and target.id in replacements and target.id not in found:\n                        node.value = ast.Constant(value=replacements[target.id])\n                        found.add(target.id)\n        if not set(replacements).issubset(found):\n            return False, "Keep the named starting variables so both decision paths can be tested."\n        trial = {"__builtins__": ns["__builtins__"]}\n        try:\n            with contextlib.redirect_stdout(io.StringIO()):\n                exec(compile(ast.fix_missing_locations(tree), "<decision-test>", "exec"), trial)\n            if trial.get("status") != (${py(decision.ready)} if a > b else ${py(decision.wait)}):\n                return False, "Try values above, below, and equal to the comparison. The status should change correctly."\n            ${challenge ? `if trial.get("goal_status") != (${py(decision.extraReady)} if c >= 10 else ${py(decision.extraWait)}):\n                return False, "Check the second decision when the goal is reached and when it is not."` : ''}\n        except Exception:\n            return False, "Your decision should also work with different numeric values."\n    return True, "Both decision paths work."` }
  }
  const series = theme.series
  const seriesCode = `${series.key} = ${py(series.values)}`
  const total = series.values.reduce((sum, value) => sum + value, 0)
  if (id === 'loops') {
    const expected = guided ? series.values.join('\n') : `${series.totalLabel}: ${total}` + (challenge ? `\n${series.countLabel}: ${series.values.filter((value) => value > series.threshold).length}` : '')
    return { ...base, objective: 'Process a list of project observations using a for loop.', validationMode: 'exact-output',
      instructions: [`Use ${series.key} = ${py(series.values)}.`, guided ? 'Use a for loop to print each number on its own line.' : `Use a loop to add the values into ${series.totalKey}. Print ${py(series.totalLabel + ': ')} followed by the total.`, 'The checker also tries a different list to check that your loop processes its input.', ...(challenge ? [series.countTask, `Store the count in ${series.countKey} and print ${py(series.countLabel + ': ')} followed by the count.`] : [])],
      sample: 'numbers = [2, 4, 6]\nfor number in numbers:\n    print(number)', challenge: guided ? `Visit every value in ${series.key} with a for loop and print it.` : `Summarize ${series.key} using a loop${challenge ? ' and a condition' : ''}.`,
      starterCode: `${seriesCode}\n${guided ? 'for value in []:\n    print(value)' : `# Calculate ${series.totalKey}${challenge ? ' and ' + series.countKey : ''} with a loop.\n`}`,
      hints: ['A for loop repeats its body for every item in the list.', guided ? `Loop over ${series.key} rather than an empty list.` : `Set ${series.totalKey} = 0 before the loop; add each value inside it.`, 'For another list:\nnumbers = [2, 4, 6]\ntotal = 0\nfor number in numbers:\n    total += number\nprint(total)'], expectedBehavior: expected,
      checkSource: `import ast, io, contextlib\ndef check(ns, output):\n    has_loop = any(isinstance(node, ast.For) for node in ast.walk(ast.parse(learner_source)))\n    behavior = ${guided ? 'True' : `ns.get(${py(series.totalKey)}) == ${total}`} ${challenge ? `and ns.get(${py(series.countKey)}) == ${series.values.filter((v) => v > series.threshold).length}` : ''}\n    if not has_loop or not behavior or ${normalize} != ${py(expected)}:\n        return False, "Use a for loop, store any requested totals, and match the displayed summary."\n    tree = ast.parse(learner_source)\n    replacement = [${series.threshold}, ${series.threshold + 2}]\n    for node in tree.body:\n        if isinstance(node, ast.Assign) and any(isinstance(t, ast.Name) and t.id == ${py(series.key)} for t in node.targets):\n            node.value = ast.List(elts=[ast.Constant(value=value) for value in replacement], ctx=ast.Load())\n            break\n    else:\n        return False, "Keep the named list so its values can be tested."\n    trial = {"__builtins__": ns["__builtins__"]}\n    trial_output = io.StringIO()\n    try:\n        with contextlib.redirect_stdout(trial_output):\n            exec(compile(ast.fix_missing_locations(tree), "<loop-test>", "exec"), trial)\n        works = ${guided ? 'trial_output.getvalue().strip() == "\\n".join(str(value) for value in replacement)' : `trial.get(${py(series.totalKey)}) == sum(replacement)`} ${challenge ? `and trial.get(${py(series.countKey)}) == 1` : ''}\n    except Exception:\n        works = False\n    return works, "Loop over the supplied list so your code also works when its values change."` }
  }
  const fn = theme.calculator
  const calculatorValues = fn.values ?? series.values
  const calculatorKey = fn.inputKey ?? series.key
  const calculatorCode = `${calculatorKey} = ${py(calculatorValues)}`
  const average = calculatorValues.reduce((sum, value) => sum + value, 0) / calculatorValues.length
  const expected = `${fn.label}: ${average.toFixed(1)}`
  return { ...base, objective: 'Write and call a reusable function that calculates an average.', validationMode: 'behavior',
    instructions: [`Define ${fn.name}(values). Return sum(values) / len(values).`, `Print ${py(fn.label + ': ')} followed by a call with ${calculatorKey}.`, ...(challenge ? ['For an empty list, return 0 instead of dividing by zero.'] : [])],
    sample: 'def total_cost(prices):\n    return sum(prices)\nprint(total_cost([2, 4, 6]))', challenge: `Create ${fn.name}(values), reuse it for different lists, and print the project average${challenge ? '. Handle an empty list too' : ''}.`,
    starterCode: `${calculatorCode}\n${guided ? `def ${fn.name}(values):\n    return 0\n\nprint(f"${fn.label}: {${fn.name}(${calculatorKey})}")` : '# Define your reusable calculator, then call it.\n'}`,
    hints: ['An average is the total divided by the number of values. Return the result so other code can use it.', `Use the values parameter inside ${fn.name}; do not use only the original list.`, 'For a different calculation:\ndef total_cost(prices):\n    return sum(prices)\nprint(total_cost([2, 4, 6]))'], expectedBehavior: expected,
    checkSource: `import ast\ndef check(ns, output):\n    defined = any(isinstance(node, ast.FunctionDef) and node.name == ${py(fn.name)} for node in ast.walk(ast.parse(learner_source)))\n    function = ns.get(${py(fn.name)})\n    if not defined or not callable(function):\n        return False, ${py(`Define ${fn.name}(values) and return its calculated result.`)}\n    try:\n        works = function([10, 20]) == 15 and function([3, 6, 9, 12]) == 7.5 ${challenge ? 'and function([]) == 0' : ''}\n    except Exception:\n        works = False\n    return works and ${normalize} == ${py(expected)}, "Check your returned average with more than one list${challenge ? ', including an empty one' : ''}, then print the requested summary."` }
}
