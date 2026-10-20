// Shared by the Pyodide worker and regression tests. This is real Python execution, not an output simulator.
export const pythonBootstrap = `
import builtins as _mosaic_builtins
_mosaic_safe_names = (
    "abs", "all", "any", "bool", "dict", "enumerate", "Exception", "filter",
    "EOFError", "float", "format", "int", "isinstance", "issubclass", "iter", "KeyError",
    "len", "list", "map", "max", "min", "NameError", "next", "NotImplementedError",
    "print", "range", "repr", "reversed", "round", "set", "slice", "sorted", "str",
    "sum", "tuple", "TypeError", "ValueError", "zip", "True", "False", "None"
)
_mosaic_safe_builtins = {name: getattr(_mosaic_builtins, name.strip()) for name in _mosaic_safe_names if hasattr(_mosaic_builtins, name.strip())}
`
export function createPythonRunSource(code: string, checkSource: string, inputLines: string[] = []): string {
  return `
import builtins as _b, contextlib, io, json, traceback, ast
_source = ${JSON.stringify(code)}
_check_source = ${JSON.stringify(checkSource)}
_output = io.StringIO()
_error = ""
_passed = False
_project = None
_feedback = "Run the code and follow the lesson steps to check your work."
_learner_builtins = dict(_mosaic_safe_builtins)
_input_queue = ${JSON.stringify(inputLines.slice(0, 50).map(line => line.slice(0, 1000)))}
_provided_inputs = list(_input_queue)
def _mosaic_input(prompt=""):
    if not _input_queue:
        raise EOFError("The input queue is empty. Add one line for each input() call and run again.")
    return _input_queue.pop(0)
_learner_builtins["input"] = _mosaic_input
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
        _check_namespace = {"__builtins__": _b.__dict__, "learner_source": _source, "ast": ast, "learner_inputs": _provided_inputs}
        exec(compile(_check_source, "<lesson-check>", "exec"), _check_namespace)
        _checked = _check_namespace["check"](_namespace, _captured)
        _passed, _feedback = _checked[:2]
        if _passed and len(_checked) == 3:
            _project = _checked[2]
    except BaseException as _check_error:
        _error = "Lesson check error: " + str(_check_error)
json.dumps({"output": _captured, "error": _error, "passed": bool(_passed), "feedback": str(_feedback), "project": _project})
`
}
