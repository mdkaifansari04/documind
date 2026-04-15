"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Server,
  Database,
  FileText,
  Layers,
  ArrowRight,
  Activity,
  Search,
  MessageCircleQuestion,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { useAppContext } from "@/lib/context";
import { formatDistanceToNow } from "@/lib/format";

function StatCard({
  title,
  value,
  icon: Icon,
  isLoading,
  index,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  isLoading?: boolean;
  index: number;
}) {
  return (
    <div
      className="rounded-xl border border-white/6 bg-[#111] p-4 transition-colors hover:bg-[#141414]"
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      <div className="mb-3 flex items-center gap-2">
        <Icon
          className="h-3.5 w-3.5 text-muted-foreground/40"
          strokeWidth={1.5}
        />
        <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/40">
          {title}
        </span>
      </div>
      {isLoading ? (
        <Skeleton className="h-8 w-16 rounded-md bg-white/3" />
      ) : (
        <div className="text-2xl font-semibold tabular-nums text-white">
          {value}
        </div>
      )}
    </div>
  );
}

export default function OverviewPage() {
  const { hasContext, activeInstanceName, activeNamespaceId } = useAppContext();

  const { data: instances, isLoading: loadingInstances } = useQuery({
    queryKey: ["instances"],
    queryFn: () => api.getInstances(),
  });

  const { data: knowledgeBases, isLoading: loadingKbs } = useQuery({
    queryKey: ["knowledge-bases"],
    queryFn: () => api.getKnowledgeBases(),
  });

  const { data: collections, isLoading: loadingCollections } = useQuery({
    queryKey: ["collections"],
    queryFn: () => api.getCollections(),
  });

  const { data: health, isLoading: loadingHealth } = useQuery({
    queryKey: ["health"],
    queryFn: () => api.getHealth(),
  });

  const uniqueNamespaces = knowledgeBases
    ? [...new Set(knowledgeBases.map((kb) => kb.namespace_id))]
    : [];

  const recentKbs = knowledgeBases
    ?.slice()
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, 5);

  const isEmpty =
    !loadingInstances &&
    !loadingKbs &&
    (!instances || instances.length === 0) &&
    (!knowledgeBases || knowledgeBases.length === 0);

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      {/* Header */}
      <div className="pb-6">
        <h1 className="text-sm font-medium text-white">Overview</h1>
        <p className="mt-0.5 text-xs text-muted-foreground/60">
          Your DocuMind operational dashboard
        </p>
      </div>

      {/* Active Context Banner */}
      {hasContext && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <Activity className="h-3.5 w-3.5 text-primary" strokeWidth={1.5} />
            <span className="text-[11px] font-medium text-white">
              Active Context
            </span>
            <span className="rounded-md border border-dashed border-white/10 px-2 py-0.5 text-[10px] text-muted-foreground/60">
              {activeInstanceName}
            </span>
            <span className="text-muted-foreground/30">/</span>
            <span className="rounded-md border border-dashed border-white/10 px-2 py-0.5 text-[10px] text-muted-foreground/60">
              {activeNamespaceId}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href="/search"
              className="flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-medium text-muted-foreground/50 transition-colors hover:bg-white/6 hover:text-white"
            >
              <Search className="h-3 w-3" strokeWidth={1.5} />
              Search
            </Link>
            <Link
              href="/ask"
              className="flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-medium text-muted-foreground/50 transition-colors hover:bg-white/6 hover:text-white"
            >
              <MessageCircleQuestion className="h-3 w-3" strokeWidth={1.5} />
              Ask
            </Link>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Instances"
          value={instances?.length ?? 0}
          icon={Server}
          isLoading={loadingInstances}
          index={0}
        />
        <StatCard
          title="Knowledge Bases"
          value={knowledgeBases?.length ?? 0}
          icon={Database}
          isLoading={loadingKbs}
          index={1}
        />
        <StatCard
          title="Unique Namespaces"
          value={uniqueNamespaces.length}
          icon={Layers}
          isLoading={loadingKbs}
          index={2}
        />
        <StatCard
          title="Collections"
          value={collections?.collections?.length ?? 0}
          icon={FileText}
          isLoading={loadingCollections}
          index={3}
        />
      </div>

      {/* Empty State */}
      {isEmpty && (
        <div className="mb-8 rounded-xl border border-white/6 bg-[#111] px-6 py-14 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/4">
            <Database
              className="h-5 w-5 text-muted-foreground/40"
              strokeWidth={1.5}
            />
          </div>
          <h3 className="text-sm font-medium text-white">
            Get Started with DocuMind
          </h3>
          <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground/40">
            Create your first instance and knowledge base to start organizing
            and querying your documents.
          </p>
          <div className="mt-5 flex items-center justify-center gap-4">
            <Link
              href="/instances"
              className="text-xs text-muted-foreground/60 underline underline-offset-4 decoration-muted-foreground/25 transition-colors hover:text-white hover:decoration-white/40"
            >
              + Create Instance
            </Link>
            <Link
              href="/knowledge-bases"
              className="text-xs text-muted-foreground/60 underline underline-offset-4 decoration-muted-foreground/25 transition-colors hover:text-white hover:decoration-white/40"
            >
              + Create Knowledge Base
            </Link>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Health Status */}
        <div className="rounded-xl border border-white/6 bg-[#111]">
          <div className="flex items-center justify-between px-5 py-3.5">
            <h2 className="text-sm font-medium text-white">System Health</h2>
            {loadingHealth ? (
              <Skeleton className="h-5 w-16 rounded-md bg-white/3" />
            ) : (
              <span
                className={`inline-flex items-center gap-1 rounded-md border border-dashed px-2 py-0.5 text-[10px] ${
                  health?.status === "ok"
                    ? "border-emerald-400/20 text-emerald-400/70"
                    : "border-red-400/20 text-red-400/70"
                }`}
              >
                <span
                  className={`inline-block h-1.5 w-1.5 rounded-full ${
                    health?.status === "ok"
                      ? "bg-emerald-400/70"
                      : "bg-red-400/70"
                  }`}
                />
                {health?.status ?? "Unknown"}
              </span>
            )}
          </div>
          <div className="border-t border-white/6 px-5 py-4">
            {loadingHealth ? (
              <div className="space-y-2.5">
                <Skeleton className="h-4 w-full rounded-md bg-white/3" />
                <Skeleton className="h-4 w-3/4 rounded-md bg-white/3" />
              </div>
            ) : health ? (
              <dl className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground/40">Vector DB</dt>
                  <dd className="font-medium text-white/80">
                    {health.vectordb?.title ?? "Unknown"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground/40">Version</dt>
                  <dd className="font-mono text-[11px] text-white/60">
                    {health.vectordb?.version ?? "Unavailable"}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-xs text-muted-foreground/35">
                Unable to fetch health status
              </p>
            )}
          </div>
        </div>

        {/* Recent Knowledge Bases */}
        <div className="rounded-xl border border-white/6 bg-[#111]">
          <div className="flex items-center justify-between px-5 py-3.5">
            <h2 className="text-sm font-medium text-white">
              Recent Knowledge Bases
            </h2>
            <Link
              href="/knowledge-bases"
              className="group inline-flex items-center gap-1 text-xs text-muted-foreground/50 transition-colors hover:text-primary"
            >
              View all
              <ArrowRight
                className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
                strokeWidth={1.5}
              />
            </Link>
          </div>
          <div className="border-t border-white/6">
            {loadingKbs ? (
              <div className="space-y-px px-1 py-1.5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="px-4 py-3">
                    <Skeleton className="h-10 w-full rounded-md bg-white/3" />
                  </div>
                ))}
              </div>
            ) : recentKbs && recentKbs.length > 0 ? (
              <div className="flex flex-col">
                {recentKbs.map((kb, index) => (
                  <div
                    key={kb.id}
                    className={`flex items-center justify-between px-5 py-3 transition-colors hover:bg-white/3 ${
                      index > 0 ? "border-t border-white/4" : ""
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-white/80">
                        {kb.name}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground/35">
                        {kb.namespace_id} · {formatDistanceToNow(kb.created_at)}
                      </p>
                    </div>
                    <span className="ml-3 rounded-md border border-white/6 bg-white/3 px-2 py-0.5 text-[10px] text-muted-foreground/50">
                      {kb.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-10 text-center">
                <p className="text-xs text-muted-foreground/35">
                  No knowledge bases yet
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6">
        <h2 className="mb-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/40">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-2">
          {[
            { href: "/instances", icon: Server, label: "Manage Instances" },
            {
              href: "/knowledge-bases",
              icon: Database,
              label: "Manage Knowledge Bases",
            },
            { href: "/resources", icon: FileText, label: "Add Resources" },
            {
              href: "/chat",
              icon: MessageCircleQuestion,
              label: "Open Chat Workspace",
            },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex h-8 items-center gap-2 rounded-lg border border-white/6 bg-white/2 px-3 text-xs text-muted-foreground/50 transition-colors hover:border-white/12 hover:bg-white/4 hover:text-white"
            >
              <action.icon className="h-3 w-3" strokeWidth={1.5} />
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
