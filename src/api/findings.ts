import { apiClient } from './client';
import { Finding } from '../types/cyber';

export const getFindings = async (severity?: string): Promise<Finding[]> => {
  const params: Record<string, string> = {};
  if (severity) {
    params.severity = severity;
  }
  return apiClient.get<Finding[]>('/findings', params);
};

export const getFindingById = async (id: string): Promise<Finding> => {
  return apiClient.get<Finding>(`/findings/${id}`);
};
