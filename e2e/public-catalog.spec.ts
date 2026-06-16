import { expect, test } from '@playwright/test';

test.describe('public catalog @mobile', () => {
  test('home renders popular internships with brand chrome', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/real work/i);
    await expect(page.getByText('Flutter App Development Internship')).toBeVisible();
  });

  test('filters are shareable URLs', async ({ page }) => {
    await page.goto('/internships?category=flutter&pricingType=paid');
    await expect(page.getByText('Flutter App Development Internship')).toBeVisible();
    await expect(page).toHaveURL(/category=flutter/);
  });

  test('detail: JSON-LD, seats, correct CTA per viewport', async ({ page, isMobile }) => {
    await page.goto('/internships/flutter-app-development-internship');
    const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
    expect(jsonLd).toContain('"@type":"Course"');
    await expect(page.getByText(/seats left|Waitlist open|Batch full/).first()).toBeVisible();
    if (isMobile) {
      await expect(page.locator('.fixed.bottom-14')).toBeVisible(); // sticky bottom CTA bar
    } else {
      await expect(page.locator('.sticky.top-24')).toBeVisible(); // sticky enroll card
    }
  });

  test('verify page renders validity result', async ({ page }) => {
    await page.goto('/verify/GUMI-0000-000000');
    await expect(page.getByText(/Not valid/)).toBeVisible();
  });
});
