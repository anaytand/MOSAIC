import type { ConceptId, Difficulty, Interest, PythonLesson } from './types.ts'

interface Context { subject: string; plural: string; place: string }
const contexts: Record<Exclude<Interest, 'custom'>, Context> = {
  ocean: { subject: 'dolphin', plural: 'coral reefs', place: 'ocean' },
  space: { subject: 'planet', plural: 'moons', place: 'space' },
  trains: { subject: 'train', plural: 'stations', place: 'railway' },
  animals: { subject: 'fox', plural: 'habitats', place: 'forest' },
  music: { subject: 'song', plural: 'instruments', place: 'studio' },
  sports: { subject: 'team', plural: 'matches', place: 'stadium' },
}
const names: Record<ConceptId, string> = { 'hello-python': 'Hello, Python!', variables: 'Variables', conditions: 'Conditions', loops: 'Loops', functions: 'Functions' }
const objectives: Record<ConceptId, string> = {
  'hello-python': 'Use print() to display a message in the console.', variables: 'Store values in variables and use them in output.',
  conditions: 'Use if and else to choose an action.', loops: 'Use a for loop to repeat instructions.', functions: 'Define and call a function with a parameter.',
}
const concepts: Record<ConceptId, string> = {
  'hello-python': 'print() sends text to the console. Text goes inside quotation marks.',
  variables: 'A variable gives a value a name. Use = to store it and the name to read it.',
  conditions: 'An if statement checks a condition; else handles the other path. Indent each path.',
  loops: 'A for loop runs its indented body once for each item in a sequence.',
  functions: 'A function is reusable code. A parameter lets each call use different information.',
}
const quote = (value: string) => JSON.stringify(value)
const exactOutputCheck = (expected: string, required: string, feedback: string) => `import ast\ndef check(ns, output):\n    tree = ast.parse(learner_source)\n    has_required = any(isinstance(node, ast.${required}) for node in ast.walk(tree))\n    normalized = "\\n".join(line.rstrip() for line in output.splitlines()).rstrip()\n    return (has_required and normalized == ${quote(expected)}, ${quote(feedback)})`
const requiredLineCheck = (expected: string) => `def check(ns, output):\n    lines = [line.rstrip() for line in output.splitlines()]\n    if ${quote(expected)} in lines:\n        return True, ${quote(`The required line “${expected}” was printed.`)}\n    return False, ${quote(`Print the required message as its own output line: “${expected}”. Check the capitalization, spelling, and punctuation.`)}`
const loopCheck = (expected: string) => `import ast\ndef check(ns, output):\n    tree = ast.parse(learner_source)\n    loop_prints = any(isinstance(node, ast.For) and any(isinstance(child, ast.Call) and isinstance(child.func, ast.Name) and child.func.id == "print" for statement in node.body for child in ast.walk(statement)) for node in ast.walk(tree))\n    normalized = "\\n".join(line.rstrip() for line in output.splitlines()).rstrip()\n    return (loop_prints and normalized == ${quote(expected)}, "Put a print() call inside a for loop to produce each requested line.")`

function makeLesson(id: ConceptId, difficulty: Difficulty, interest: Interest, customTopic = ''): PythonLesson {
  const context = interest === 'custom' ? { subject: customTopic.trim().slice(0, 48) || 'project', plural: 'ideas', place: 'your topic' } : contexts[interest]
  const { subject, plural, place } = context
  const base = { id, exerciseId: `${id}:${difficulty}:${interest}${interest === 'custom' ? ':' + encodeURIComponent(context.subject) : ''}`, difficulty, interest, validationMode: id === 'variables' || id === 'loops' ? 'exact-output' as const : 'behavior' as const, title: names[id], objective: objectives[id], concept: concepts[id] }
  if (id === 'hello-python') {
    const message = difficulty === 'guided' ? `Hello, ${subject}!` : difficulty === 'independent' ? `Welcome to ${place}!` : `Exploring ${place}\nFound a ${subject}`
    return { ...base, validationMode: difficulty === 'challenge' ? 'exact-output' : 'required-line', instructions: difficulty === 'guided' ? ['Keep the print() call.', `Change the words inside the quotes to ${message}.`, 'Run your code and read the output.'] : difficulty === 'independent' ? [`Write a print() call that displays ${message}.`, 'Run it and compare the output.'] : ['Display the two requested lines in order.', 'Use Python print() calls.'],
      sample: 'print("A message appears here")', challenge: difficulty === 'challenge' ? `Print two lines: “Exploring ${place}” then “Found a ${subject}”.` : `Print this message on its own output line: ${message}`,
      starterCode: difficulty === 'guided' ? 'print("Change this message")' : difficulty === 'independent' ? '# Write a print() call below\n' : '# Display both lines below\n',
      hints: ['print() displays text in the console.', difficulty === 'challenge' ? 'Use one print() call for each line.' : 'Put the exact message between quotation marks inside print().', 'For example, print("Hello, fox!") displays Hello, fox!'], expectedBehavior: message, checkSource: difficulty === 'challenge' ? exactOutputCheck(message, 'Call', `Print the two requested lines exactly: ${message}`) : requiredLineCheck(message) }
  }
  if (id === 'variables') {
    const expected = difficulty === 'guided' ? subject : difficulty === 'independent' ? `${subject} in ${place}` : `${subject}: 3 visits`
    const starterCode = difficulty === 'guided' ? `item = ${quote(subject)}\n# Print item below\n` : difficulty === 'independent' ? `item = ${quote(subject)}\nplace = ${quote(place)}\n# Print both values on one line\n` : `item = ${quote(subject)}\nvisits = 2\n# Update visits and print the result\n`
    const checkSource = difficulty === 'guided' ? `import ast\ndef check(ns, output):\n    tree = ast.parse(learner_source)\n    assigned = any(isinstance(n, ast.Assign) for n in ast.walk(tree))\n    used = any(isinstance(n, ast.Name) and n.id == "item" and isinstance(n.ctx, ast.Load) for n in ast.walk(tree))\n    return (assigned and used and ns.get("item") == ${quote(subject)} and output.strip() == ${quote(expected)}, "Store the item in a variable and print that variable.")` : difficulty === 'independent' ? `import ast\ndef check(ns, output):\n    tree = ast.parse(learner_source)\n    names = {t.id for n in ast.walk(tree) if isinstance(n, ast.Assign) for t in n.targets if isinstance(t, ast.Name)}\n    return ({"item", "place"}.issubset(names) and ns.get("item") == ${quote(subject)} and ns.get("place") == ${quote(place)} and all(any(isinstance(n, ast.Name) and n.id == name and isinstance(n.ctx, ast.Load) for n in ast.walk(tree)) for name in ("item", "place")) and output.strip() == ${quote(expected)}, "Use both variable values in one printed line.")` : `import ast\ndef check(ns, output):\n    tree = ast.parse(learner_source)\n    changed = any(isinstance(n, (ast.AugAssign, ast.BinOp)) for n in ast.walk(tree))\n    return (changed and ns.get("visits") == 3 and output.strip() == ${quote(expected)}, "Add one visit to the variable, then print the item and total.")`
    return { ...base, instructions: difficulty === 'guided' ? ['Read the item stored in the variable.', 'Print the variable named item.'] : difficulty === 'independent' ? ['Use item and place in one printed line.', `Make the output exactly “${expected}”.`] : ['Increase visits by one using arithmetic.', `Print “${expected}” using your variables.`], sample: `item = ${quote(subject)}\nprint(item)`, challenge: `Produce exactly: ${expected}`, starterCode,
      hints: ['Variables let you reuse stored values.', difficulty === 'challenge' ? 'Update visits before printing it.' : 'Pass the variable names to print() or use an f-string.', 'For example, color = "teal" followed by print(color) displays teal.'], expectedBehavior: expected, checkSource }
  }
  if (id === 'conditions') {
    const signal = difficulty === 'challenge' ? 3 : 1
    const expected = difficulty === 'challenge' ? `${subject} needs a guide` : `${subject} is ready`
    const other = `${subject} can wait`
    const comparator = difficulty === 'challenge' ? 'signal >= 3' : 'signal == 1'
    const starterCode = difficulty === 'guided' ? `signal = 1\nif signal == 1:\n    print("Change this")\nelse:\n    print("Change this too")` : difficulty === 'independent' ? `signal = 1\n# Use if and else to print the right message\n` : `signal = 3\n# Print a guide message when signal is at least 3; otherwise print a waiting message\n`
    const checkSource = `import ast, io, contextlib\ndef check(ns, output):\n    tree = ast.parse(learner_source)\n    branches = [n for n in ast.walk(tree) if isinstance(n, ast.If) and n.orelse]\n    if not branches or output.strip() != ${quote(expected)}:\n        return False, ${quote(`Use if and else. For this signal, print ${expected}.`)}\n    for node in tree.body:\n        if isinstance(node, ast.Assign) and any(isinstance(t, ast.Name) and t.id == "signal" for t in node.targets):\n            node.value = ast.Constant(value=${difficulty === 'challenge' ? '1' : '0'})\n            break\n    else:\n        return False, "Set signal to the starting value shown in the challenge."\n    alternate_output = io.StringIO()\n    with contextlib.redirect_stdout(alternate_output):\n        exec(compile(ast.fix_missing_locations(tree), "<alternate-check>", "exec"), {"__builtins__": ns["__builtins__"]})\n    return alternate_output.getvalue().strip() == ${quote(other)}, ${quote(`Check both branches: the other signal should print ${other}.`)}`
    return { ...base, instructions: difficulty === 'guided' ? [`When signal is 1, print “${expected}”.`, `Otherwise print “${other}”.`] : difficulty === 'independent' ? ['Write your own if/else statement for signal.', `Print “${expected}” when signal is 1; otherwise print “${other}”.`] : [`Use ${comparator} to choose the first message.`, `Print “${expected}” for the given signal and “${other}” otherwise.`], sample: 'if count == 1:\n    print("Ready")\nelse:\n    print("Wait")', challenge: `For signal = ${signal}, print exactly: ${expected}`, starterCode,
      hints: ['if chooses one path; else handles the remaining path.', `Write if ${comparator}: and indent print(${quote(expected)}) beneath it.`, 'For example:\nif tickets > 2:\n    print("Go")\nelse:\n    print("Wait")'], expectedBehavior: expected, checkSource }
  }
  if (id === 'loops') {
    const count = difficulty === 'guided' ? 3 : difficulty === 'independent' ? 4 : 5
    const expected = Array.from({ length: count }, (_, index) => difficulty === 'challenge' ? `${subject} ${index + 1}` : String(index + 1)).join('\n')
    return { ...base, instructions: difficulty === 'guided' ? ['Change range so it includes 1, 2, and 3.', 'Print each number inside the loop.'] : difficulty === 'independent' ? ['Write a for loop using range().', 'Print the numbers 1 through 4, each on its own line.'] : [`Print five numbered ${plural} lines using a for loop.`, `Use the format “${subject} 1” through “${subject} 5”.`], sample: 'for number in range(1, 3):\n    print(number)', challenge: `Produce ${count} lines: ${expected.replaceAll('\n', ', ')}`, starterCode: difficulty === 'guided' ? 'for number in range(1, 3):\n    print(number)' : '# Write a for loop below\n', hints: ['A for loop repeats its indented body.', `range(1, ${count + 1}) visits each needed number.`, 'For example, for n in range(1, 3): followed by an indented print(n) displays 1 and 2.'], expectedBehavior: expected, checkSource: loopCheck(expected) }
  }
  const expected = difficulty === 'challenge' ? `Hello, ${subject}!\nHello, ${place}!` : `Hello, ${subject}!`
  const checkSource = `import ast\ndef check(ns, output):\n    tree = ast.parse(learner_source)\n    defined = any(isinstance(n, ast.FunctionDef) and n.name == "greet" and len(n.args.args) >= 1 for n in ast.walk(tree))\n    fn = ns.get("greet")\n    try:\n        works = callable(fn) and fn("MOSAIC") == "Hello, MOSAIC!" and fn("teal") == "Hello, teal!"\n    except Exception:\n        works = False\n    return (defined and works and output.strip() == ${quote(expected)}, "Define greet(name), return a greeting using name, then print the requested call or calls.")`
  return { ...base, instructions: difficulty === 'guided' ? ['Complete greet(name) so it returns a greeting using name.', `Print greet(${quote(subject)}).`] : difficulty === 'independent' ? ['Write greet(name) yourself.', `Call it with ${quote(subject)} and print the result.`] : [`Write a reusable greet(name) function.`, `Call it for ${subject} and ${place}; print each result.`], sample: 'def greet(name):\n    return f"Hello, {name}!"', challenge: `Produce exactly: ${expected.replaceAll('\n', ' then ')}`, starterCode: difficulty === 'guided' ? `def greet(name):\n    # Return a greeting using name\n    pass\n\nprint(greet(${quote(subject)}))` : '# Define greet(name) and call it below\n', hints: ['A function receives a value through its parameter.', 'Return an f-string that includes {name}, then print a call to greet().', 'For example, def cheer(team): return f"Go, {team}!" creates a reusable greeting.'], expectedBehavior: expected, checkSource }
}
export function getLesson(id: ConceptId, difficulty: Difficulty, interest: Interest = 'ocean', customTopic = ''): PythonLesson { return makeLesson(id, difficulty, interest, customTopic) }
export const lessons: PythonLesson[] = (['hello-python', 'variables', 'conditions', 'loops', 'functions'] as ConceptId[]).map((id) => getLesson(id, 'guided', 'ocean'))
export const initialLessonId = lessons[0].id
export const initialDrafts = Object.fromEntries(lessons.map((lesson) => [lesson.id, lesson.starterCode]))
