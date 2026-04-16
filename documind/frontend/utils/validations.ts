import { z } from 'zod'

export const createInstanceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
})

export const createKnowledgeBaseSchema = z.object({
  instance_id: z.string().min(1, 'Instance is required'),
  namespace_id: z.string().min(1, 'Namespace is required'),
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  embedding_profile: z.string().optional(),
  embedding_model: z.string().optional(),
  llm_profile: z.string().optional(),
  distance_metric: z.enum(['cosine', 'euclidean', 'dot']).optional(),
})

export const ingestResourceSchema = z.object({
  source_type: z.enum(['text', 'markdown', 'pdf', 'html', 'docx']),
  content: z.string().min(1, 'Content is required'),
  source_ref: z.string().optional(),
  user_id: z.string().optional(),
  session_id: z.string().optional(),
})

export const crawlPreviewSchema = z.object({
  kb_id: z.string().optional(),
  instance_id: z.string().optional(),
  namespace_id: z.string().default('company_docs'),
  url: z.string().url('Please enter a valid URL'),
  crawl_subpages: z.boolean().default(false),
  max_pages: z.number().min(1).max(100).default(20),
})

export const crawlIngestSchema = crawlPreviewSchema.extend({
  urls: z.array(z.string().url()).optional(),
})

export const searchSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  top_k: z.number().min(1).max(50).default(5),
})

export const askSchema = z.object({
  question: z.string().min(1, 'Question is required'),
  top_k: z.number().min(1).max(50).default(5),
})

export type CreateInstanceBody = z.infer<typeof createInstanceSchema>
export type CreateKnowledgeBaseBody = z.infer<typeof createKnowledgeBaseSchema>
export type IngestResourceBody = z.infer<typeof ingestResourceSchema>
export type CrawlPreviewBody = z.infer<typeof crawlPreviewSchema>
export type CrawlIngestBody = z.infer<typeof crawlIngestSchema>
export type SearchBody = z.infer<typeof searchSchema>
export type AskBody = z.infer<typeof askSchema>
