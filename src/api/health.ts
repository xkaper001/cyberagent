import { apiClient } from './client';

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  demo_mode: boolean;
  langgraph_status: string;
  database: string;
}

export const getHealth = async (): Promise<HealthResponse> => {
  return apiClient.get<HealthResponse>('/health');
};
