import { test, expect } from '@playwright/test';

const BULL_TRACK = {
  name: 'Bull Track Bike Park',
  description:
    'Compact wood venue in Crowborough with graded jump lines, a pump track, and online passes.',
  website: 'https://bulltrackbikepark.co.uk/',
  lat: 51.058,
  lng: -0.161,
};

const e2eAuth =
  process.env.ENABLE_E2E_TEST_AUTH === '1' &&
  Boolean(process.env.TEST_APP_USERNAME?.trim()) &&
  Boolean(process.env.TEST_APP_SECRET?.trim());

test.describe('bike park admin (moderator)', () => {
  test.beforeAll(async ({ request }) => {
    test.skip(!e2eAuth, 'Set ENABLE_E2E_TEST_AUTH=1, TEST_APP_USERNAME, TEST_APP_SECRET');
    const res = await request.post('/api/e2e/session');
    expect(res.ok(), `e2e session failed: ${await res.text()}`).toBeTruthy();
  });

  test('creates and deletes Bull Track sample', async ({ page }) => {
    test.skip(!e2eAuth, 'Set ENABLE_E2E_TEST_AUTH=1, TEST_APP_USERNAME, TEST_APP_SECRET');

    await page.goto('/admin/bike-parks');
    await expect(page.getByRole('heading', { name: /bike parks/i })).toBeVisible({
      timeout: 30_000,
    });

    await page.locator('#bp-name').fill(BULL_TRACK.name);
    await page.locator('#bp-desc').fill(BULL_TRACK.description);
    await page.locator('#bp-lat').fill(String(BULL_TRACK.lat));
    await page.locator('#bp-lng').fill(String(BULL_TRACK.lng));
    await page.locator('#bp-web').fill(BULL_TRACK.website);

    await page.getByRole('button', { name: 'Create park' }).click();
    await expect(page.getByText('Park created.')).toBeVisible({ timeout: 30_000 });

    await page.getByLabel(/Edit existing/).selectOption({ label: BULL_TRACK.name });

    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: 'Delete park' }).click();

    await expect(page.getByText('Park deleted.')).toBeVisible({ timeout: 30_000 });
  });
});
