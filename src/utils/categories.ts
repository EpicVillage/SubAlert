import { Category } from '../types';

export const defaultCategories: Category[] = [
  { id: 'ai', name: 'AI & Machine Learning', color: '#8b5cf6', emoji: '🤖', isCustom: false },
  { id: 'messaging', name: 'Messaging & Communication', color: '#3b82f6', emoji: '💬', isCustom: false },
  { id: 'payment', name: 'Payment Processing', color: '#10b981', emoji: '💳', isCustom: false },
  { id: 'storage', name: 'Cloud Storage', color: '#f59e0b', emoji: '☁️', isCustom: false },
  { id: 'analytics', name: 'Analytics & Monitoring', color: '#ef4444', emoji: '📊', isCustom: false },
  { id: 'crypto', name: 'Cryptocurrency', color: '#f97316', emoji: '₿', isCustom: false },
  { id: 'defi', name: 'DeFi Protocols', color: '#8b5cf6', emoji: '🏦', isCustom: false },
  { id: 'exchange', name: 'Crypto Exchanges', color: '#06b6d4', emoji: '💱', isCustom: false },
  { id: 'blockchain', name: 'Blockchain Infrastructure', color: '#6366f1', emoji: '⛓️', isCustom: false },
  { id: 'node', name: 'Node Services', color: '#84cc16', emoji: '🖥️', isCustom: false },
  { id: 'rpc', name: 'RPC Providers', color: '#14b8a6', emoji: '🔌', isCustom: false },
  { id: 'indexer', name: 'Blockchain Indexers', color: '#a855f7', emoji: '🔍', isCustom: false },
  { id: 'oracle', name: 'Oracle Services', color: '#ec4899', emoji: '🔮', isCustom: false },
  { id: 'ipfs', name: 'IPFS & Decentralized Storage', color: '#0ea5e9', emoji: '🌐', isCustom: false },
  { id: 'other', name: 'Other Services', color: '#6b7280', emoji: '📦', isCustom: false }
];

export const getCategoryById = (categories: Category[], id: string): Category | undefined => {
  return categories.find(cat => cat.id === id);
};

export const generateCategoryId = (): string => {
  return `custom_${Date.now()}`;
};