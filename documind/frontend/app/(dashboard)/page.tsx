'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import {
  Server,
  Database,
  FileText,
  Layers,
  ArrowRight,
  Activity,
  Plus,
  Search,
  MessageCircleQuestion,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/page-header'
import api from '@/lib/api'
import { useAppContext } from '@/lib/context'
import { formatDistanceToNow } from '@/lib/format'

function StatCard({
  title,
  value,
  icon: Icon,
  isLoading,
}: {
  title: string
  value: number | string
  icon: React.ElementType
  isLoading?: boolean
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <p className="text-2xl font-bold">{value}</p>
        )}
      </CardContent>
    </Card>
  )
}

export default function OverviewPage() {
  const { hasContext, activeInstanceName, activeNamespaceId } = useAppContext()

  const { data: instances, isLoading: loadingInstances } = useQuery({
    queryKey: ['instances'],
    queryFn: () => api.getInstances(),
  })

  const { data: knowledgeBases, isLoading: loadingKbs } = useQuery({
    queryKey: ['knowledge-bases'],
    queryFn: () => api.getKnowledgeBases(),
  })

  const { data: collections, isLoading: loadingCollections } = useQuery({
    queryKey: ['collections'],
    queryFn: () => api.getCollections(),
  })

  const { data: health, isLoading: loadingHealth } = useQuery({
    queryKey: ['health'],
    queryFn: () => api.getHealth(),
  })

  const uniqueNamespaces = knowledgeBases
    ? [...new Set(knowledgeBases.map((kb) => kb.namespace_id))]
    : []

  const recentKbs = knowledgeBases
    ?.slice()
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 5)

  const isEmpty =
    !loadingInstances &&
    !loadingKbs &&
    (!instances || instances.length === 0) &&
    (!knowledgeBases || knowledgeBases.length === 0)

  return (
    <div className="p-6">
      <PageHeader
        title="Overview"
        description="Your DocuMind operational dashboard"
      />

      {/* Active Context Banner */}
      {hasContext && (
        <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Active Context:</span>
              <Badge variant="secondary" className="text-xs">
                {activeInstanceName}
              </Badge>
              <span className="text-muted-foreground">/</span>
              <Badge variant="secondary" className="text-xs">
                {activeNamespaceId}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/search">
                  <Search className="mr-1.5 h-3.5 w-3.5" />
                  Search
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/ask">
                  <MessageCircleQuestion className="mr-1.5 h-3.5 w-3.5" />
                  Ask
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Instances"
          value={instances?.length ?? 0}
          icon={Server}
          isLoading={loadingInstances}
        />
        <StatCard
          title="Knowledge Bases"
          value={knowledgeBases?.length ?? 0}
          icon={Database}
          isLoading={loadingKbs}
        />
        <StatCard
          title="Unique Namespaces"
          value={uniqueNamespaces.length}
          icon={Layers}
          isLoading={loadingKbs}
        />
        <StatCard
          title="Collections"
          value={collections?.collections?.length ?? 0}
          icon={FileText}
          isLoading={loadingCollections}
        />
      </div>

      {/* Empty State */}
      {isEmpty && (
        <Card className="mb-8">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="mb-4 rounded-full bg-primary/10 p-4">
              <Database className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Get Started with DocuMind</h3>
            <p className="mb-6 max-w-md text-center text-sm text-muted-foreground">
              Create your first instance and knowledge base to start organizing
              and querying your documents.
            </p>
            <div className="flex gap-3">
              <Button size="sm" asChild>
                <Link href="/instances">
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Create Instance
                </Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href="/knowledge-bases">
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Create Knowledge Base
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Health Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">System Health</CardTitle>
            <Badge
              variant={health?.status === 'ok' ? 'default' : 'destructive'}
              className="text-xs"
            >
              {loadingHealth ? 'Checking...' : health?.status ?? 'Unknown'}
            </Badge>
          </CardHeader>
          <CardContent>
            {loadingHealth ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : health ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vector DB</span>
                  <span className="font-medium">
                    {health.vectordb?.title ?? 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Version</span>
                  <span className="font-mono text-xs">
                    {health.vectordb?.version ?? 'Unavailable'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Unable to fetch health status
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Knowledge Bases */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Knowledge Bases</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/knowledge-bases">
                View all
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loadingKbs ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recentKbs && recentKbs.length > 0 ? (
              <div className="space-y-3">
                {recentKbs.map((kb) => (
                  <div
                    key={kb.id}
                    className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{kb.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {kb.namespace_id} &middot;{' '}
                        {formatDistanceToNow(kb.created_at)}
                      </p>
                    </div>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {kb.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No knowledge bases yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-6">
        <h2 className="mb-4 text-sm font-medium text-muted-foreground">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link href="/instances">
              <Server className="mr-1.5 h-3.5 w-3.5" />
              Manage Instances
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href="/knowledge-bases">
              <Database className="mr-1.5 h-3.5 w-3.5" />
              Manage Knowledge Bases
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href="/resources">
              <FileText className="mr-1.5 h-3.5 w-3.5" />
              Add Resources
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href="/chat">
              <MessageCircleQuestion className="mr-1.5 h-3.5 w-3.5" />
              Open Chat Workspace
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
