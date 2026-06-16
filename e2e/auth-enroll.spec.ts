import { expect, test } from '@playwright/test';

/** Requires seeded API (student@gum-demo.in / Password@123) behind the web app. */
test.describe('auth + free enrollment', () => {
  test('login → my internships shows progress', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email or phone/i).fill('student@gum-demo.in');
    await page.getByLabel(/password/i).fill('Password@123');
    await page.getByRole('button', { name: /log in/i }).click();
    await expect(page).toHaveURL(/\/my/);
    await expect(page.getByRole('heading', { name: /my internships/i })).toBeVisible();
  });

  test('protected route bounces to login with ?next', async ({ page }) => {
    await page.goto('/my');
    await expect(page).toHaveURL(/\/login\?next=%2Fmy/);
  });

  test('signup with dev-echoed OTP (NOTIFY_DRY_RUN envs)', async ({ page, request }) => {
    const email = `e2e-${Date.now()}@test.in`;
    const phone = `98${String(Date.now()).slice(-8)}`;
    const reg = await request.post('/api/proxy/auth/register', {
      data: { fullName: 'E2E User', email, phone, password: 'Password1' },
    });
    const body = await reg.json();
    const otp = body.meta.dev.otp.email as string; // mocked-OTP path for staging/dev only
    await request.post('/api/proxy/auth/otp/verify', { data: { destination: email, purpose: 'email_verify', code: otp } });
    await page.goto('/login');
    await page.getByLabel(/email or phone/i).fill(email);
    await page.getByLabel(/password/i).fill('Password1');
    await page.getByRole('button', { name: /log in/i }).click();
    await expect(page).toHaveURL(/\/my/);
  });
});

/** Specs below cover sessions 3.4–3.7 surfaces — enable as those pages land. */
test.describe('full journey (pending UI sessions)', () => {
  test.fixme('enroll free → reach classroom and play first lesson', async () => {/* 3.4 */});
  test.fixme('paid checkout with Razorpay test-mode stub → activation poll', async () => {/* 3.6 */});
  test.fixme('submit project file → instructor reviews → certificate appears @mobile', async () => {/* 3.5 + 3.7 */});
});
