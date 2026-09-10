import { apiClient } from './client';
import { SecurityReport } from '../types/cyber';

export const getReports = async (): Promise<SecurityReport[]> => {
  return apiClient.get<SecurityReport[]>('/reports');
};

export const getReportById = async (id: string): Promise<SecurityReport> => {
  return apiClient.get<SecurityReport>(`/reports/${id}`);
};
