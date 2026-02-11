import { z } from 'zod';

// OpenAI message schema
export const openaiMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string().min(1, 'Message content cannot be empty'),
});

// OpenAI chat request schema
export const openaiChatRequestSchema = z.object({
  messages: z
    .array(openaiMessageSchema)
    .min(1, 'At least one message is required')
    .max(50, 'Maximum 50 messages allowed'),
  model: z.string().optional().default('gpt-4o-mini'),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().int().positive().max(16000).optional(),
});

export type OpenAIChatRequest = z.infer<typeof openaiChatRequestSchema>;
export type OpenAIMessage = z.infer<typeof openaiMessageSchema>;
