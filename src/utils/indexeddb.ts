/**
 * IndexedDB 存储服务
 *
 * 提供 IndexedDB 操作的封装，支持对话历史、加密密钥、执行历史的持久化
 */

import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';

/**
 * 数据库 Schema 定义
 */
interface EdgeFlowDB extends DBSchema {
  conversations: {
    key: string;
    value: Conversation;
    indexes: {
      'by-workflowId': string;
      'by-createdAt': number;
    };
  };
  encryptedKeys: {
    key: string;
    value: EncryptedKey;
    indexes: {
      'by-provider': string;
    };
  };
  executionHistory: {
    key: string;
    value: ExecutionHistoryEntry;
    indexes: {
      'by-workflowId': string;
      'by-timestamp': number;
    };
  };
}

/**
 * 对话记录
 */
export interface Conversation {
  id: string;
  workflowId: string;
  nodeId: string;
  messages: ConversationMessage[];
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
}

/**
 * 对话消息
 */
export interface ConversationMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: number;
}

/**
 * 加密密钥
 */
export interface EncryptedKey {
  id: string;
  provider: 'openai' | 'anthropic';
  encryptedValue: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * 执行历史条目
 */
export interface ExecutionHistoryEntry {
  id: string;
  workflowId: string;
  timestamp: number;
  results: Record<string, unknown>; // nodeId -> result
  status: 'success' | 'error';
  errorMessage?: string;
}

/**
 * IndexedDB 配置
 */
const DB_CONFIG = {
  name: 'EdgeFlowDB',
  version: 1,
  stores: {
    conversations: 'conversations',
    encryptedKeys: 'encryptedKeys',
    executionHistory: 'executionHistory',
  },
} as const;

/**
 * IndexedDB 服务类
 */
export class IndexedDBService {
  private db: IDBPDatabase<EdgeFlowDB> | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * 初始化数据库
   */
  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        this.db = await openDB<EdgeFlowDB>(DB_CONFIG.name, DB_CONFIG.version, {
          upgrade(db) {
            // 创建 conversations 对象存储
            if (!db.objectStoreNames.contains(DB_CONFIG.stores.conversations)) {
              const convStore = db.createObjectStore(DB_CONFIG.stores.conversations, {
                keyPath: 'id',
              });
              convStore.createIndex('by-workflowId', 'workflowId');
              convStore.createIndex('by-createdAt', 'createdAt');
            }

            // 创建 encryptedKeys 对象存储
            if (!db.objectStoreNames.contains(DB_CONFIG.stores.encryptedKeys)) {
              const keysStore = db.createObjectStore(DB_CONFIG.stores.encryptedKeys, {
                keyPath: 'id',
              });
              keysStore.createIndex('by-provider', 'provider');
            }

            // 创建 executionHistory 对象存储
            if (!db.objectStoreNames.contains(DB_CONFIG.stores.executionHistory)) {
              const historyStore = db.createObjectStore(DB_CONFIG.stores.executionHistory, {
                keyPath: 'id',
              });
              historyStore.createIndex('by-workflowId', 'workflowId');
              historyStore.createIndex('by-timestamp', 'timestamp');
            }
          },
        });

        console.log('[IndexedDBService] Database initialized successfully');

        // 检查是否需要从 localStorage 迁移数据
        await this.migrateFromLocalStorage();
      } catch (error) {
        console.error('[IndexedDBService] Failed to initialize database:', error);
        throw new Error('Failed to initialize IndexedDB');
      }
    })();

    return this.initPromise;
  }

  /**
   * 确保数据库已初始化
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.db) {
      await this.init();
    }
  }

  /**
   * 保存对话记录
   */
  async saveConversation(conv: Conversation): Promise<void> {
    await this.ensureInitialized();

    if (!this.db) throw new Error('Database not initialized');

    const tx = this.db.transaction(DB_CONFIG.stores.conversations, 'readwrite');
    const store = tx.objectStore(DB_CONFIG.stores.conversations);

    await store.put({
      ...conv,
      updatedAt: Date.now(),
    });

    await tx.done;
  }

  /**
   * 获取对话记录
   */
  async getConversation(id: string): Promise<Conversation | null> {
    await this.ensureInitialized();

    if (!this.db) throw new Error('Database not initialized');

    const tx = this.db.transaction(DB_CONFIG.stores.conversations, 'readonly');
    const store = tx.objectStore(DB_CONFIG.stores.conversations);

    const result = await store.get(id);
    return result ?? null;
  }

  /**
   * 获取工作流的所有对话记录
   */
  async getConversationsByWorkflowId(workflowId: string): Promise<Conversation[]> {
    await this.ensureInitialized();

    if (!this.db) throw new Error('Database not initialized');

    const tx = this.db.transaction(DB_CONFIG.stores.conversations, 'readonly');
    const store = tx.objectStore(DB_CONFIG.stores.conversations);
    const index = store.index('by-workflowId');

    const results = await index.getAll(workflowId);
    return results.sort((a, b) => b.updatedAt - a.updatedAt); // 按更新时间倒序
  }

  /**
   * 获取节点的对话记录
   */
  async getConversationsByNodeId(nodeId: string): Promise<Conversation[]> {
    await this.ensureInitialized();

    if (!this.db) throw new Error('Database not initialized');

    const tx = this.db.transaction(DB_CONFIG.stores.conversations, 'readonly');
    const store = tx.objectStore(DB_CONFIG.stores.conversations);

    const all = await store.getAll();
    return all.filter(c => c.nodeId === nodeId).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  /**
   * 删除对话记录
   */
  async deleteConversation(id: string): Promise<void> {
    await this.ensureInitialized();

    if (!this.db) throw new Error('Database not initialized');

    const tx = this.db.transaction(DB_CONFIG.stores.conversations, 'readwrite');
    const store = tx.objectStore(DB_CONFIG.stores.conversations);

    await store.delete(id);
    await tx.done;
  }

  /**
   * 清空所有对话记录
   */
  async clearAllConversations(): Promise<void> {
    await this.ensureInitialized();

    if (!this.db) throw new Error('Database not initialized');

    const tx = this.db.transaction(DB_CONFIG.stores.conversations, 'readwrite');
    const store = tx.objectStore(DB_CONFIG.stores.conversations);

    await store.clear();
    await tx.done;
  }

  /**
   * 保存加密密钥
   */
  async saveEncryptedKey(provider: 'openai' | 'anthropic', encrypted: string): Promise<void> {
    await this.ensureInitialized();

    if (!this.db) throw new Error('Database not initialized');

    const tx = this.db.transaction(DB_CONFIG.stores.encryptedKeys, 'readwrite');
    const store = tx.objectStore(DB_CONFIG.stores.encryptedKeys);

    const now = Date.now();
    const existingKey = await this.getEncryptedKey(provider);

    await store.put({
      id: existingKey?.id ?? `key-${provider}-${now}`,
      provider,
      encryptedValue: encrypted,
      createdAt: existingKey?.createdAt ?? now,
      updatedAt: now,
    });

    await tx.done;
  }

  /**
   * 获取加密密钥（返回完整对象）
   */
  async getEncryptedKey(provider: 'openai' | 'anthropic'): Promise<EncryptedKey | null> {
    await this.ensureInitialized();

    if (!this.db) throw new Error('Database not initialized');

    const tx = this.db.transaction(DB_CONFIG.stores.encryptedKeys, 'readonly');
    const store = tx.objectStore(DB_CONFIG.stores.encryptedKeys);
    const index = store.index('by-provider');

    const results = await index.getAll(provider);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * 获取加密密钥值（仅返回加密字符串）
   */
  async getEncryptedKeyValue(provider: 'openai' | 'anthropic'): Promise<string | null> {
    const keyObj = await this.getEncryptedKey(provider);
    return keyObj?.encryptedValue ?? null;
  }

  /**
   * 删除加密密钥
   */
  async deleteEncryptedKey(provider: 'openai' | 'anthropic'): Promise<void> {
    await this.ensureInitialized();

    if (!this.db) throw new Error('Database not initialized');

    const tx = this.db.transaction(DB_CONFIG.stores.encryptedKeys, 'readwrite');
    const store = tx.objectStore(DB_CONFIG.stores.encryptedKeys);
    const index = store.index('by-provider');

    const results = await index.getAllKeys(provider);

    for (const key of results) {
      await store.delete(key);
    }

    await tx.done;
  }

  /**
   * 保存执行历史
   */
  async saveExecutionHistory(entry: ExecutionHistoryEntry): Promise<void> {
    await this.ensureInitialized();

    if (!this.db) throw new Error('Database not initialized');

    const tx = this.db.transaction(DB_CONFIG.stores.executionHistory, 'readwrite');
    const store = tx.objectStore(DB_CONFIG.stores.executionHistory);

    await store.put(entry);
    await tx.done;

    // 限制历史记录数量（最多保留 100 条）
    await this.pruneExecutionHistory();
  }

  /**
   * 获取工作流的执行历史
   */
  async getExecutionHistory(workflowId: string, limit = 50): Promise<ExecutionHistoryEntry[]> {
    await this.ensureInitialized();

    if (!this.db) throw new Error('Database not initialized');

    const tx = this.db.transaction(DB_CONFIG.stores.executionHistory, 'readonly');
    const store = tx.objectStore(DB_CONFIG.stores.executionHistory);
    const index = store.index('by-workflowId');

    const results = await index.getAll(workflowId);
    return results
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * 删除执行历史
   */
  async deleteExecutionHistory(id: string): Promise<void> {
    await this.ensureInitialized();

    if (!this.db) throw new Error('Database not initialized');

    const tx = this.db.transaction(DB_CONFIG.stores.executionHistory, 'readwrite');
    const store = tx.objectStore(DB_CONFIG.stores.executionHistory);

    await store.delete(id);
    await tx.done;
  }

  /**
   * 清空执行历史
   */
  async clearAllExecutionHistory(): Promise<void> {
    await this.ensureInitialized();

    if (!this.db) throw new Error('Database not initialized');

    const tx = this.db.transaction(DB_CONFIG.stores.executionHistory, 'readwrite');
    const store = tx.objectStore(DB_CONFIG.stores.executionHistory);

    await store.clear();
    await tx.done;
  }

  /**
   * 清理执行历史（最多保留 100 条）
   */
  private async pruneExecutionHistory(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const tx = this.db.transaction(DB_CONFIG.stores.executionHistory, 'readonly');
    const store = tx.objectStore(DB_CONFIG.stores.executionHistory);

    const all = await store.getAll();

    if (all.length <= 100) return;

    // 按时间倒序，删除超出 100 条的旧记录
    const toDelete = all
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(0, all.length - 100);

    const tx2 = this.db.transaction(DB_CONFIG.stores.executionHistory, 'readwrite');
    const store2 = tx2.objectStore(DB_CONFIG.stores.executionHistory);

    for (const entry of toDelete) {
      await store2.delete(entry.id);
    }

    await tx2.done;
  }

  /**
   * 从 localStorage 迁移数据
   */
  private async migrateFromLocalStorage(): Promise<void> {
    try {
      // 迁移对话历史
      const conversationHistoryKey = 'edgeflow-storage';
      const oldData = localStorage.getItem(conversationHistoryKey);

      if (oldData) {
        try {
          const parsed = JSON.parse(oldData);
          const { conversationHistory } = parsed as { conversationHistory?: Record<string, unknown> };

          if (conversationHistory && typeof conversationHistory === 'object') {
            console.log('[IndexedDBService] Migrating conversation history from localStorage...');

            // 遍历所有对话历史，转换为 IndexedDB 格式
            for (const [nodeId, messages] of Object.entries(conversationHistory)) {
              if (Array.isArray(messages)) {
                const conv: Conversation = {
                  id: `conv-migrated-${nodeId}`,
                  workflowId: 'migrated',
                  nodeId,
                  messages: messages as ConversationMessage[],
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                };
                await this.saveConversation(conv);
              }
            }

            console.log('[IndexedDBService] Conversation history migration completed');
          }
        } catch (parseError) {
          console.error('[IndexedDBService] Failed to parse localStorage data:', parseError);
        }
      }

      // 注意：不删除 localStorage，因为可能还有其他数据（nodes, edges 等）
      // 这些数据应该在迁移完成后由用户手动清理
    } catch (error) {
      console.error('[IndexedDBService] Migration failed:', error);
      // 迁移失败不应阻止应用运行
    }
  }

  /**
   * 获取数据库统计信息
   */
  async getStats(): Promise<{
    conversations: number;
    encryptedKeys: number;
    executionHistory: number;
  }> {
    await this.ensureInitialized();

    if (!this.db) throw new Error('Database not initialized');

    const [conversations, encryptedKeys, executionHistory] = await Promise.all([
      this.db.count(DB_CONFIG.stores.conversations),
      this.db.count(DB_CONFIG.stores.encryptedKeys),
      this.db.count(DB_CONFIG.stores.executionHistory),
    ]);

    return {
      conversations,
      encryptedKeys,
      executionHistory,
    };
  }

  /**
   * 清空所有数据（危险操作）
   */
  async clearAll(): Promise<void> {
    await this.ensureInitialized();

    if (!this.db) throw new Error('Database not initialized');

    await Promise.all([
      this.clearAllConversations(),
      this.clearAllExecutionHistory(),
    ]);

    // 加密密钥不清空，由用户手动删除
    console.log('[IndexedDBService] All data cleared except encrypted keys');
  }

  /**
   * 关闭数据库连接
   */
  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }
}

// 导出单例
export const indexedDBService = new IndexedDBService();
