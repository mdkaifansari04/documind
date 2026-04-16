"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Database, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateKnowledgeBaseDialog } from "@/components/dialogs/create-kb-dialog";
import { KnowledgeBaseDetailSheet } from "@/components/sheets/kb-detail-sheet";
import { useInstances, useKnowledgeBases } from "@/hooks/queries";
import { useAppContext } from "@/lib/context";
import { formatDistanceToNow } from "@/lib/format";
import type { KnowledgeBase } from "@/lib/types";

const ACCENT_GRADIENTS = [
  "from-emerald-500 to-green-600",
  "from-cyan-400 to-blue-500",
  "from-amber-400 to-orange-500",
  "from-teal-400 to-emerald-500",
  "from-rose-400 to-pink-500",
  "from-teal-400 to-cyan-500",
  "from-sky-400 to-blue-500",
  "from-lime-400 to-emerald-500",
];

const STATUS_FILTERS = ["all", "active", "inactive", "processing"] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number];

function getGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return ACCENT_GRADIENTS[Math.abs(hash) % ACCENT_GRADIENTS.length];
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getStatusClasses(status: KnowledgeBase["status"]) {
  if (status === "active") {
    return "border-emerald-400/20 text-emerald-400/70";
  }
  if (status === "inactive") {
    return "border-red-400/20 text-red-400/70";
  }
  return "border-amber-300/30 text-amber-200/80";
}

export default function KnowledgeBasesPage() {
  const searchParams = useSearchParams();
  const queryInstanceFilter = searchParams.get("instance") || "all";

  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [instanceFilter, setInstanceFilter] = useState(queryInstanceFilter);
  const [namespaceFilter, setNamespaceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedKb, setSelectedKb] = useState<KnowledgeBase | null>(null);

  const { activeInstanceId, activeNamespaceId, activeKbId, setActiveKb } =
    useAppContext();

  const { data: instances } = useInstances();

  const { data: knowledgeBases, isLoading } = useKnowledgeBases();

  useEffect(() => {
    setInstanceFilter(queryInstanceFilter);
  }, [queryInstanceFilter]);

  const instanceById = useMemo(() => {
    return new Map(
      (instances ?? []).map((instance) => [instance.id, instance]),
    );
  }, [instances]);

  const namespaces = useMemo(() => {
    const source = (knowledgeBases ?? []).filter((kb) =>
      instanceFilter === "all" ? true : kb.instance_id === instanceFilter,
    );
    return Array.from(new Set(source.map((kb) => kb.namespace_id))).sort(
      (a, b) => a.localeCompare(b),
    );
  }, [knowledgeBases, instanceFilter]);

  useEffect(() => {
    if (namespaceFilter !== "all" && !namespaces.includes(namespaceFilter)) {
      setNamespaceFilter("all");
    }
  }, [namespaceFilter, namespaces]);

  const filteredKbs = useMemo(() => {
    const term = search.trim().toLowerCase();

    return (knowledgeBases ?? []).filter((kb) => {
      const instanceName = instanceById.get(kb.instance_id)?.name ?? "";
      const matchesSearch =
        term.length === 0 ||
        kb.name.toLowerCase().includes(term) ||
        kb.namespace_id.toLowerCase().includes(term) ||
        kb.embedding_model.toLowerCase().includes(term) ||
        kb.collection_name.toLowerCase().includes(term) ||
        instanceName.toLowerCase().includes(term);

      const matchesInstance =
        instanceFilter === "all" || kb.instance_id === instanceFilter;
      const matchesNamespace =
        namespaceFilter === "all" || kb.namespace_id === namespaceFilter;
      const matchesStatus =
        statusFilter === "all" || kb.status === statusFilter;

      return (
        matchesSearch && matchesInstance && matchesNamespace && matchesStatus
      );
    });
  }, [
    knowledgeBases,
    search,
    instanceById,
    instanceFilter,
    namespaceFilter,
    statusFilter,
  ]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <div className="flex items-center justify-between pb-6">
        <div>
          <h1 className="text-sm font-medium text-white">Knowledge Bases</h1>
          <p className="mt-0.5 text-xs text-muted-foreground/60">
            Manage your knowledge bases and retrieval configuration
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="text-xs text-muted-foreground/60 underline decoration-muted-foreground/25 underline-offset-4 transition-colors hover:text-white hover:decoration-white/40"
        >
          + Create Knowledge Base
        </button>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] max-w-xs flex-1">
          <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40" />
          <input
            placeholder="Search knowledge bases..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full rounded-lg border border-white/6 bg-white/3 pr-3 pl-8 text-xs text-white outline-none transition-colors placeholder:text-muted-foreground/30 focus:border-white/12"
          />
        </div>

        <Select value={instanceFilter} onValueChange={setInstanceFilter}>
          <SelectTrigger className="h-8 min-w-[170px] border-white/6 bg-white/3 px-2.5 text-xs text-white shadow-none data-[placeholder]:text-muted-foreground/40 focus-visible:border-white/12 focus-visible:ring-0">
            <SelectValue placeholder="All Instances" />
          </SelectTrigger>
          <SelectContent className="rounded-lg border-white/8 bg-[#1a1a1a] p-1 text-xs text-white">
            <SelectItem
              value="all"
              className="rounded-md px-2.5 py-1.5 text-xs text-muted-foreground focus:bg-white/8 focus:text-white"
            >
              All Instances
            </SelectItem>
            {instances?.map((instance) => (
              <SelectItem
                key={instance.id}
                value={instance.id}
                className="rounded-md px-2.5 py-1.5 text-xs text-muted-foreground focus:bg-white/8 focus:text-white"
              >
                {instance.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={namespaceFilter} onValueChange={setNamespaceFilter}>
          <SelectTrigger className="h-8 min-w-[170px] border-white/6 bg-white/3 px-2.5 text-xs text-white shadow-none data-[placeholder]:text-muted-foreground/40 focus-visible:border-white/12 focus-visible:ring-0">
            <SelectValue placeholder="All Namespaces" />
          </SelectTrigger>
          <SelectContent className="rounded-lg border-white/8 bg-[#1a1a1a] p-1 text-xs text-white">
            <SelectItem
              value="all"
              className="rounded-md px-2.5 py-1.5 text-xs text-muted-foreground focus:bg-white/8 focus:text-white"
            >
              All Namespaces
            </SelectItem>
            {namespaces.map((namespace) => (
              <SelectItem
                key={namespace}
                value={namespace}
                className="rounded-md px-2.5 py-1.5 font-mono text-xs text-muted-foreground focus:bg-white/8 focus:text-white"
              >
                {namespace}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-0.5 rounded-md border border-white/6 bg-white/2 p-0.5">
          {STATUS_FILTERS.map((status) => {
            const active = statusFilter === status;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-[5px] px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  active
                    ? "bg-white/8 text-white"
                    : "text-muted-foreground/50 hover:text-muted-foreground"
                }`}
              >
                {titleCase(status)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/6 bg-black">
        <div className="grid grid-cols-[1.1fr_0.85fr_0.95fr_0.85fr_0.65fr_110px] items-center gap-2 px-5 py-2.5 text-[11px] font-medium tracking-wide text-muted-foreground/50 uppercase">
          <span>Name</span>
          <span>Namespace</span>
          <span>Instance</span>
          <span>Model</span>
          <span>Updated</span>
          <span className="text-right">Actions</span>
        </div>

        <div className="flex flex-col gap-px px-1 pb-1.5">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={`grid grid-cols-[1.1fr_0.85fr_0.95fr_0.85fr_0.65fr_110px] items-center gap-2 bg-[#141414] px-4 py-3 ${
                  i === 0 ? "rounded-t-lg" : ""
                } ${i === 3 ? "rounded-b-lg" : ""}`}
              >
                <Skeleton className="h-4 w-40 rounded-md bg-white/3" />
                <Skeleton className="h-4 w-28 rounded-md bg-white/3" />
                <Skeleton className="h-4 w-32 rounded-md bg-white/3" />
                <Skeleton className="h-4 w-28 rounded-md bg-white/3" />
                <Skeleton className="h-4 w-16 rounded-md bg-white/3" />
                <Skeleton className="ml-auto h-6 w-16 rounded-md bg-white/3" />
              </div>
            ))
          ) : filteredKbs.length > 0 ? (
            filteredKbs.map((kb, index) => {
              const isActiveKb = activeKbId === kb.id;
              const canSetActive =
                activeInstanceId === kb.instance_id &&
                activeNamespaceId === kb.namespace_id;
              const instanceName =
                instanceById.get(kb.instance_id)?.name || "Unknown instance";

              return (
                <div
                  key={kb.id}
                  className={`group grid cursor-pointer grid-cols-[1.1fr_0.85fr_0.95fr_0.85fr_0.65fr_110px] items-center gap-2 bg-[#141414] px-4 py-3 transition-colors duration-150 hover:bg-white/4 ${
                    index === 0 ? "rounded-t-lg" : ""
                  } ${index === filteredKbs.length - 1 ? "rounded-b-lg" : ""}`}
                  style={{ animationDelay: `${index * 0.04}s` }}
                  onClick={() => setSelectedKb(kb)}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className={`inline-block h-2 w-2 shrink-0 rounded-full bg-linear-to-r ${getGradient(
                        kb.name,
                      )}`}
                    />
                    <span className="truncate text-sm font-medium text-white/90">
                      {kb.name}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-md border border-dashed px-2 py-0.5 text-[10px] ${getStatusClasses(
                        kb.status,
                      )}`}
                    >
                      {titleCase(kb.status)}
                    </span>
                    {isActiveKb && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-dashed border-emerald-400/20 px-2 py-0.5 text-[10px] text-emerald-400/70">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400/70" />
                        Active KB
                      </span>
                    )}
                  </div>

                  <span className="truncate font-mono text-[11px] text-muted-foreground/45">
                    {kb.namespace_id}
                  </span>

                  <div className="min-w-0">
                    <p className="truncate text-[11px] text-muted-foreground/60">
                      {instanceName}
                    </p>
                    <p className="truncate font-mono text-[10px] text-muted-foreground/35">
                      {kb.instance_id.slice(0, 8)}...
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-mono text-[11px] text-muted-foreground/55">
                      {kb.embedding_model}
                    </p>
                    <p className="text-[10px] capitalize text-muted-foreground/35">
                      {kb.distance_metric}
                    </p>
                  </div>

                  <span className="text-[11px] tabular-nums text-muted-foreground/35">
                    {formatDistanceToNow(kb.updated_at)}
                  </span>

                  <div className="flex items-center justify-end">
                    <button
                      className="flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-medium text-muted-foreground/50 opacity-0 transition-all duration-150 hover:bg-white/6 hover:text-white group-hover:opacity-100 focus-visible:opacity-100 disabled:pointer-events-none disabled:opacity-25"
                      onClick={(event) => {
                        event.stopPropagation();
                        setActiveKb(isActiveKb ? null : kb.id);
                      }}
                      disabled={!canSetActive}
                    >
                      {isActiveKb ? (
                        <Check className="h-3 w-3" strokeWidth={1.5} />
                      ) : (
                        "Set Active"
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/4">
                <Database
                  className="h-4 w-4 text-muted-foreground/40"
                  strokeWidth={1.5}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                No knowledge bases found
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground/40">
                {search ||
                instanceFilter !== "all" ||
                namespaceFilter !== "all" ||
                statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Create your first knowledge base to get started"}
              </p>
              <button
                onClick={() => setCreateOpen(true)}
                className="mt-3 text-xs text-primary transition-colors hover:text-primary/80"
              >
                Create your first knowledge base →
              </button>
            </div>
          )}
        </div>
      </div>

      <CreateKnowledgeBaseDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultInstanceId={instanceFilter !== "all" ? instanceFilter : undefined}
        lockInstance={instanceFilter !== "all"}
      />
      <KnowledgeBaseDetailSheet
        knowledgeBase={selectedKb}
        onClose={() => setSelectedKb(null)}
      />
    </div>
  );
}
