import { z } from 'zod';
import { insertAccountSchema, accounts } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  accounts: {
    list: {
      method: 'GET' as const,
      path: '/api/accounts' as const,
      responses: {
        200: z.array(z.custom<typeof accounts.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/accounts' as const,
      input: insertAccountSchema,
      responses: {
        201: z.custom<typeof accounts.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/accounts/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  bot: {
    status: {
      method: 'GET' as const,
      path: '/api/bot/status' as const,
      responses: {
        200: z.object({ online: z.boolean(), username: z.string().optional() }),
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type AccountInput = z.infer<typeof api.accounts.create.input>;
export type AccountResponse = z.infer<typeof api.accounts.create.responses[201]>;
export type AccountsListResponse = z.infer<typeof api.accounts.list.responses[200]>;
export type BotStatusResponse = z.infer<typeof api.bot.status.responses[200]>;
