import { loadPyodide } from '/pyodide/pyodide.mjs';
const send = postMessage.bind(globalThis);
let traceSequence = 2000;
let sequence = 0, pending = null, started = false, bytes = 0;
const decoder = new TextDecoder();
const output = buffer => {
  bytes += buffer.length;
  if (bytes > 8192) { send({ type: 'error', text: 'Console limit reached (8 KB). Try printing less.' }); throw new Error('Console limit reached'); }
  send({ type: 'output', text: decoder.decode(buffer) });
  return buffer.length;
};
const trace = line => new Promise((resolve, reject) => {
  if (pending) { reject(new Error('Overlapping line trace.')); return; }
  if (++traceSequence > 12000) { reject(new Error('Line trace limit reached (10,000 visits). Try fewer repeats.')); return; }
  pending = { id: traceSequence, resolve, reject };
  send({ type: 'trace', id: traceSequence, line });
});
const rpc = (op, value) => {
  if (pending) return Promise.reject(new Error('Await each robot command before starting another.'));
  if (++sequence > 2000) return Promise.reject(new Error('Robot command limit reached.'));
  return new Promise((resolve, reject) => {
    pending = { id: sequence, resolve, reject };
    send({ type: 'command', id: sequence, command: value === undefined ? { op } : { op, value } });
  });
};
addEventListener('message', async ({ data: m }) => {
  if (m.type === 'reply' && pending?.id === m.id) {
    const p = pending; pending = null;
    m.error ? p.reject(new Error(m.error)) : p.resolve(m.value);
  }
  if (m.type !== 'run' || started) return;
  started = true;
  try {
    const py = await loadPyodide({ indexURL: '/pyodide/', stdin: () => { throw new Error('input() is unavailable. Edit a variable instead.'); } });
    py.setStdout({ write: output });
    py.setStderr({ write: output });
    py.registerJsModule('_robot_rpc', { call: rpc, trace });
    await py.runPythonAsync(`
import sys, types
from _robot_rpc import call as _call
robot = types.ModuleType('robot')
async def motor(power):
    return await _call('motor', power)
async def servo(degrees):
    return await _call('servo', degrees)
async def wait(ticks):
    return await _call('wait', ticks)
async def angle():
    return await _call('angle')
async def scanner():
    return await _call('scanner')
async def clock():
    return await _call('clock')
async def shoulder(degrees):
    return await _call('shoulder', degrees)
async def elbow(degrees):
    return await _call('elbow', degrees)
async def grip(mm):
    return await _call('grip', mm)
async def shoulder_angle():
    return await _call('shoulderAngle')
async def elbow_angle():
    return await _call('elbowAngle')
async def aperture():
    return await _call('aperture')
async def holding():
    return await _call('holding')
for _name in ['motor', 'servo', 'wait', 'angle', 'scanner', 'clock', 'shoulder', 'elbow', 'grip', 'shoulder_angle', 'elbow_angle', 'aperture', 'holding']:
    setattr(robot, _name, globals()[_name])
sys.modules['robot'] = robot
`);
    // Native tracing preserves Python's scopes, functions, exceptions and loop
    // semantics. Stack switching allows the synchronous trace hook to wait for
    // the UI without blocking the worker's message loop.
    const tracing = await py.runPythonAsync(`
from pyodide.ffi import can_run_sync, run_sync
from _robot_rpc import trace as _trace_line
_callback_notice = False
def _can_trace():
    global _callback_notice
    if can_run_sync():
        return True
    # A browser may call a Python proxy synchronously. Such an entry cannot
    # suspend: preserve its original semantics instead of crashing the worker.
    if not _callback_notice:
        print('Browser callbacks run without line controls; their synchronous entry cannot pause.')
        _callback_notice = True
    return False
def _student_trace(code, line):
    if code.co_filename != 'student.py':
        return sys.monitoring.DISABLE
    if _can_trace():
        run_sync(_trace_line(line))
def _student_return(code, offset, result):
    if code.co_filename != 'student.py':
        return sys.monitoring.DISABLE
    # A helper can return into the middle of its caller's current line. Restore
    # that source location before the caller's remaining effects execute.
    caller = sys._getframe(1).f_back
    while caller and caller.f_code.co_filename != 'student.py':
        caller = caller.f_back
    if caller and _can_trace():
        run_sync(_trace_line(caller.f_lineno))
can_run_sync()
`);
    send({ type: 'ready', tracing: Boolean(tracing) });
    py.globals.set('_student_source', m.source);
    py.globals.set('_tracing_enabled', Boolean(tracing));
    await py.runPythonAsync(`
import ast, inspect
_student_code = compile(_student_source, 'student.py', 'exec', flags=ast.PyCF_ALLOW_TOP_LEVEL_AWAIT)
# Monitoring survives async task resumes. A thread-local sys.settrace hook
# does not survive Pyodide's repeated JavaScript/interpreter entries.
if _tracing_enabled:
    sys.monitoring.use_tool_id(5, 'RoboLab')
    sys.monitoring.register_callback(5, sys.monitoring.events.LINE, _student_trace)
    sys.monitoring.register_callback(5, sys.monitoring.events.PY_RETURN, _student_return)
    sys.monitoring.set_events(5, sys.monitoring.events.LINE | sys.monitoring.events.PY_RETURN)
try:
    _result = eval(_student_code, {'__name__': '__main__'})
    if inspect.isawaitable(_result):
        await _result
finally:
    if _tracing_enabled:
        sys.monitoring.set_events(5, 0)
        sys.monitoring.free_tool_id(5)
`);
    send({ type: 'done' });
  } catch (error) {
    send({ type: 'error', text: String(error?.message || error).slice(-4096) });
  }
});
