import { clearCache } from './setup/cache-setup';

/**
 * Global setup runs once before all tests
 * https://playwright.dev/docs/test-global-setup-teardown
 */
export default async function globalSetup() {
  console.log('Running global test setup...');

  // Clear cache to ensure clean test environment
  await clearCache();

  console.log('Global setup complete');
}
