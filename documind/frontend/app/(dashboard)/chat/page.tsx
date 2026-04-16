'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send,
  Loader2,
  Settings2,
  Trash2,
  FileText,
  Clock,
  AlertCircle,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Slider } from '@/components/ui/slider'
import { useQueryAdvancedMutation, useQueryInstanceMutation } from '@/hooks/mutations'
import { useInstances, useKnowledgeBases } from '@/hooks/queries'
import { cn } from '@/lib/utils'
import type {
  ChatMessage,
  ChatScope,
  SearchResult,
} from '@/lib/types'

function generateId() {
  return Math.random().toString(36).substring(2, 15)
}

const checkboxClassName =
  'h-4 w-4 border-white/40 bg-black/50 data-[state=checked]:border-violet-300/80 data-[state=checked]:bg-violet-300/80 data-[state=checked]:text-black'
const switchClassName =
  'border-white/15 data-[state=unchecked]:bg-white/12 data-[state=checked]:bg-violet-400/45'
const sliderClassName =
  '[&_[data-slot=slider-track]]:bg-white/10 [&_[data-slot=slider-range]]:bg-violet-300/60 [&_[data-slot=slider-thumb]]:border-white/25 [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-thumb]]:size-3.5'

export default function ChatWorkspacePage() {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')

  // Scope state
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(
    null
  )
  const [selectedNamespaces, setSelectedNamespaces] = useState<string[]>([])
  const [selectedKbs, setSelectedKbs] = useState<string[]>([])
  const [allNamespaces, setAllNamespaces] = useState(false)
  const [useAdvanced, setUseAdvanced] = useState(false)
  const [topK, setTopK] = useState(5)
  const queryInstanceMutation = useQueryInstanceMutation()
  const queryAdvancedMutation = useQueryAdvancedMutation()
  const isQuerying =
    queryInstanceMutation.isPending || queryAdvancedMutation.isPending

  // Fetch data
  const { data: instances } = useInstances()

  const { data: knowledgeBases } = useKnowledgeBases(selectedInstanceId || undefined)

  // Get unique namespaces for selected instance
  const namespaces =
    knowledgeBases && selectedInstanceId
      ? [...new Set(knowledgeBases.map((kb) => kb.namespace_id))]
      : []

  // Filter KBs by selected namespaces
  const availableKbs = knowledgeBases?.filter(
    (kb) =>
      selectedNamespaces.length === 0 ||
      selectedNamespaces.includes(kb.namespace_id)
  )

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const getCurrentScope = (): ChatScope => {
    const hasMultiSelect =
      selectedNamespaces.length > 1 || selectedKbs.length > 1

    return {
      mode: hasMultiSelect ? 'multi_scope' : 'single_scope',
      instanceId: selectedInstanceId,
      namespaceIds: allNamespaces ? namespaces : selectedNamespaces,
      kbIds: selectedKbs,
      useAdvanced,
    }
  }

  const hasValidScope = selectedInstanceId && selectedNamespaces.length > 0

  const isMultiScope =
    selectedNamespaces.length > 1 || selectedKbs.length > 1 || allNamespaces

  const handleSubmit = () => {
    const trimmedInput = inputValue.trim()
    if (!trimmedInput || isQuerying) return

    if (!hasValidScope) {
      toast.error('Scope required', {
        description: 'Please select an instance and at least one namespace',
      })
      return
    }

    const scope = getCurrentScope()

    // Add user message
    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: trimmedInput,
      createdAt: new Date().toISOString(),
      scopeSnapshot: scope,
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')

    const primaryNamespace = selectedNamespaces[0]
    const onSuccess = (data: {
      answer: string
      response_ms: number
      llm_profile: string
      sources: SearchResult[]
    }) => {
      const scopeSnapshot = getCurrentScope()
      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: data.answer,
        createdAt: new Date().toISOString(),
        scopeSnapshot,
        responseMs: data.response_ms,
        llmProfile: data.llm_profile,
        sources: data.sources,
      }
      setMessages((prev) => [...prev, assistantMessage])
    }
    const onError = (error: Error) => {
      toast.error('Failed to get response', {
        description: error.message,
      })
      setMessages((prev) => prev.slice(0, -1))
    }

    if (useAdvanced) {
      queryAdvancedMutation.mutate(
        {
          instance_id: selectedInstanceId!,
          namespace_id: primaryNamespace,
          question: trimmedInput,
          top_k: topK,
          mode: 'hybrid',
          hybrid: {
            method: 'rrf',
            dense_weight: 0.7,
            keyword_weight: 0.3,
          },
        },
        { onSuccess, onError }
      )
      return
    }

    queryInstanceMutation.mutate(
      {
        instance_id: selectedInstanceId!,
        namespace_id: primaryNamespace,
        question: trimmedInput,
        top_k: topK,
      },
      { onSuccess, onError }
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const clearChat = () => {
    setMessages([])
  }

  const toggleNamespace = (namespace: string) => {
    setSelectedNamespaces((prev) =>
      prev.includes(namespace)
        ? prev.filter((n) => n !== namespace)
        : [...prev, namespace]
    )
    setSelectedKbs([]) // Reset KB selection when namespace changes
  }

  const toggleKb = (kbId: string) => {
    setSelectedKbs((prev) =>
      prev.includes(kbId)
        ? prev.filter((id) => id !== kbId)
        : [...prev, kbId]
    )
  }

  return (
    <TooltipProvider>
      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-xl border border-white/6 bg-[#111]">
        {/* Scope Rail */}
        <div className="w-72 shrink-0 border-r border-white/6 bg-black">
          <ScrollArea className="h-full">
            <div className="space-y-6 p-4">
              {/* Instance Selector */}
              <div>
                <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/50">
                  Instance
                </h3>
                <Select
                  value={selectedInstanceId || ''}
                  onValueChange={(value) => {
                    setSelectedInstanceId(value)
                    setSelectedNamespaces([])
                    setSelectedKbs([])
                    setAllNamespaces(false)
                  }}
                >
                  <SelectTrigger className="h-8 w-full rounded-lg border-white/6 bg-white/3 text-xs text-white shadow-none data-[placeholder]:text-muted-foreground/35 focus-visible:border-white/12 focus-visible:ring-0">
                    <SelectValue placeholder="Select instance" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border-white/8 bg-[#1a1a1a] p-1">
                    {instances?.map((instance) => (
                      <SelectItem
                        key={instance.id}
                        value={instance.id}
                        className="rounded-md px-2.5 py-1.5 text-xs"
                      >
                        {instance.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedInstanceId && (
                <>
                  <Separator className="bg-white/6" />

                  {/* Namespace Selector */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/50">
                        Namespaces
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground/40">
                          All
                        </span>
                        <Switch
                          className={switchClassName}
                          checked={allNamespaces}
                          onCheckedChange={(checked) => {
                            setAllNamespaces(checked)
                            if (checked) {
                              setSelectedNamespaces(namespaces)
                            } else {
                              setSelectedNamespaces([])
                            }
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      {namespaces.map((namespace) => (
                        <label
                          key={namespace}
                          className={cn(
                            'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors',
                            selectedNamespaces.includes(namespace)
                              ? 'border border-violet-400/20 bg-violet-400/8 text-white'
                              : 'text-muted-foreground/55 hover:bg-white/6 hover:text-white'
                          )}
                        >
                          <Checkbox
                            className={checkboxClassName}
                            checked={
                              allNamespaces ||
                              selectedNamespaces.includes(namespace)
                            }
                            onCheckedChange={() => toggleNamespace(namespace)}
                            disabled={allNamespaces}
                          />
                          <span className="truncate font-mono">{namespace}</span>
                        </label>
                      ))}
                      {namespaces.length === 0 && (
                        <p className="py-2 text-xs text-muted-foreground/35">
                          No namespaces found
                        </p>
                      )}
                    </div>
                  </div>

                  <Separator className="bg-white/6" />

                  {/* KB Selector */}
                  <div>
                    <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/50">
                      Knowledge Bases (Optional)
                    </h3>
                    <div className="space-y-1">
                      {availableKbs?.map((kb) => (
                        <label
                          key={kb.id}
                          className={cn(
                            'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors',
                            selectedKbs.includes(kb.id)
                              ? 'border border-violet-400/20 bg-violet-400/8 text-white'
                              : 'text-muted-foreground/55 hover:bg-white/6 hover:text-white'
                          )}
                        >
                          <Checkbox
                            className={checkboxClassName}
                            checked={selectedKbs.includes(kb.id)}
                            onCheckedChange={() => toggleKb(kb.id)}
                          />
                          <span className="truncate">{kb.name}</span>
                        </label>
                      ))}
                      {(!availableKbs || availableKbs.length === 0) && (
                        <p className="py-2 text-xs text-muted-foreground/35">
                          {selectedNamespaces.length === 0
                            ? 'Select namespaces first'
                            : 'No knowledge bases found'}
                        </p>
                      )}
                    </div>
                  </div>

                  <Separator className="bg-white/6" />

                  {/* Settings */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/85">
                        Advanced Retrieval
                      </span>
                      <Switch
                        className={switchClassName}
                        checked={useAdvanced}
                        onCheckedChange={setUseAdvanced}
                      />
                    </div>
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs text-white/85">Top K</span>
                        <span className="text-xs text-muted-foreground/40">
                          {topK}
                        </span>
                      </div>
                      <Slider
                        className={sliderClassName}
                        value={[topK]}
                        onValueChange={([v]) => setTopK(v)}
                        min={1}
                        max={20}
                        step={1}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Thread */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#111]">
          {/* Multi-scope banner */}
          {isMultiScope && hasValidScope && (
            <Alert className="mx-4 mt-4 border-violet-400/20 bg-violet-400/8">
              <Info className="h-4 w-4 text-violet-300/85" />
              <AlertDescription className="text-xs text-white/75">
                Multi-scope orchestration is in preview mode; currently
                executing primary scope only.
              </AlertDescription>
            </Alert>
          )}

          {/* Messages */}
          <ScrollArea className="min-h-0 flex-1 p-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-4 rounded-full border border-white/10 bg-white/4 p-4">
                  <Settings2 className="h-8 w-8 text-muted-foreground/45" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">
                  Chat Workspace
                </h3>
                <p className="max-w-md text-sm text-muted-foreground/45">
                  {hasValidScope
                    ? 'Start asking questions about your documents. Your responses will include citations from your knowledge base.'
                    : 'Select an instance and namespace from the scope rail to start chatting.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4 pb-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex gap-3',
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[80%] rounded-lg border px-4 py-3',
                        message.role === 'user'
                          ? 'border-violet-400/30 bg-violet-400/18 text-white'
                          : 'border-white/6 bg-[#141414] text-white/85'
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </p>

                      {/* Message metadata */}
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground/55">
                        <span className="tabular-nums">
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </span>
                        {message.responseMs && (
                          <span className="flex items-center gap-1 tabular-nums">
                            <Clock className="h-3 w-3" strokeWidth={1.5} />
                            {message.responseMs}ms
                          </span>
                        )}
                        {message.llmProfile && (
                          <Badge className="h-5 border border-white/6 bg-white/3 text-[10px] text-muted-foreground/65">
                            {message.llmProfile}
                          </Badge>
                        )}
                      </div>

                      {/* Source citations */}
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {message.sources.slice(0, 3).map((source, i) => (
                            <Badge
                              key={i}
                              className="border border-white/6 bg-white/3 text-[10px] text-white/75"
                            >
                              <FileText className="mr-1 h-3 w-3" />
                              {source.source_ref} ({source.score.toFixed(3)})
                            </Badge>
                          ))}
                          {message.sources.length > 3 && (
                            <Badge
                              className="border border-white/6 bg-white/3 text-[10px] text-muted-foreground/60"
                            >
                              +{message.sources.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {isQuerying && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-lg border border-white/6 bg-[#141414] px-4 py-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground/55">
                        Thinking...
                      </span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Composer */}
          <div className="border-t border-white/6 bg-black p-4">
            {!hasValidScope && (
              <Alert className="mb-3 border-white/6 bg-white/4">
                <AlertCircle className="h-4 w-4 text-muted-foreground/45" />
                <AlertDescription className="text-xs text-muted-foreground/60">
                  Select an instance and namespace to start chatting
                </AlertDescription>
              </Alert>
            )}
            <div className="flex items-end gap-2">
              <div className="relative flex-1">
                <Textarea
                  ref={textareaRef}
                  placeholder={
                    hasValidScope
                      ? 'Ask a question... (Enter to send, Shift+Enter for new line)'
                      : 'Configure scope to start chatting...'
                  }
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={!hasValidScope || isQuerying}
                  rows={2}
                  className="resize-none rounded-lg border-white/6 bg-white/3 pr-20 text-xs placeholder:text-muted-foreground/30 focus-visible:border-white/12 focus-visible:ring-0"
                />
                <div className="absolute bottom-2 right-2 flex items-center gap-1">
                  {messages.length > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 rounded-lg p-0 text-muted-foreground/35 hover:bg-white/6 hover:text-white"
                          onClick={clearChat}
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="rounded-md border border-white/8 bg-[#1a1a1a] px-2 py-1 text-[11px] text-white/80">
                        Clear chat
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                className="h-8 rounded-lg"
                onClick={handleSubmit}
                disabled={
                  !hasValidScope ||
                  !inputValue.trim() ||
                  isQuerying
                }
              >
                {isQuerying ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
                )}
              </Button>
            </div>

            {/* Scope chips */}
            {hasValidScope && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-muted-foreground/50">Scope:</span>
                {instances?.find((i) => i.id === selectedInstanceId) && (
                  <Badge className="border border-white/6 bg-white/3 text-[10px] text-white/75">
                    {instances.find((i) => i.id === selectedInstanceId)?.name}
                  </Badge>
                )}
                {selectedNamespaces.slice(0, 2).map((ns) => (
                  <Badge
                    key={ns}
                    className="border border-white/6 bg-white/3 text-[10px] text-muted-foreground/60"
                  >
                    {ns}
                  </Badge>
                ))}
                {selectedNamespaces.length > 2 && (
                  <Badge className="border border-white/6 bg-white/3 text-[10px] text-muted-foreground/60">
                    +{selectedNamespaces.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        </div>
      </div>
    </TooltipProvider>
  )
}
