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
for _name in ('motor', 'servo', 'wait'):
    async def _set(value, op=_name):
        return await _call(op, value, True)
    setattr(robot, _name, _set)
for _name in ('angle', 'scanner', 'clock'):
    async def _get(op=_name):
        return await _call(op)
    setattr(robot, _name, _get)
sys.modules['robot'] = robot
import ast
with open('/opt/robot/student.py') as source:
    code = compile(source.read(), 'signal.py', 'exec', flags=ast.PyCF_ALLOW_TOP_LEVEL_AWAIT)
result = eval(code, {'__name__': '__main__'})
if result is not None:
    asyncio.run(result)
