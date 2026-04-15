'use client'

import { useQuery } from '@tanstack/react-query'
import {
  Database,
  HardDrive,
  Activity,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Server,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/page-header'
import api from '@/lib/api'
import { formatDateTime } from '@/lib/format'
import { useQueryClient } from '@tanstack/react-query'

export default function SystemPage() {
  const queryClient = useQueryClient()

  const {
    data: health,
    isLoading: loadingHealth,
    refetch: refetchHealth,
  } = useQuery({
    queryKey: ['health'],
    queryFn: () => api.getHealth(),
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  const {
    data: collections,
    isLoading: loadingCollections,
    refetch: refetchCollections,
  } = useQuery({
    queryKey: ['collections'],
    queryFn: () => api.getCollections(),
  })

  const handleRefresh = () => {
    refetchHealth()
    refetchCollections()
    queryClient.invalidateQueries({ queryKey: ['instances'] })
    queryClient.invalidateQueries({ queryKey: ['knowledge-bases'] })
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <PageHeader
        title="Collections & System"
        description="Monitor system health and inspect collections"
        actions={
          <Button
            size="sm"
            onClick={handleRefresh}
            className="h-8 gap-1.5 rounded-lg border border-white/6 bg-white/3 px-3 text-xs text-muted-foreground/70 hover:bg-white/6 hover:text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.5} />
            Refresh
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Health Status Card */}
        <Card className="border-white/6 bg-[#111]">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity
                  className="h-4 w-4 text-muted-foreground/45"
                  strokeWidth={1.5}
                />
                <CardTitle className="text-sm font-medium text-white">
                  System Health
                </CardTitle>
              </div>
              {loadingHealth ? (
                <Skeleton className="h-5 w-16 rounded-md bg-white/3" />
              ) : (
                <Badge className="gap-1 border border-white/6 bg-white/3 text-[10px] text-white/75">
                  {health?.status === 'ok' ? (
                    <CheckCircle2 className="h-3 w-3 text-emerald-400/80" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-400/80" />
                  )}
                  {health?.status ?? 'Unknown'}
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs text-muted-foreground/45">
              Real-time status of the DocuMind backend services
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingHealth ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-full rounded-lg bg-white/3" />
                <Skeleton className="h-8 w-full rounded-lg bg-white/3" />
              </div>
            ) : health ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-white/6 bg-black p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/4">
                      <Database
                        className="h-5 w-5 text-muted-foreground/55"
                        strokeWidth={1.5}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white/90">
                        {health.vectordb?.title ?? 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground/45">
                        Vector Database
                      </p>
                    </div>
                    <Badge className="border border-dashed border-emerald-400/20 bg-transparent text-[10px] text-emerald-400/70">
                      Active
                    </Badge>
                  </div>
                  <div className="mt-3 rounded-md border border-white/6 bg-white/3 px-3 py-2">
                    <p className="font-mono text-xs text-muted-foreground/55">
                      {health.vectordb?.version ?? 'Unavailable'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-white/6 bg-black p-3">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground/40">
                      Total Collections
                    </p>
                    <p className="text-2xl font-semibold tabular-nums text-white">
                      {collections?.collections?.length ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/6 bg-black p-3">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground/40">
                      Knowledge Bases
                    </p>
                    <p className="text-2xl font-semibold tabular-nums text-white">
                      {collections?.knowledge_bases?.length ?? 0}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <XCircle className="mb-2 h-8 w-8 text-red-400/70" />
                <p className="text-sm font-medium text-white/85">
                  Unable to fetch health status
                </p>
                <p className="text-xs text-muted-foreground/40">
                  Check your connection and try again
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vector Collections Card */}
        <Card className="border-white/6 bg-[#111]">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <HardDrive
                className="h-4 w-4 text-muted-foreground/45"
                strokeWidth={1.5}
              />
              <CardTitle className="text-sm font-medium text-white">
                Vector Collections
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground/45">
              All vector collections in the database
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingCollections ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full rounded-lg bg-white/3" />
                ))}
              </div>
            ) : collections?.collections && collections.collections.length > 0 ? (
              <div className="max-h-[300px] space-y-1 overflow-y-auto pr-2">
                {collections.collections.map((collection, index) => (
                  <div
                    key={collection}
                    className="flex items-center gap-2 rounded-lg border border-white/6 bg-[#141414] px-3 py-2 transition-colors duration-150 hover:bg-white/4"
                    style={{ animationDelay: `${index * 0.04}s` }}
                  >
                    <Database
                      className="h-3.5 w-3.5 text-muted-foreground/35"
                      strokeWidth={1.5}
                    />
                    <code className="flex-1 text-xs text-muted-foreground/65">
                      {collection}
                    </code>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <HardDrive className="mb-2 h-8 w-8 text-muted-foreground/35" />
                <p className="text-sm font-medium text-white/85">
                  No collections found
                </p>
                <p className="text-xs text-muted-foreground/40">
                  Create a knowledge base to add collections
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Linked Knowledge Bases Table */}
      <Card className="mt-6 border-white/6 bg-[#111]">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Server
              className="h-4 w-4 text-muted-foreground/45"
              strokeWidth={1.5}
            />
            <CardTitle className="text-sm font-medium text-white">
              Linked Knowledge Bases
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground/45">
            Knowledge bases and their associated collections
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingCollections ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg bg-white/3" />
              ))}
            </div>
          ) : collections?.knowledge_bases &&
            collections.knowledge_bases.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-white/6 bg-black">
              <div className="grid grid-cols-[1fr_0.7fr_1fr_0.7fr_0.5fr_0.6fr_0.9fr] items-center gap-2 px-5 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/50">
                <span>Name</span>
                <span>Namespace</span>
                <span>Collection</span>
                <span>Model</span>
                <span>Dims</span>
                <span>Status</span>
                <span>Created</span>
              </div>
              <div className="flex flex-col gap-px px-1 pb-1.5">
                {collections.knowledge_bases.map((kb, index) => (
                  <div
                    key={kb.id}
                    className={`grid grid-cols-[1fr_0.7fr_1fr_0.7fr_0.5fr_0.6fr_0.9fr] items-center gap-2 bg-[#141414] px-4 py-3 transition-colors duration-150 hover:bg-white/4 ${
                      index === 0 ? 'rounded-t-lg' : ''
                    } ${
                      index === collections.knowledge_bases.length - 1
                        ? 'rounded-b-lg'
                        : ''
                    }`}
                    style={{ animationDelay: `${index * 0.04}s` }}
                  >
                    <span className="truncate text-sm font-medium text-white/90">
                      {kb.name}
                    </span>
                    <span className="truncate rounded-md border border-white/6 bg-white/3 px-2 py-0.5 text-[10px] text-muted-foreground/60">
                      {kb.namespace_id}
                    </span>
                    <code className="truncate text-xs text-muted-foreground/55">
                      {kb.collection_name}
                    </code>
                    <span className="truncate font-mono text-xs text-muted-foreground/55">
                      {kb.embedding_model}
                    </span>
                    <span className="tabular-nums text-xs text-muted-foreground/45">
                      {kb.embedding_dim}
                    </span>
                    <span
                      className={`inline-flex w-fit items-center gap-1 rounded-md border border-dashed px-2 py-0.5 text-[10px] ${
                        kb.status === 'active'
                          ? 'border-emerald-400/20 text-emerald-400/70'
                          : kb.status === 'inactive'
                            ? 'border-red-400/20 text-red-400/70'
                            : 'border-amber-300/30 text-amber-200/80'
                      }`}
                    >
                      {kb.status}
                    </span>
                    <span className="text-xs tabular-nums text-muted-foreground/40">
                      {formatDateTime(kb.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Database className="mb-4 h-8 w-8 text-muted-foreground/35" />
              <p className="text-sm font-medium text-white/85">
                No knowledge bases found
              </p>
              <p className="text-xs text-muted-foreground/40">
                Create a knowledge base to get started
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
