'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  MessageCircleQuestion,
  Loader2,
  ChevronDown,
  AlertCircle,
  FileText,
  Clock,
  Sparkles,
  AlertTriangle,
  X,
  Plus,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Slider } from '@/components/ui/slider'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { FieldGroup, Field, FieldLabel, FieldError } from '@/components/ui/field'
import { PageHeader } from '@/components/page-header'
import { useAppContext } from '@/lib/context'
import api from '@/lib/api'
import type { QueryInstanceResponse, ApiError, FilterClause } from '@/lib/types'

const askSchema = z.object({
  question: z.string().min(1, 'Question is required'),
  top_k: z.number().min(1).max(50).default(5),
})

type AskForm = z.infer<typeof askSchema>

export default function AskPage() {
  const {
    activeInstanceId,
    activeNamespaceId,
    activeInstanceName,
    hasContext,
  } = useAppContext()

  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [response, setResponse] = useState<QueryInstanceResponse | null>(null)
  const [expandedSources, setExpandedSources] = useState<Set<string | number>>(
    new Set()
  )

  // Advanced settings
  const [mode, setMode] = useState<'semantic' | 'hybrid'>('semantic')
  const [hybridMethod, setHybridMethod] = useState<'rrf' | 'dbsf'>('rrf')
  const [denseWeight, setDenseWeight] = useState(0.7)
  const [keywordWeight, setKeywordWeight] = useState(0.3)
  const [filters, setFilters] = useState<FilterClause[]>([])

  const form = useForm<AskForm>({
    resolver: zodResolver(askSchema),
    defaultValues: {
      question: '',
      top_k: 5,
    },
  })

  const askMutation = useMutation({
    mutationFn: async (data: AskForm) => {
      if (!activeInstanceId || !activeNamespaceId) {
        throw new Error('Context not set')
      }

      if (advancedOpen) {
        return api.queryAdvanced({
          instance_id: activeInstanceId,
          namespace_id: activeNamespaceId,
          question: data.question,
          top_k: data.top_k,
          mode,
          hybrid:
            mode === 'hybrid'
              ? {
                  method: hybridMethod,
                  dense_weight: denseWeight,
                  keyword_weight: keywordWeight,
                }
              : undefined,
          filters: filters.length > 0 ? { must: filters } : undefined,
        })
      }

      return api.queryInstance({
        instance_id: activeInstanceId,
        namespace_id: activeNamespaceId,
        question: data.question,
        top_k: data.top_k,
      })
    },
    onSuccess: (data) => {
      setResponse(data)
    },
    onError: (error: ApiError) => {
      toast.error('Query failed', {
        description: error.message,
      })
    },
  })

  const onSubmit = (data: AskForm) => {
    askMutation.mutate(data)
  }

  const toggleSourceExpand = (id: string | number) => {
    setExpandedSources((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const addFilter = () => {
    setFilters([...filters, { field: '', op: 'eq', value: '' }])
  }

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index))
  }

  const updateFilter = (
    index: number,
    updates: Partial<FilterClause>
  ) => {
    setFilters(
      filters.map((f, i) => (i === index ? { ...f, ...updates } : f))
    )
  }

  const isNoAnswer =
    response?.answer?.toLowerCase().includes("i don't know") ||
    response?.answer?.toLowerCase().includes('i do not know')

  if (!hasContext) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-6">
        <PageHeader
          title="Ask"
          description="Ask questions about your documents"
        />
        <div className="flex items-start gap-3 rounded-xl border border-white/6 bg-[#111] px-5 py-4">
          <AlertCircle
            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/40"
            strokeWidth={1.5}
          />
          <div>
            <p className="text-xs font-medium text-white/80">Context Required</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground/40">
            Please select an instance and namespace from the top bar to ask
            questions.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <PageHeader
        title="Ask"
        description={`Ask questions about ${activeInstanceName} / ${activeNamespaceId}`}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Question Form */}
        <div className="space-y-6">
          <Card className="border-white/6 bg-[#111]">
            <CardContent className="pt-5">
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <FieldGroup className="gap-4">
                  <Field>
                    <FieldLabel className="text-[11px] uppercase tracking-wide text-muted-foreground/50 font-medium">
                      Your Question
                    </FieldLabel>
                    <Textarea
                      placeholder="What would you like to know about your documents?"
                      rows={4}
                      className="rounded-lg border-white/6 bg-white/3 text-xs placeholder:text-muted-foreground/25 focus-visible:border-white/12 focus-visible:ring-0"
                      {...form.register('question')}
                    />
                    {form.formState.errors.question && (
                      <FieldError className="text-[11px]">
                        {form.formState.errors.question.message}
                      </FieldError>
                    )}
                  </Field>

                  <div className="flex items-end gap-4">
                    <Field className="w-32">
                      <FieldLabel className="text-[11px] uppercase tracking-wide text-muted-foreground/50 font-medium">
                        Top K
                      </FieldLabel>
                      <Input
                        type="number"
                        min={1}
                        max={50}
                        className="h-8 rounded-lg border-white/6 bg-white/3 text-xs focus-visible:border-white/12 focus-visible:ring-0"
                        {...form.register('top_k', { valueAsNumber: true })}
                      />
                    </Field>
                    <Button
                      type="submit"
                      size="sm"
                      className="h-8 rounded-lg text-xs"
                      disabled={askMutation.isPending}
                    >
                      {askMutation.isPending && (
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      )}
                      <MessageCircleQuestion className="mr-2 h-3.5 w-3.5" />
                      Ask
                    </Button>
                  </div>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>

          {/* Advanced Options */}
          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <Card className="border-white/6 bg-[#111]">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer py-4 transition-colors hover:bg-white/4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-white">
                      Advanced Options
                    </CardTitle>
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-muted-foreground/40 transition-transform ${advancedOpen ? 'rotate-180' : ''}`}
                      strokeWidth={1.5}
                    />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-6 border-t border-white/6 pt-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field>
                      <FieldLabel className="text-[11px] uppercase tracking-wide text-muted-foreground/50 font-medium">
                        Mode
                      </FieldLabel>
                      <Select
                        value={mode}
                        onValueChange={(v: 'semantic' | 'hybrid') => setMode(v)}
                      >
                        <SelectTrigger className="h-8 rounded-lg border-white/6 bg-white/3 text-xs focus-visible:border-white/12 focus-visible:ring-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg border-white/8 bg-[#1a1a1a] p-1">
                          <SelectItem
                            value="semantic"
                            className="rounded-md px-2.5 py-1.5 text-xs"
                          >
                            Semantic
                          </SelectItem>
                          <SelectItem
                            value="hybrid"
                            className="rounded-md px-2.5 py-1.5 text-xs"
                          >
                            Hybrid
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>

                    {mode === 'hybrid' && (
                      <Field>
                        <FieldLabel className="text-[11px] uppercase tracking-wide text-muted-foreground/50 font-medium">
                          Hybrid Method
                        </FieldLabel>
                        <Select
                          value={hybridMethod}
                          onValueChange={(v: 'rrf' | 'dbsf') =>
                            setHybridMethod(v)
                          }
                        >
                          <SelectTrigger className="h-8 rounded-lg border-white/6 bg-white/3 text-xs focus-visible:border-white/12 focus-visible:ring-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg border-white/8 bg-[#1a1a1a] p-1">
                            <SelectItem
                              value="rrf"
                              className="rounded-md px-2.5 py-1.5 text-xs"
                            >
                              RRF
                            </SelectItem>
                            <SelectItem
                              value="dbsf"
                              className="rounded-md px-2.5 py-1.5 text-xs"
                            >
                              DBSF
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                    )}
                  </div>

                  {mode === 'hybrid' && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field>
                        <FieldLabel className="text-[11px] uppercase tracking-wide text-muted-foreground/50 font-medium">
                          Dense Weight: {denseWeight.toFixed(2)}
                        </FieldLabel>
                        <Slider
                          value={[denseWeight]}
                          onValueChange={([v]) => setDenseWeight(v)}
                          min={0}
                          max={1}
                          step={0.05}
                        />
                      </Field>
                      <Field>
                        <FieldLabel className="text-[11px] uppercase tracking-wide text-muted-foreground/50 font-medium">
                          Keyword Weight: {keywordWeight.toFixed(2)}
                        </FieldLabel>
                        <Slider
                          value={[keywordWeight]}
                          onValueChange={([v]) => setKeywordWeight(v)}
                          min={0}
                          max={1}
                          step={0.05}
                        />
                      </Field>
                    </div>
                  )}

                  {/* Filters */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <FieldLabel className="text-[11px] uppercase tracking-wide text-muted-foreground/50 font-medium">
                        Filters (must)
                      </FieldLabel>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 rounded-lg px-2.5 text-[11px] text-muted-foreground/50 hover:bg-white/6 hover:text-white"
                        onClick={addFilter}
                      >
                        <Plus className="mr-1 h-3 w-3" strokeWidth={1.5} />
                        Add Filter
                      </Button>
                    </div>
                    {filters.length > 0 ? (
                      <div className="space-y-2">
                        {filters.map((filter, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 rounded-lg border border-white/6 bg-white/2 p-2"
                          >
                            <Input
                              placeholder="Field"
                              value={filter.field}
                              onChange={(e) =>
                                updateFilter(index, { field: e.target.value })
                              }
                              className="h-8 flex-1 rounded-lg border-white/6 bg-white/3 text-xs focus-visible:border-white/12 focus-visible:ring-0"
                            />
                            <Select
                              value={filter.op}
                              onValueChange={(
                                op: FilterClause['op']
                              ) => updateFilter(index, { op })}
                            >
                              <SelectTrigger className="h-8 w-24 rounded-lg border-white/6 bg-white/3 text-xs focus-visible:border-white/12 focus-visible:ring-0">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="rounded-lg border-white/8 bg-[#1a1a1a] p-1">
                                <SelectItem value="eq" className="rounded-md px-2.5 py-1.5 text-xs">eq</SelectItem>
                                <SelectItem value="ne" className="rounded-md px-2.5 py-1.5 text-xs">ne</SelectItem>
                                <SelectItem value="gt" className="rounded-md px-2.5 py-1.5 text-xs">gt</SelectItem>
                                <SelectItem value="gte" className="rounded-md px-2.5 py-1.5 text-xs">gte</SelectItem>
                                <SelectItem value="lt" className="rounded-md px-2.5 py-1.5 text-xs">lt</SelectItem>
                                <SelectItem value="lte" className="rounded-md px-2.5 py-1.5 text-xs">lte</SelectItem>
                                <SelectItem value="any_of" className="rounded-md px-2.5 py-1.5 text-xs">any_of</SelectItem>
                                <SelectItem value="contains" className="rounded-md px-2.5 py-1.5 text-xs">
                                  contains
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              placeholder="Value"
                              value={String(filter.value)}
                              onChange={(e) =>
                                updateFilter(index, { value: e.target.value })
                              }
                              className="h-8 flex-1 rounded-lg border-white/6 bg-white/3 text-xs focus-visible:border-white/12 focus-visible:ring-0"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 rounded-lg p-0 text-muted-foreground/40 hover:bg-white/6 hover:text-white"
                              onClick={() => removeFilter(index)}
                            >
                              <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground/40">
                        No filters added
                      </p>
                    )}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Answer Panel */}
          {(askMutation.isPending || response) && (
            <Card className="border-white/6 bg-[#111]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-white">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Answer
                  </CardTitle>
                  {response && (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground/50">
                      <span className="flex items-center gap-1 tabular-nums">
                        <Clock className="h-3 w-3" strokeWidth={1.5} />
                        {response.response_ms}ms
                      </span>
                      <Badge className="border border-white/6 bg-white/3 text-[10px] text-muted-foreground/60">
                        {response.llm_profile}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {askMutation.isPending ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                ) : response ? (
                  <>
                    {isNoAnswer && (
                      <Alert className="mb-4 border-amber-300/20 bg-amber-300/8">
                        <AlertTriangle className="h-4 w-4 text-amber-200/80" />
                        <AlertDescription className="text-xs text-amber-100/75">
                          The system could not find relevant information to
                          answer this question. Try rephrasing or check if the
                          information exists in your documents.
                        </AlertDescription>
                      </Alert>
                    )}
                    <p className="text-sm leading-relaxed text-white/85">
                      {response.answer}
                    </p>
                  </>
                ) : null}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sources Panel */}
        <Card className="h-fit border-white/6 bg-[#111] lg:sticky lg:top-20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-white">
              Sources ({response?.sources?.length ?? 0})
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground/45">
              Citations used to generate the answer
            </CardDescription>
          </CardHeader>
          <CardContent>
            {askMutation.isPending ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-lg bg-white/3" />
                ))}
              </div>
            ) : response?.sources && response.sources.length > 0 ? (
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-3">
                  {response.sources.map((source, index) => (
                    <div
                      key={source.id}
                      className="rounded-lg border border-white/6 bg-[#141414] p-3 transition-colors duration-150 hover:bg-white/4"
                      style={{ animationDelay: `${index * 0.04}s` }}
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <FileText
                            className="h-3.5 w-3.5 shrink-0 text-muted-foreground/35"
                            strokeWidth={1.5}
                          />
                          <span className="truncate text-sm font-medium text-white/90">
                            {source.source_ref}
                          </span>
                        </div>
                        <Badge className="shrink-0 border border-white/6 bg-white/3 text-[10px] text-white/75">
                          {source.score.toFixed(3)}
                        </Badge>
                      </div>
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        <Badge className="border border-white/6 bg-white/3 text-[10px] text-muted-foreground/60">
                          {source.namespace_id}
                        </Badge>
                        <Badge className="border border-white/6 bg-white/3 text-[10px] text-muted-foreground/60">
                          Chunk {source.chunk_index}
                        </Badge>
                      </div>
                      <p
                        className={`text-xs text-muted-foreground/45 ${
                          expandedSources.has(source.id) ? '' : 'line-clamp-3'
                        }`}
                      >
                        {source.text}
                      </p>
                      {source.text.length > 150 && (
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-[11px] text-muted-foreground/55 hover:text-white"
                          onClick={() => toggleSourceExpand(source.id)}
                        >
                          {expandedSources.has(source.id)
                            ? 'Show less'
                            : 'Show more'}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageCircleQuestion className="mb-4 h-8 w-8 text-muted-foreground/35" />
                <p className="text-sm font-medium text-white/85">No sources yet</p>
                <p className="text-xs text-muted-foreground/40">
                  Ask a question to see relevant sources
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
