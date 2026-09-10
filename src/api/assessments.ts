import { apiClient } from './client';
import { Assessment } from '../types/cyber';

export interface CreateAssessmentPayload {
  target: string;
  environment?: string;
  scope?: string;
}

export interface AuthorizeAssessmentPayload {
  authorized: boolean;
  target?: string;
}

export const getAssessments = async (): Promise<Assessment[]> => {
  return apiClient.get<Assessment[]>('/assessments');
};

export const getAssessmentById = async (id: string): Promise<Assessment> => {
  return apiClient.get<Assessment>(`/assessments/${id}`);
};

export const createAssessment = async (payload: CreateAssessmentPayload): Promise<Assessment> => {
  return apiClient.post<Assessment>('/assessments', payload);
};

export const authorizeAssessment = async (id: string, payload: AuthorizeAssessmentPayload = { authorized: true }): Promise<{
  assessment_id: string;
  authorization_status: string;
  status: string;
  target: string;
  target_ip: string;
}> => {
  return apiClient.post<{
    assessment_id: string;
    authorization_status: string;
    status: string;
    target: string;
    target_ip: string;
  }>(`/assessments/${id}/authorization`, payload);
};
