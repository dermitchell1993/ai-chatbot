import { disconnectCache } from './setup/cache-setup';

/**
 * Global teardown runs once after all tests
 * https://playwright.dev/docs/test-global-setup-teardown
 */
export default async function globalTeardown() {
  console.log('Running global test teardown...');

  // Disconnect from cache to clean up connections
  await disconnectCache();

  console.log('Global teardown complete');
}
