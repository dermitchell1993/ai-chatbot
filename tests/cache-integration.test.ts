import { test, expect } from '@playwright/test';
import { ChatPage } from './pages/chat';
import { clearCache } from './setup/cache-setup';

test.describe('Cache Integration Tests', () => {
  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    // Clear cache before each test to ensure isolation
    await clearCache();

    chatPage = new ChatPage(page);
    await chatPage.createNewChat();
  });

  test('chat functionality works with cache enabled', async () => {
    // Send first message
    await chatPage.sendUserMessage('Why is grass green?');
    await chatPage.isGenerationComplete();

    const assistantMessage = await chatPage.getRecentAssistantMessage();
    expect(assistantMessage.content).toContain("It's just green duh!");

    // Send second message (should use cached chat session)
    await chatPage.sendUserMessage('Why is the sky blue?');
    await chatPage.isGenerationComplete();

    const secondMessage = await chatPage.getRecentAssistantMessage();
    expect(secondMessage.content).toContain("It's just blue duh!");
  });

  test('cached data is consistent across page reloads', async () => {
    // Create chat and send message
    await chatPage.sendUserMessage('Test message');
    await chatPage.isGenerationComplete();

    const chatUrl = chatPage.page.url();

    // Reload page
    await chatPage.page.reload();
    await chatPage.page.waitForLoadState('networkidle');

    // Verify we're still on the same chat
    expect(chatPage.page.url()).toBe(chatUrl);
  });

  test('message editing works with cache invalidation', async () => {
    // Send initial message
    await chatPage.sendUserMessage('Why is grass green?');
    await chatPage.isGenerationComplete();

    const assistantMessage = await chatPage.getRecentAssistantMessage();
    expect(assistantMessage.content).toContain("It's just green duh!");

    // Edit the message
    const userMessage = await chatPage.getRecentUserMessage();
    await userMessage.edit('Why is the sky blue?');

    await chatPage.isGenerationComplete();

    const updatedAssistantMessage = await chatPage.getRecentAssistantMessage();
    expect(updatedAssistantMessage.content).toContain("It's just blue duh!");
  });

  test('upload and attachment work with cache', async () => {
    await chatPage.addImageAttachment();

    await chatPage.isElementVisible('attachments-preview');
    await chatPage.isElementVisible('input-attachment-loader');
    await chatPage.isElementNotVisible('input-attachment-loader');

    await chatPage.sendUserMessage('Who painted this?');

    const userMessage = await chatPage.getRecentUserMessage();
    expect(userMessage.attachments).toHaveLength(1);

    await chatPage.isGenerationComplete();

    const assistantMessage = await chatPage.getRecentAssistantMessage();
    expect(assistantMessage.content).toBe('This painting is by Monet!');
  });

  test('vote functionality works with cache', async () => {
    await chatPage.sendUserMessage('Why is the sky blue?');
    await chatPage.isGenerationComplete();

    const assistantMessage = await chatPage.getRecentAssistantMessage();

    // Test upvote
    await assistantMessage.upvote();
    await chatPage.isVoteComplete();

    // Test vote update
    await assistantMessage.downvote();
    await chatPage.isVoteComplete();
  });
});
