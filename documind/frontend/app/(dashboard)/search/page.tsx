'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Search,
  Loader2,
  ChevronDown,
  AlertCircle,
  FileText,
  X,
  Plus,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Slider } from '@/components/ui/slider'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { FieldGroup, Field, FieldLabel, FieldError } from '@/components/ui/field'
import { PageHeader } from '@/components/page-header'
import { useAppContext } from '@/lib/context'
import api from '@/lib/api'
import type { SearchResult, ApiError, FilterClause } from '@/lib/types'

const searchSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  top_k: z.number().min(1).max(50).default(5),
})

type SearchForm = z.infer<typeof searchSchema>

export default function SearchPage() {
  const {
    activeInstanceId,
    activeNamespaceId,
    activeInstanceName,
    hasContext,
  } = useAppContext()

  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [expandedResults, setExpandedResults] = useState<Set<string | number>>(
    new Set()
  )

  // Advanced settings
  const [mode, setMode] = useState<'semantic' | 'hybrid'>('semantic')
  const [hybridMethod, setHybridMethod] = useState<'rrf' | 'dbsf'>('rrf')
  const [denseWeight, setDenseWeight] = useState(0.7)
  const [keywordWeight, setKeywordWeight] = useState(0.3)
  const [filters, setFilters] = useState<FilterClause[]>([])

  const form = useForm<SearchForm>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      query: '',
      top_k: 5,
    },
  })

  const searchMutation = useMutation({
    mutationFn: async (data: SearchForm) => {
      if (!activeInstanceId || !activeNamespaceId) {
        throw new Error('Context not set')
      }

      if (advancedOpen) {
        return api.searchAdvanced({
          instance_id: activeInstanceId,
          namespace_id: activeNamespaceId,
          query: data.query,
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

      return api.searchInstance({
        instance_id: activeInstanceId,
        namespace_id: activeNamespaceId,
        query: data.query,
        top_k: data.top_k,
      })
    },
    onSuccess: (data) => {
      setResults(data.results)
      if (data.results.length === 0) {
        toast.info('No results found', {
          description: 'Try adjusting your query or filters.',
        })
      }
    },
    onError: (error: ApiError) => {
      toast.error('Search failed', {
        description: error.message,
      })
    },
  })

  const onSubmit = (data: SearchForm) => {
    searchMutation.mutate(data)
  }

  const toggleResultExpand = (id: string | number) => {
    setExpandedResults((prev) => {
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

  if (!hasContext) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-6">
        <PageHeader title="Search" description="Search your knowledge bases" />
        <div className="flex items-start gap-3 rounded-xl border border-white/6 bg-[#111] px-5 py-4">
          <AlertCircle
            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/40"
            strokeWidth={1.5}
          />
          <div>
            <p className="text-xs font-medium text-white/80">Context Required</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground/40">
            Please select an instance and namespace from the top bar to search.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <PageHeader
        title="Search"
        description={`Search within ${activeInstanceName} / ${activeNamespaceId}`}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Search Form */}
        <div className="space-y-6">
          <Card className="border-white/6 bg-[#111]">
            <CardContent className="pt-5">
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <FieldGroup className="gap-4">
                  <Field>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40" />
                      <Input
                        placeholder="Enter your search query..."
                        className="h-8 rounded-lg border-white/6 bg-white/3 pl-8 text-xs placeholder:text-muted-foreground/30 focus-visible:border-white/12 focus-visible:ring-0"
                        {...form.register('query')}
                      />
                    </div>
                    {form.formState.errors.query && (
                      <FieldError className="text-[11px]">
                        {form.formState.errors.query.message}
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
                      disabled={searchMutation.isPending}
                    >
                      {searchMutation.isPending && (
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      )}
                      Search
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
        </div>

        {/* Results */}
        <Card className="h-fit border-white/6 bg-[#111] lg:sticky lg:top-20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-white">
              Results ({results.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {searchMutation.isPending ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-lg bg-white/3" />
                ))}
              </div>
            ) : results.length > 0 ? (
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-3">
                  {results.map((result, index) => (
                    <div
                      key={result.id}
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
                            {result.source_ref}
                          </span>
                        </div>
                        <Badge className="shrink-0 border border-white/6 bg-white/3 text-[10px] text-white/75">
                          {result.score.toFixed(3)}
                        </Badge>
                      </div>
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        <Badge className="border border-white/6 bg-white/3 text-[10px] text-muted-foreground/60">
                          {result.namespace_id}
                        </Badge>
                        <Badge className="border border-white/6 bg-white/3 text-[10px] text-muted-foreground/60">
                          Chunk {result.chunk_index}
                        </Badge>
                      </div>
                      <p
                        className={`text-xs text-muted-foreground/45 ${
                          expandedResults.has(result.id)
                            ? ''
                            : 'line-clamp-3'
                        }`}
                      >
                        {result.text}
                      </p>
                      {result.text.length > 150 && (
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-[11px] text-muted-foreground/55 hover:text-white"
                          onClick={() => toggleResultExpand(result.id)}
                        >
                          {expandedResults.has(result.id)
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
                <Search className="mb-4 h-8 w-8 text-muted-foreground/35" />
                <p className="text-sm font-medium text-white/85">No results yet</p>
                <p className="text-xs text-muted-foreground/40">
                  Enter a query to search your knowledge base
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
