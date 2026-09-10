import { AgentStep, Message } from '../types/cyber';

export interface ChatStreamOptions {
  message: string;
  conversationId?: string;
  assessmentId?: string;
  onStart?: (conversationId: string) => void;
  onEvent?: (event: any) => void;
  onAgentStep?: (step: AgentStep) => void;
  onDelta?: (delta: string) => void;
  onComplete?: (message: Message) => void;
  onError?: (error: Error) => void;
}

export async function streamChatResponse(options: ChatStreamOptions): Promise<void> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  
  try {
    const response = await fetch(`${baseUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        message: options.message,
        conversation_id: options.conversationId,
        assessment_id: options.assessmentId,
      }),
    });

    if (!response.ok) {
      let errText = `HTTP Error ${response.status}`;
      try {
        const errJson = await response.json();
        errText = errJson.error?.message || errJson.detail || errText;
      } catch {}
      throw new Error(errText);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');

      // Keep the last line if it's incomplete
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;

        const dataStr = trimmed.substring(5).trim();
        if (dataStr === '[DONE]') break;

        try {
          const parsed = JSON.parse(dataStr);
          
          if (options.onEvent) {
            options.onEvent(parsed);
          }

          if (parsed.event === 'message_start' && options.onStart) {
            options.onStart(parsed.conversation_id || 'conv-1');
          } else if (parsed.event === 'agent_step' && options.onAgentStep) {
            options.onAgentStep(parsed.step);
          } else if (parsed.event === 'message_delta' && options.onDelta) {
            options.onDelta(parsed.delta);
          } else if (parsed.event === 'message_complete' && options.onComplete) {
            const messagePayload: Message = {
              id: parsed.id || `msg-${Date.now()}`,
              role: 'assistant',
              content: parsed.content,
              timestamp: parsed.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              agentActivity: parsed.agentActivity,
              findings: parsed.findings,
              references: parsed.references,
            };
            options.onComplete(messagePayload);
          }
        } catch (e) {
          console.warn('Failed to parse SSE JSON payload:', dataStr, e);
        }
      }
    }
  } catch (error: any) {
    if (options.onError) {
      options.onError(error instanceof Error ? error : new Error(String(error)));
    } else {
      console.error('Chat stream error:', error);
    }
  }
}
