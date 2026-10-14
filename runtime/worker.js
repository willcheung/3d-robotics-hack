import { loadPyodide } from '/pyodide/pyodide.mjs';
const send = postMessage.bind(globalThis);
let sequence = 0, pending = null, started = false, bytes = 0;
const decoder = new TextDecoder();
const output = buffer => {
  bytes += buffer.length;
  if (bytes > 8192) { send({ type: 'error', text: 'Console limit reached (8 KB). Try printing less.' }); throw new Error('Console limit reached'); }
  send({ type: 'output', text: decoder.decode(buffer) });
  return buffer.length;
};
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
    py.registerJsModule('_robot_rpc', { call: rpc });
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
    send({ type: 'ready' });
    await py.runPythonAsync(m.source, { filename: 'student.py' });
    send({ type: 'done' });
  } catch (error) {
    send({ type: 'error', text: String(error?.message || error).slice(-4096) });
  }
});
