import { test, expect } from '@playwright/test';

test('candidate can complete the apply flow', async ({ page }) => {
  await page.route('**/api/applications/job-1', route =>
    route.fulfill({ json: { id: 'job-1', jobTitle: 'PM', company: 'Acme', screeningQuestions: [] } })
  );
  await page.route('**/api/extract', route =>
    route.fulfill({ json: { profile: { name: 'Dave', email: 'd@x.com', skills: ['Figma'] } } })
  );
  await page.route('**/api/score', route =>
    route.fulfill({ json: { score: { score: 88, grade: 'A', summary: 'Strong fit', strengths: [], gaps: [],
      recommendation: 'Advance', breakdown: { skills_match: 90, experience_relevance: 85, screening_quality: 80, overall_fit: 88 } } } })
  );

  await page.goto('/apply/job-1');
  await page.getByPlaceholder('Paste your resume text here...').fill('Product designer with 10 years experience.');
  await page.getByRole('button', { name: 'Extract Information' }).click();
  await page.getByRole('button', { name: 'Continue to Screening' }).click();
  await page.getByRole('button', { name: 'Submit Application' }).click();

  await expect(page.getByText('Application submitted!')).toBeVisible();
  await expect(page.getByText('88', { exact: true }).first()).toBeVisible();
});

test('shows upgrade message when the recruiter hit their limit', async ({ page }) => {
  await page.route('**/api/applications/job-1', route =>
    route.fulfill({ json: { id: 'job-1', jobTitle: 'PM', company: 'Acme', screeningQuestions: [] } })
  );
  await page.route('**/api/extract', route =>
    route.fulfill({ json: { profile: { name: 'Dave', skills: [] } } })
  );
  await page.route('**/api/score', route =>
    route.fulfill({ status: 403, json: { error: 'Monthly review limit reached', upgradeRequired: true, used: 5, limit: 5 } })
  );

  await page.goto('/apply/job-1');
  await page.getByPlaceholder('Paste your resume text here...').fill('Resume text.');
  await page.getByRole('button', { name: 'Extract Information' }).click();
  await page.getByRole('button', { name: 'Continue to Screening' }).click();
  await page.getByRole('button', { name: 'Submit Application' }).click();

  await expect(page.getByText(/reached its review limit/i)).toBeVisible();
});