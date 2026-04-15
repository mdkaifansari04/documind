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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
    <div className="p-6">
      <PageHeader
        title="Collections & System"
        description="Monitor system health and inspect collections"
        actions={
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            className="gap-2"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Health Status Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">System Health</CardTitle>
              </div>
              {loadingHealth ? (
                <Skeleton className="h-5 w-16" />
              ) : (
                <Badge
                  variant={health?.status === 'ok' ? 'default' : 'destructive'}
                  className="gap-1"
                >
                  {health?.status === 'ok' ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <XCircle className="h-3 w-3" />
                  )}
                  {health?.status ?? 'Unknown'}
                </Badge>
              )}
            </div>
            <CardDescription>
              Real-time status of the DocuMind backend services
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingHealth ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : health ? (
              <div className="space-y-4">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                      <Database className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {health.vectordb?.title ?? 'Unknown'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Vector Database
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Active
                    </Badge>
                  </div>
                  <div className="mt-3 rounded bg-muted/50 px-3 py-2">
                    <p className="font-mono text-xs text-muted-foreground">
                      {health.vectordb?.version ?? 'Unavailable'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">
                      Total Collections
                    </p>
                    <p className="text-2xl font-bold">
                      {collections?.collections?.length ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">
                      Knowledge Bases
                    </p>
                    <p className="text-2xl font-bold">
                      {collections?.knowledge_bases?.length ?? 0}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <XCircle className="mb-2 h-8 w-8 text-destructive" />
                <p className="text-sm font-medium">Unable to fetch health status</p>
                <p className="text-xs text-muted-foreground">
                  Check your connection and try again
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vector Collections Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Vector Collections</CardTitle>
            </div>
            <CardDescription>
              All vector collections in the database
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingCollections ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : collections?.collections && collections.collections.length > 0 ? (
              <div className="max-h-[300px] space-y-1 overflow-y-auto pr-2">
                {collections.collections.map((collection, index) => (
                  <div
                    key={collection}
                    className="flex items-center gap-2 rounded-md border px-3 py-2"
                    style={{ animationDelay: `${index * 35}ms` }}
                  >
                    <Database className="h-3.5 w-3.5 text-muted-foreground" />
                    <code className="flex-1 text-xs">{collection}</code>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <HardDrive className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">No collections found</p>
                <p className="text-xs text-muted-foreground">
                  Create a knowledge base to add collections
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Linked Knowledge Bases Table */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Linked Knowledge Bases</CardTitle>
          </div>
          <CardDescription>
            Knowledge bases and their associated collections
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingCollections ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : collections?.knowledge_bases &&
            collections.knowledge_bases.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Namespace</TableHead>
                    <TableHead>Collection</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Dimensions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collections.knowledge_bases.map((kb, index) => (
                    <TableRow
                      key={kb.id}
                      style={{ animationDelay: `${index * 35}ms` }}
                    >
                      <TableCell className="font-medium">{kb.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {kb.namespace_id}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs">{kb.collection_name}</code>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {kb.embedding_model}
                      </TableCell>
                      <TableCell>{kb.embedding_dim}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            kb.status === 'active' ? 'default' : 'secondary'
                          }
                          className="text-xs"
                        >
                          {kb.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateTime(kb.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Database className="mb-4 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">No knowledge bases found</p>
              <p className="text-xs text-muted-foreground">
                Create a knowledge base to get started
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
