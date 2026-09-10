import { apiClient } from './client';
import { AgentProfile } from '../types/cyber';

export const getAgents = async (): Promise<AgentProfile[]> => {
  return apiClient.get<AgentProfile[]>('/agents');
};
