import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';
import {initialState,command,tick,reached,targets,validateCommand} from '../src/model.ts';
import {armReference,armMoved,armTransfer} from '../src/arm-lesson.ts';

// Execute the actual CPython entrypoint with only its fixed student-file read
// replaced by a synthetic fixture. This checks API parity, not provider isolation.
const harness=`import builtins, io, json, runpy, sys
fixture = json.loads(sys.stdin.readline())
original_open = builtins.open
def fixture_open(path, *args, **kwargs):
    if path == '/opt/robot/student.py':
        return io.StringIO(fixture['source'])
    return original_open(path, *args, **kwargs)
builtins.open = fixture_open
runpy.run_path('server/python-run.py', run_name='__main__')
`;
async function execute(source:string,target='parcel-across'){
 const child=spawn('python3',['-I','-c',harness],{stdio:['pipe','pipe','pipe'],timeout:10000});
 let state=initialState(target),stderr='',output='',commands=0;
 child.stderr.on('data',data=>{stderr+=data;});
 const lines=createInterface({input:child.stdout});
 lines.on('line',line=>{
  if(!line.startsWith('@robot ')){output+=line+'\n';return;}
  const message=JSON.parse(line.slice(7)),c=validateCommand(message.command);commands++;
  let value:number|null=null;
  if(c.op==='wait'){for(let i=0;i<c.value!;i++)state=tick(state);}
  else {const result=command(state,c);state=result.state;value=result.value;}
  child.stdin.write(JSON.stringify(value)+'\n');
 });
 child.stdin.write(JSON.stringify({source})+'\n');
 const code=await new Promise<number|null>((resolve,reject)=>{child.once('error',reject);child.once('close',resolve);});
 return {state,stderr,output,commands,code};
}
test('server CPython executes all three arm deliveries through the trusted bridge',async()=>{
 for(const [target,source] of [['parcel-across',armReference.python],['parcel-moved',armMoved.python],['parcel-return',armTransfer.python]]){
  const run=await execute(source,target);assert.equal(run.code,0,run.stderr);assert.equal(reached(run.state,targets[target]),true);assert.equal(run.state.ticks,320);assert.match(run.output,/After closing, holding: 1/);assert.match(run.output,/After opening, holding: 0/);
 }
});
test('server Python rejects missing/excess arguments without emitting a redirected command',async()=>{
 for(const name of ['motor','servo','wait','shoulder','elbow','grip'])for(const args of ['',"45, 'elbow'", "45, op='elbow'"]){
  const run=await execute(`from robot import ${name}\nawait ${name}(${args})`);assert.notEqual(run.code,0);assert.match(run.stderr,/TypeError/);assert.equal(run.commands,0,`${name}(${args}) must fail before sending any command`);
 }
 for(const name of ['angle','scanner','clock','shoulder_angle','elbow_angle','aperture','holding']){
  const run=await execute(`from robot import ${name}\nawait ${name}('clock')`);assert.notEqual(run.code,0);assert.match(run.stderr,/TypeError/);assert.equal(run.commands,0);
 }
});
