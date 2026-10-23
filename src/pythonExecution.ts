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
import builtins as _b, contextlib, io, json, traceback, ast, sys, math
_source = ${JSON.stringify(code)}
_check_source = ${JSON.stringify(checkSource)}
class _MosaicOutput(io.StringIO):
    def __init__(self):
        super().__init__()
        self.remaining = 20000
        self.truncated = False
    def write(self, value):
        if self.remaining <= 0:
            self.truncated = True
            return len(value)
        part = value[:self.remaining]
        self.remaining -= len(part)
        if len(part) < len(value):
            self.truncated = True
        super().write(part)
        return len(value)
_output = _MosaicOutput()
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
_trace_events = []
_trace_limit = 400
_trace_truncated = False
_trace_frame_state = {}
_if_lines = {}
_loop_lines = {}
_loop_counts = {}
try:
    for _node in ast.walk(ast.parse(_source)):
        if isinstance(_node, ast.If):
            _if_lines[_node.lineno] = (_node.body[0].lineno, _node.orelse[0].lineno if _node.orelse else None, _node.end_lineno)
        if isinstance(_node, (ast.For, ast.While)):
            _loop_lines[_node.lineno] = _node.body[0].lineno
except SyntaxError:
    pass
def _trace_value(value, depth=0):
    kind = type(value)
    if kind is bool:
        return value
    if kind is int and abs(value) <= 1000000000000000:
        return value
    if kind is float and math.isfinite(value) and abs(value) <= 1000000000000000:
        return value
    if value is None:
        return None
    if kind is str:
        return value[:120] + ('…' if len(value) > 120 else '')
    if depth < 2 and kind in (list, tuple):
        return [_trace_value(item, depth + 1) for item in value] if len(value) <= 12 else '<collection too large to show>'
    if depth < 2 and kind is dict:
        return {str(key)[:40]: _trace_value(item, depth + 1) for key, item in value.items() if type(key) in (str, int, float, bool)} if len(value) <= 12 else '<dictionary too large to show>'
    return '<value not shown>'
def _trace_snapshot(frame):
    return {name: _trace_value(value) for name, value in list(frame.f_locals.items())[:30] if not name.startswith('_')}
def _mosaic_trace(frame, event, arg):
    global _trace_truncated
    if frame.f_code.co_filename != '<learner>':
        return None
    if event == 'call' and frame.f_code.co_name == '<module>':
        return _mosaic_trace
    if event not in ('line', 'call', 'return', 'exception'):
        return _mosaic_trace
    if len(_trace_events) >= _trace_limit:
        _trace_truncated = True
        sys.settrace(None)
        return None
    current = _trace_snapshot(frame)
    _frame_id = id(frame)
    _prior = _trace_frame_state.get(_frame_id)
    before = _prior['variables'] if _prior else {}
    _prior_line = _prior['line'] if _prior else None
    changes = {name: value for name, value in current.items() if name not in before or before[name] != value}
    output_now = _output.getvalue()
    prior_output = _trace_events[-1]['output'] if _trace_events else ''
    entry = {'kind': event, 'line': frame.f_lineno, 'scope': frame.f_code.co_name,
             'variables': current, 'changes': changes,
             'executedLine': _prior_line,
             'output': output_now[-4000:]}
    if len(output_now) > 4000:
        entry['outputPreviewTruncated'] = True
    if _prior_line in _if_lines and event == 'line':
        _if_body, _else_body, _if_end = _if_lines[_prior_line]
        if frame.f_lineno == _if_body:
            entry['decision'] = {'line': _prior_line, 'branch': 'if'}
        elif frame.f_lineno == _else_body or (_else_body is None and frame.f_lineno > _if_end):
            entry['decision'] = {'line': _prior_line, 'branch': 'else'}
    if _prior_line in _loop_lines and event == 'line' and frame.f_lineno == _loop_lines[_prior_line]:
        _loop_key = (_frame_id, _prior_line)
        _loop_counts[_loop_key] = _loop_counts.get(_loop_key, 0) + 1
        entry['loopIteration'] = {'line': _prior_line, 'count': _loop_counts[_loop_key]}
    if event == 'return' and frame.f_code.co_name != '<module>':
        entry['returnValue'] = _trace_value(arg)
    if event == 'exception':
        entry['error'] = type(arg[1]).__name__ + ': ' + str(arg[1])[:200]
    if output_now[-4000:] != prior_output:
        entry['outputChanged'] = True
    _trace_events.append(entry)
    if event == 'return':
        _trace_frame_state.pop(_frame_id, None)
    else:
        _trace_frame_state[_frame_id] = {'variables': current, 'line': frame.f_lineno}
    return _mosaic_trace
_blocked_builtin_names = ("__import__", "eval", "exec", "compile", "open", "input")
_original_builtins = {name: getattr(_b, name) for name in _blocked_builtin_names}
try:
    for _name in _blocked_builtin_names:
        setattr(_b, _name, None)
    with contextlib.redirect_stdout(_output), contextlib.redirect_stderr(_output):
        try:
            sys.settrace(_mosaic_trace)
            _trusted_exec(_trusted_compile(_source, "<learner>", "exec"), _namespace)
        except BaseException as _caught:
            _learner_exception = _caught
        finally:
            sys.settrace(None)
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
json.dumps({"output": _captured, "error": _error, "passed": bool(_passed), "feedback": str(_feedback), "project": _project,
            "trace": {"events": _trace_events, "truncated": _trace_truncated, "outputTruncated": _output.truncated}})
`
}
