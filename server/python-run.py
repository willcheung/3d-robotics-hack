# Actual CPython for server verification. Trusted state stays in the gateway.
import asyncio, json, sys, types
_counter = 0
async def _call(op, value=None, has_value=False):
    global _counter
    _counter += 1
    command = {'op': op}
    if has_value:
        command['value'] = value
    print('@robot ' + json.dumps({'type': 'command', 'id': _counter, 'command': command}, allow_nan=False), flush=True)
    reply = json.loads(sys.stdin.readline())
    return reply
robot = types.ModuleType('robot')
# Public parameter names match browser Python, including keyword calls.
async def motor(power):
    return await _call('motor', power, True)
async def servo(degrees):
    return await _call('servo', degrees, True)
async def wait(ticks):
    return await _call('wait', ticks, True)
async def shoulder(degrees):
    return await _call('shoulder', degrees, True)
async def elbow(degrees):
    return await _call('elbow', degrees, True)
async def grip(mm):
    return await _call('grip', mm, True)
def _sensor(op):
    async def _get():
        return await _call(op)
    return _get
for _name in ('motor', 'servo', 'wait', 'shoulder', 'elbow', 'grip'):
    setattr(robot, _name, globals()[_name])
for _name in ('angle', 'scanner', 'clock', 'shoulderAngle', 'elbowAngle', 'aperture', 'holding'):
    setattr(robot, {'shoulderAngle':'shoulder_angle','elbowAngle':'elbow_angle'}.get(_name, _name), _sensor(_name))
sys.modules['robot'] = robot
import ast
with open('/opt/robot/student.py') as source:
    code = compile(source.read(), 'signal.py', 'exec', flags=ast.PyCF_ALLOW_TOP_LEVEL_AWAIT)
result = eval(code, {'__name__': '__main__'})
if result is not None:
    asyncio.run(result)
