import {test,expect} from '@playwright/test';
test('Korean application shell is reachable',async({page})=>{await page.goto('/');await expect(page).toHaveTitle('화음 수리점');await expect(page.locator('html')).toHaveAttribute('lang','ko');await expect(page.getByRole('heading',{name:'화음 수리점',exact:true})).toBeVisible();});
