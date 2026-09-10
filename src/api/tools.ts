import { apiClient } from './client';

export interface ToolExecutePayload {
  tool_name: string;
  input_data: Record<string, any>;
}

export async function executeTool(tool_name: string, input_data: Record<string, any> = {}): Promise<any> {
  return apiClient.post<any>('/tool-executions', {
    tool_name,
    input_data
  });
}

export async function listAllowlistedTools(): Promise<any[]> {
  return apiClient.get<any[]>('/tool-executions/allowlist');
}
