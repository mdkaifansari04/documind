"use client";

import { useState } from "react";
import Link from "next/link";
import { Database, Copy, Plus } from "lucide-react";
import { toast } from "sonner";
import { CreateKnowledgeBaseDialog } from "@/components/dialogs/create-kb-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useKnowledgeBases } from "@/hooks/queries";
import { useAppContext } from "@/lib/context";
import { formatDateTime } from "@/lib/format";
import type { Instance } from "@/lib/types";

interface InstanceDetailSheetProps {
  instance: Instance | null;
  onClose: () => void;
}

export function InstanceDetailSheet({
  instance,
  onClose,
}: InstanceDetailSheetProps) {
  const [createKbOpen, setCreateKbOpen] = useState(false);
  const { activeInstanceId, setActiveInstance } = useAppContext();

  const { data: knowledgeBases, isLoading: loadingKbs } = useKnowledgeBases(
    instance?.id
  );

  const namespaces = knowledgeBases
    ? [...new Set(knowledgeBases.map((kb) => kb.namespace_id))]
    : [];

  const copyId = () => {
    if (instance) {
      navigator.clipboard.writeText(instance.id);
      toast.success("Instance ID copied to clipboard");
    }
  };

  return (
    <Sheet open={!!instance} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="overflow-y-auto sm:max-w-lg border-white/6 bg-[#111] p-0 gap-0">
        {instance && (
          <>
            <SheetHeader className="px-6 pt-6 pb-0">
              <div className="flex items-start justify-between">
                <div>
                  <SheetTitle className="text-sm font-medium text-white">
                    {instance.name}
                  </SheetTitle>
                  <SheetDescription className="mt-1 text-xs text-muted-foreground/50">
                    {instance.description || "No description provided"}
                  </SheetDescription>
                </div>
                {activeInstanceId === instance.id ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-dashed border-emerald-400/20 px-2 py-0.5 text-[10px] text-emerald-400/70">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400/70" />
                    Active
                  </span>
                ) : (
                  <button
                    onClick={() =>
                      setActiveInstance(instance.id, instance.name)
                    }
                    className="h-7 rounded-lg px-3 text-[11px] font-medium text-muted-foreground/50 transition-colors hover:bg-white/6 hover:text-white"
                  >
                    Set Active
                  </button>
                )}
              </div>
            </SheetHeader>

            <div className="mt-6 space-y-0 px-6 pb-6">
              {/* Instance Details */}
              <div className="rounded-xl border border-white/6 bg-black p-4">
                <h3 className="mb-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/50">
                  Details
                </h3>
                <dl className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground/40">ID</dt>
                    <dd className="flex items-center gap-1.5 font-mono text-[11px] text-white/70">
                      {instance.id.slice(0, 8)}...
                      <button
                        className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/30 transition-colors hover:bg-white/6 hover:text-muted-foreground"
                        onClick={copyId}
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground/40">Created</dt>
                    <dd className="tabular-nums text-white/70">
                      {formatDateTime(instance.created_at)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground/40">Updated</dt>
                    <dd className="tabular-nums text-white/70">
                      {formatDateTime(instance.updated_at)}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="h-px bg-white/6 my-5" />

              {/* Namespaces */}
              <div>
                <h3 className="mb-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/50">
                  Namespaces ({namespaces.length})
                </h3>
                {loadingKbs ? (
                  <div className="space-y-2">
                    <Skeleton className="h-7 w-full rounded-md bg-white/3" />
                    <Skeleton className="h-7 w-3/4 rounded-md bg-white/3" />
                  </div>
                ) : namespaces.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {namespaces.map((ns) => (
                      <span
                        key={ns}
                        className="rounded-md border border-white/6 bg-white/3 px-2 py-1 text-[11px] text-white/60"
                      >
                        {ns}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground/35">
                    No namespaces yet
                  </p>
                )}
              </div>

              <div className="h-px bg-white/6 my-5" />

              {/* Knowledge Bases */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/50">
                    Knowledge Bases ({knowledgeBases?.length ?? 0})
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCreateKbOpen(true)}
                      className="inline-flex h-7 items-center gap-1 rounded-md border border-white/8 bg-white/3 px-2 text-[11px] text-muted-foreground/60 transition-colors hover:bg-white/6 hover:text-white"
                    >
                      <Plus className="h-3 w-3" strokeWidth={1.5} />
                      Create KB
                    </button>
                    <Link
                      href={`/knowledge-bases?instance=${instance.id}`}
                      className="text-[11px] text-muted-foreground/40 underline underline-offset-4 decoration-muted-foreground/20 transition-colors hover:text-white hover:decoration-white/40"
                    >
                      View all
                    </Link>
                  </div>
                </div>
                {loadingKbs ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton
                        key={i}
                        className="h-14 w-full rounded-lg bg-white/3"
                      />
                    ))}
                  </div>
                ) : knowledgeBases && knowledgeBases.length > 0 ? (
                  <div className="space-y-1.5">
                    {knowledgeBases.slice(0, 5).map((kb) => (
                      <div
                        key={kb.id}
                        className="flex items-center justify-between rounded-lg border border-white/6 bg-[#141414] px-3.5 py-2.5 transition-colors hover:bg-white/4"
                      >
                        <div className="flex items-center gap-2.5">
                          <Database className="h-3.5 w-3.5 text-muted-foreground/30" />
                          <div>
                            <p className="text-xs font-medium text-white/80">
                              {kb.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground/35">
                              {kb.namespace_id}
                            </p>
                          </div>
                        </div>
                        <span className="rounded-md border border-white/6 bg-white/3 px-2 py-0.5 text-[10px] text-muted-foreground/50">
                          {kb.status}
                        </span>
                      </div>
                    ))}
                    {knowledgeBases.length > 5 && (
                      <p className="pt-1 text-center text-[11px] text-muted-foreground/30">
                        + {knowledgeBases.length - 5} more
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground/35">
                    No knowledge bases yet
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
      <CreateKnowledgeBaseDialog
        open={createKbOpen}
        onOpenChange={setCreateKbOpen}
        defaultInstanceId={instance?.id}
        lockInstance
      />
    </Sheet>
  );
}
