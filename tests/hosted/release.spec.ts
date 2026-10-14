import {test,expect,type BrowserContext} from '@playwright/test';
import {BlobStore,login,familyPath,hashCode} from '../../server/family-store.mjs';
import {del} from '@vercel/blob';
import {readFileSync} from 'node:fs';
const base=process.env.HOSTED_APP_ORIGIN||'http://127.0.0.1:4373';
const bypass=process.env.HOSTED_BYPASS_FILE?JSON.parse(readFileSync(process.env.HOSTED_BYPASS_FILE,'utf8')).bypassSecret:undefined;
const paths=new Set<string>();
async function routeApp(context:BrowserContext){
 if(bypass)await context.route(url=>url.origin===base,route=>route.continue({headers:{...route.request().headers(),'x-vercel-protection-bypass':bypass}}));
}
test.afterAll(async()=>{if(paths.size)await del([...paths]);});
test('live release: browser-only family creation, child login, Java and checked Python',async({page,browser})=>{
 await routeApp(page.context());await page.goto('/');await page.locator('#family-open').click();await page.locator('[data-mode=student]').click();await page.locator('#legacy-setup summary').click();await page.locator('#parent-name').fill('Release fixture');await page.getByRole('button',{name:'Create family',exact:true}).click();await expect(page.locator('#profile-label')).toContainText('Release fixture');
 const parentCode=await page.locator('#setup-receipt input').inputValue(),store=new BlobStore(),session=await login(store,parentCode);paths.add(familyPath(session.familyId));paths.add(`invites/${hashCode(parentCode)}.json`);
 await page.locator('#setup-saved').click();await page.locator('#student-name').fill('Release student');await page.getByRole('button',{name:'Add student',exact:true}).click();await expect(page.locator('.family-results')).toContainText('Release student');const code=await page.locator('#new-code input').inputValue();paths.add(`invites/${hashCode(code)}.json`);
 const device=await browser.newContext();await routeApp(device);const child=await device.newPage();await child.goto('/');await child.locator('#family-open').click();await child.locator('[data-mode=student]').click();await child.locator('#access-code').fill(code);await child.getByRole('button',{name:'Sign in',exact:true}).click();await expect(child.locator('#profile-label')).toContainText('Release student');await child.getByRole('button',{name:'Close family progress'}).click();
 await child.locator('#language').selectOption('java');await child.locator('#code').fill('public class Main { public static void main(String[] args) throws Exception { Robot.servo(120); Robot.motor(.5); Robot.waitTicks(100); Robot.motor(0); } }');await child.locator('#run').click();await expect(child.locator('#status-pill')).toHaveText('FINISHED',{timeout:60000});await expect(child.locator('#feedback-title')).toContainText('Crew located');
 await child.locator('#language').selectOption('python');await child.locator('#code').fill('from robot import servo, motor, wait\nawait servo(120)\nawait motor(.5)\nawait wait(100)\nawait motor(0)');await child.locator('#run').click();await expect(child.locator('#status-pill')).toHaveText('FINISHED',{timeout:60000});await child.locator('#verify-cloud').click();await expect(child.locator('#save-help')).toContainText('Rescue checked and saved',{timeout:60000});
 await page.locator('#family-refresh').click();await expect(page.locator('.family-results')).toContainText('1/3 checked rescues');await device.close();
});
