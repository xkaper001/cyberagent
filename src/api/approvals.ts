import { apiClient } from './client';

export const approveAction = async (id: string): Promise<{ status: string; approval: any }> => {
  return apiClient.post<{ status: string; approval: any }>(`/approval/${id}/approve`);
};

export const rejectAction = async (id: string): Promise<{ status: string; approval: any }> => {
  return apiClient.post<{ status: string; approval: any }>(`/approval/${id}/reject`);
};
