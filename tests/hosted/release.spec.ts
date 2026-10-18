import {openSignIn} from '../learning-ui.ts';
import {fixtureParent} from '../helpers/fixture-parent.ts';
import {test,expect,type BrowserContext} from '@playwright/test';
import {BlobStore,login,provision,addStudent} from '../../server/family-store.mjs';
import {del} from '@vercel/blob';
import {readFileSync} from 'node:fs';
const base=process.env.HOSTED_APP_ORIGIN||'http://127.0.0.1:4373';
const bypass=process.env.HOSTED_BYPASS_FILE?JSON.parse(readFileSync(process.env.HOSTED_BYPASS_FILE,'utf8')).bypassSecret:undefined;
const paths=new Set<string>();
async function routeApp(context:BrowserContext){
 if(bypass)await context.route(url=>url.origin===base,route=>route.continue({headers:{...route.request().headers(),'x-vercel-protection-bypass':bypass}}));
}
test.afterAll(async()=>{if(paths.size)await del([...paths]);});
test('live release: existing-family student login, Java, checked Python and parent results',async({page,browser})=>{
 const store=new BlobStore(),write=store.write.bind(store);store.write=async(path:string,...args:unknown[])=>{paths.add(path);return write(path,...args);};
 const parent=await provision(store,{parentName:'Release fixture'}),session=await login(store,parent.code),student=await addStudent(store,session,'Release student'),code=student.code;
 await routeApp(page.context());await fixtureParent(page.context(),store,parent.code,base);await page.goto('/');await page.locator('#family-open').click();await expect(page.locator('.family-results')).toContainText('Release student');
 const device=await browser.newContext();await routeApp(device);const child=await device.newPage();await child.goto('/');await openSignIn(child,'student');await child.locator('#access-code').fill(code);await child.getByRole('button',{name:'Sign in',exact:true}).click();await expect(child.locator('#profile-label')).toContainText('Release student');await child.getByRole('button',{name:'Close family progress'}).click();
 await child.locator('#language').selectOption('java');await child.locator('#code').fill('public class Main { public static void main(String[] args) throws Exception { Robot.servo(120); Robot.motor(.5); Robot.waitTicks(100); Robot.motor(0); } }');await child.locator('#run').click();await expect(child.locator('#status-pill')).toHaveText('FINISHED',{timeout:60000});await expect(child.locator('#feedback-title')).toContainText('Crew located');
 await expect(child.locator('#run')).toBeEnabled({timeout:80000});await child.locator('#language').selectOption('python');await child.locator('#code').fill('from robot import servo, motor, wait\nawait servo(120)\nawait motor(.5)\nawait wait(100)\nawait motor(0)');await child.locator('#run').click();await expect(child.locator('#status-pill')).toHaveText('FINISHED',{timeout:60000});await child.locator('#verify-cloud').click();await expect.poll(async()=>(await (await child.request.get(base+'/api/family',{headers:bypass?{'x-vercel-protection-bypass':bypass}:{}})).json()).completed,{timeout:80000}).toContain('beacon');await expect(child.locator('#stop-check')).toBeHidden();
 await page.locator('#family-refresh').click();await expect(page.locator('.family-results')).toContainText('1/3 challenges complete');await device.close();
});
