import Redis from 'ioredis';

// Valkey (Redis-compatible) cache client
const redis = new Redis(process.env.VALKEY_URL || process.env.REDIS_URL || 'redis://localhost:6379');

// Cache TTL in seconds
const CACHE_TTL = {
  CHATS: 300, // 5 minutes
  MESSAGES: 600, // 10 minutes
  USER: 1800, // 30 minutes
  DOCUMENTS: 900, // 15 minutes
} as const;

// Cache keys
const CACHE_KEYS = {
  CHATS_BY_USER: (userId: string, limit: number, cursor?: string) =>
    `chats:user:${userId}:limit:${limit}:cursor:${cursor || 'none'}`,
  MESSAGES_BY_CHAT: (chatId: string) => `messages:chat:${chatId}`,
  USER_BY_EMAIL: (email: string) => `user:email:${email}`,
  DOCUMENTS_BY_ID: (id: string) => `documents:id:${id}`,
  DOCUMENT_BY_ID: (id: string) => `document:id:${id}`,
} as const;

// Generic cache functions
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

export async function setCached<T>(key: string, data: T, ttl: number): Promise<void> {
  try {
    await redis.setex(key, ttl, JSON.stringify(data));
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

export async function invalidateCache(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (error) {
    console.error('Cache invalidate error:', error);
  }
}

export async function invalidatePattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Cache invalidate pattern error:', error);
  }
}

// Specific cache functions
export const cache = {
  // Chat caching
  getChatsByUser: (userId: string, limit: number, cursor?: string) =>
    getCached(CACHE_KEYS.CHATS_BY_USER(userId, limit, cursor)),

  setChatsByUser: (userId: string, limit: number, data: any, cursor?: string) =>
    setCached(CACHE_KEYS.CHATS_BY_USER(userId, limit, cursor), data, CACHE_TTL.CHATS),

  invalidateUserChats: (userId: string) =>
    invalidatePattern(`chats:user:${userId}:*`),

  // Message caching
  getMessagesByChat: (chatId: string) =>
    getCached(CACHE_KEYS.MESSAGES_BY_CHAT(chatId)),

  setMessagesByChat: (chatId: string, data: any) =>
    setCached(CACHE_KEYS.MESSAGES_BY_CHAT(chatId), data, CACHE_TTL.MESSAGES),

  invalidateChatMessages: (chatId: string) =>
    invalidateCache(CACHE_KEYS.MESSAGES_BY_CHAT(chatId)),

  // User caching
  getUserByEmail: (email: string) =>
    getCached(CACHE_KEYS.USER_BY_EMAIL(email)),

  setUserByEmail: (email: string, data: any) =>
    setCached(CACHE_KEYS.USER_BY_EMAIL(email), data, CACHE_TTL.USER),

  invalidateUser: (email: string) =>
    invalidateCache(CACHE_KEYS.USER_BY_EMAIL(email)),

  // Document caching
  getDocumentsById: (id: string) =>
    getCached(CACHE_KEYS.DOCUMENTS_BY_ID(id)),

  setDocumentsById: (id: string, data: any) =>
    setCached(CACHE_KEYS.DOCUMENTS_BY_ID(id), data, CACHE_TTL.DOCUMENTS),

  getDocumentById: (id: string) =>
    getCached(CACHE_KEYS.DOCUMENT_BY_ID(id)),

  setDocumentById: (id: string, data: any) =>
    setCached(CACHE_KEYS.DOCUMENT_BY_ID(id), data, CACHE_TTL.DOCUMENTS),

  invalidateDocuments: (id: string) => {
    invalidateCache(CACHE_KEYS.DOCUMENTS_BY_ID(id));
    invalidateCache(CACHE_KEYS.DOCUMENT_BY_ID(id));
  },
};

export { redis, CACHE_TTL, CACHE_KEYS };

