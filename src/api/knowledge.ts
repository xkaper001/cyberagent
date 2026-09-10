import { apiClient } from './client';
import { KnowledgeItem } from '../types/cyber';

export const searchKnowledge = async (query: string = ''): Promise<KnowledgeItem[]> => {
  return apiClient.get<KnowledgeItem[]>('/knowledge/search', { q: query });
};
