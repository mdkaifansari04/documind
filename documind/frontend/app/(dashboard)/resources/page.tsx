"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  AlertCircle,
  FileText,
  Link2,
  Loader2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  useCrawlIngest,
  useCrawlPreview,
  useIngestResource,
  useUploadResource,
} from "@/hooks/mutations";
import { useKnowledgeBases, useResources } from "@/hooks/queries";
import { useAppContext } from "@/lib/context";
import { formatDistanceToNow } from "@/lib/format";
import {
  ingestResourceSchema,
  type IngestResourceBody,
} from "@/utils/validations";
import type { CrawlPreviewLinkItem } from "@/lib/types";

const STATUS_STYLES: Record<
  string,
  { dot: string; text: string; border: string }
> = {
  processing: {
    dot: "bg-amber-400/70",
    text: "text-amber-400/70",
    border: "border-amber-400/20",
  },
  done: {
    dot: "bg-emerald-400/70",
    text: "text-emerald-400/70",
    border: "border-emerald-400/20",
  },
  failed: {
    dot: "bg-red-400/70",
    text: "text-red-400/70",
    border: "border-red-400/20",
  },
};

function normalizeUrlInput(raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

function displaySourceRef(sourceRef: string): string {
  const normalized = sourceRef.replace(/\s+/g, " ").trim();
  if (!normalized) return "Untitled source";
  return normalized.length > 140
    ? `${normalized.slice(0, 140)}...`
    : normalized;
}

export default function ResourcesPage() {
  const searchParams = useSearchParams();
  const scopedKbId = searchParams.get("kb")?.trim() || "";
  const queryInstanceId = searchParams.get("instance")?.trim() || "";
  const queryNamespaceId = searchParams.get("namespace")?.trim() || "";

  const {
    activeInstanceId,
    activeNamespaceId,
    activeInstanceName,
    hasContext,
  } = useAppContext();

  const effectiveInstanceId = activeInstanceId || queryInstanceId || "";
  const effectiveNamespaceId = activeNamespaceId || queryNamespaceId || "";
  const hasResourceScope = !!(
    scopedKbId ||
    (effectiveInstanceId && effectiveNamespaceId)
  );

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadSourceType, setUploadSourceType] = useState<string>("pdf");
  const [crawlUrl, setCrawlUrl] = useState("");
  const [crawlSubpages, setCrawlSubpages] = useState(true);
  const [crawlMaxPages, setCrawlMaxPages] = useState(20);
  const [crawlScopeMode, setCrawlScopeMode] = useState<
    "strict_docs" | "same_domain"
  >("strict_docs");
  const [crawlScopePath, setCrawlScopePath] = useState("");
  const [crawledLinks, setCrawledLinks] = useState<string[]>([]);
  const [crawledLinkItems, setCrawledLinkItems] = useState<
    CrawlPreviewLinkItem[]
  >([]);
  const [selectedLinks, setSelectedLinks] = useState<string[]>([]);

  const ingestMutation = useIngestResource();
  const uploadMutation = useUploadResource();
  const crawlPreviewMutation = useCrawlPreview();
  const crawlIngestMutation = useCrawlIngest();

  const { data: knowledgeBases } = useKnowledgeBases(
    effectiveInstanceId || undefined,
  );
  const scopedKb = useMemo(
    () =>
      scopedKbId
        ? (knowledgeBases ?? []).find((kb) => kb.id === scopedKbId) || null
        : null,
    [knowledgeBases, scopedKbId],
  );

  const resourceQuery = scopedKbId
    ? { kb_id: scopedKbId }
    : {
        instance_id: effectiveInstanceId || undefined,
        namespace_id: effectiveNamespaceId || undefined,
      };

  const { data: resources, isLoading: loadingResources } = useResources(
    resourceQuery,
    hasResourceScope,
  );

  const form = useForm<IngestResourceBody>({
    resolver: zodResolver(ingestResourceSchema),
    defaultValues: {
      source_type: "text",
      content: "",
      user_id: "",
      session_id: "",
    },
  });

  const scopePayload = scopedKbId
    ? { kb_id: scopedKbId }
    : {
        instance_id: effectiveInstanceId,
        namespace_id: effectiveNamespaceId,
      };

  const onSubmit = (data: IngestResourceBody) => {
    if (!hasResourceScope) return;
    ingestMutation.mutate(
      {
        ...scopePayload,
        ...data,
      },
      {
        onSuccess: (result) => {
          toast.success("Resource ingested", {
            description: `Indexed ${result.chunks_indexed} chunks successfully.`,
          });
          form.reset({
            source_type: form.getValues("source_type"),
            content: "",
            user_id: "",
            session_id: "",
          });
        },
        onError: (error: Error) => {
          toast.error("Failed to ingest resource", {
            description: error.message,
          });
        },
      },
    );
  };

  const handleRunCrawl = () => {
    if (!hasResourceScope) {
      return;
    }

    const normalizedUrl = normalizeUrlInput(crawlUrl);
    if (!normalizedUrl) {
      toast.error("Documentation URL is required");
      return;
    }

    crawlPreviewMutation.mutate(
      {
        ...scopePayload,
        url: normalizedUrl,
        crawl_subpages: crawlSubpages,
        max_pages: crawlMaxPages,
        scope_mode: crawlScopeMode,
        scope_path:
          crawlScopeMode === "strict_docs" && crawlScopePath.trim()
            ? crawlScopePath.trim()
            : undefined,
      },
      {
        onSuccess: (result) => {
          const items =
            result.link_items && result.link_items.length > 0
              ? result.link_items
              : result.links.map((url) => ({
                  url,
                  score: 50,
                  reasons: [],
                }));
          const orderedLinks = items.map((item) => item.url);
          setCrawledLinkItems(items);
          setCrawledLinks(orderedLinks);
          setSelectedLinks(orderedLinks);
          if (result.scope_mode === "strict_docs") {
            setCrawlScopePath(result.scope_path || "");
          }
          toast.success("Links crawled", {
            description: `Found ${result.count} link${result.count === 1 ? "" : "s"}.`,
          });
        },
        onError: (error: Error) => {
          toast.error("Failed to crawl links", {
            description: error.message,
          });
        },
      },
    );
  };

  const handleIngestLinks = () => {
    if (!hasResourceScope) {
      return;
    }

    if (!selectedLinks.length) {
      toast.error("Select at least one link to ingest");
      return;
    }

    const normalizedUrl = normalizeUrlInput(crawlUrl || selectedLinks[0] || "");
    if (!normalizedUrl) {
      toast.error("Documentation URL is required");
      return;
    }

    crawlIngestMutation.mutate(
      {
        ...scopePayload,
        url: normalizedUrl,
        crawl_subpages: crawlSubpages,
        max_pages: crawlMaxPages,
        urls: selectedLinks,
        scope_mode: crawlScopeMode,
        scope_path:
          crawlScopeMode === "strict_docs" && crawlScopePath.trim()
            ? crawlScopePath.trim()
            : undefined,
      },
      {
        onSuccess: (result) => {
          toast.success("Crawled links ingested", {
            description: `Indexed ${result.total_chunks_indexed} chunks from ${result.success_count} link${result.success_count === 1 ? "" : "s"}.`,
          });
        },
        onError: (error: Error) => {
          toast.error("Failed to ingest links", {
            description: error.message,
          });
        },
      },
    );
  };

  const toggleLinkSelection = (link: string, checked: boolean) => {
    setSelectedLinks((current) => {
      if (checked) {
        if (current.includes(link)) return current;
        return [...current, link];
      }
      return current.filter((item) => item !== link);
    });
  };

  const selectHighConfidenceLinks = () => {
    const highConfidenceUrls = crawledLinkItems
      .filter((item) => item.score >= 70)
      .map((item) => item.url);
    setSelectedLinks(highConfidenceUrls);
  };

  if (!hasContext && !hasResourceScope) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-6">
        <div className="pb-6">
          <h1 className="text-sm font-medium text-white">Resources</h1>
          <p className="mt-0.5 text-xs text-muted-foreground/60">
            Ingest and manage your document resources
          </p>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-white/6 bg-[#111] px-5 py-4">
          <AlertCircle
            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/40"
            strokeWidth={1.5}
          />
          <div>
            <p className="text-xs font-medium text-white/80">Context Required</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground/40">
              Select an instance and namespace from the top bar, or open this page
              from a knowledge base detail sheet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <div className="pb-6">
        <h1 className="text-sm font-medium text-white">Resources</h1>
        <p className="mt-0.5 text-xs text-muted-foreground/60">
          {scopedKb
            ? `Ingest and manage resources for ${scopedKb.name}`
            : `Ingest and manage resources for ${
                activeInstanceName || "selected instance"
              } / ${effectiveNamespaceId}`}
        </p>
      </div>

      <Tabs defaultValue="ingest" className="space-y-5">
        <TabsList className="h-auto w-auto gap-0.5 rounded-md border border-white/6 bg-white/2 p-0.5">
          <TabsTrigger
            value="ingest"
            className="rounded-[5px] border-0 bg-transparent px-2.5 py-1 text-[11px] font-medium text-muted-foreground/50 shadow-none transition-colors hover:text-muted-foreground data-[state=active]:bg-white/8 data-[state=active]:text-white data-[state=active]:shadow-none"
          >
            Ingest Content
          </TabsTrigger>
          <TabsTrigger
            value="upload"
            className="rounded-[5px] border-0 bg-transparent px-2.5 py-1 text-[11px] font-medium text-muted-foreground/50 shadow-none transition-colors hover:text-muted-foreground data-[state=active]:bg-white/8 data-[state=active]:text-white data-[state=active]:shadow-none"
          >
            Upload File
          </TabsTrigger>
          <TabsTrigger
            value="links"
            className="rounded-[5px] border-0 bg-transparent px-2.5 py-1 text-[11px] font-medium text-muted-foreground/50 shadow-none transition-colors hover:text-muted-foreground data-[state=active]:bg-white/8 data-[state=active]:text-white data-[state=active]:shadow-none"
          >
            Ingest Links
          </TabsTrigger>
          <TabsTrigger
            value="list"
            className="rounded-[5px] border-0 bg-transparent px-2.5 py-1 text-[11px] font-medium text-muted-foreground/50 shadow-none transition-colors hover:text-muted-foreground data-[state=active]:bg-white/8 data-[state=active]:text-white data-[state=active]:shadow-none"
          >
            View Resources
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ingest">
          <div className="rounded-xl border border-white/6 bg-[#111]">
            <div className="px-5 py-4">
              <h2 className="text-sm font-medium text-white">Ingest Content</h2>
              <p className="mt-0.5 text-xs text-muted-foreground/40">
                Add text or markdown content to your knowledge base
              </p>
            </div>
            <div className="border-t border-white/6 px-5 py-5">
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <FieldGroup className="gap-4">
                  <Field>
                    <FieldLabel className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/50">
                      Source Type
                    </FieldLabel>
                    <Select
                      value={form.watch("source_type")}
                      onValueChange={(
                        value: "text" | "markdown" | "pdf" | "html" | "docx",
                      ) => form.setValue("source_type", value)}
                    >
                      <SelectTrigger className="h-8 rounded-lg border-white/6 bg-white/3 text-xs focus:ring-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border-white/8 bg-[#1a1a1a] p-1">
                        <SelectItem
                          value="text"
                          className="rounded-md px-2.5 py-1.5 text-xs"
                        >
                          Text
                        </SelectItem>
                        <SelectItem
                          value="markdown"
                          className="rounded-md px-2.5 py-1.5 text-xs"
                        >
                          Markdown
                        </SelectItem>
                        <SelectItem
                          value="html"
                          className="rounded-md px-2.5 py-1.5 text-xs"
                        >
                          HTML
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/50">
                      Content
                    </FieldLabel>
                    <Textarea
                      placeholder="Paste your content here..."
                      rows={10}
                      className="rounded-lg border-white/6 bg-white/3 text-xs placeholder:text-muted-foreground/25 focus-visible:border-white/12 focus-visible:ring-0"
                      {...form.register("content")}
                    />
                    {form.formState.errors.content && (
                      <FieldError>
                        {form.formState.errors.content.message}
                      </FieldError>
                    )}
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field>
                      <FieldLabel className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/50">
                        User ID (Optional)
                      </FieldLabel>
                      <Input
                        placeholder="e.g., user_123"
                        className="h-8 rounded-lg border-white/6 bg-white/3 text-xs placeholder:text-muted-foreground/25 focus-visible:border-white/12 focus-visible:ring-0"
                        {...form.register("user_id")}
                      />
                    </Field>
                    <Field>
                      <FieldLabel className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/50">
                        Session ID (Optional)
                      </FieldLabel>
                      <Input
                        placeholder="e.g., sess_001"
                        className="h-8 rounded-lg border-white/6 bg-white/3 text-xs placeholder:text-muted-foreground/25 focus-visible:border-white/12 focus-visible:ring-0"
                        {...form.register("session_id")}
                      />
                    </Field>
                  </div>

                  <Button
                    type="submit"
                    size="sm"
                    className="h-8 rounded-lg text-xs"
                    disabled={ingestMutation.isPending}
                  >
                    {ingestMutation.isPending && (
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    )}
                    Ingest Content
                  </Button>
                </FieldGroup>
              </form>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="upload">
          <div className="rounded-xl border border-white/6 bg-[#111]">
            <div className="px-5 py-4">
              <h2 className="text-sm font-medium text-white">Upload File</h2>
              <p className="mt-0.5 text-xs text-muted-foreground/40">
                Upload a PDF, DOCX, or other document file
              </p>
            </div>
            <div className="border-t border-white/6 px-5 py-5">
              <FieldGroup className="gap-4">
                <Field>
                  <FieldLabel className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/50">
                    File
                  </FieldLabel>
                  <div className="flex items-center gap-3">
                    <Input
                      type="file"
                      accept=".pdf,.docx,.doc,.txt,.md,.html"
                      onChange={(e) =>
                        setUploadFile(e.target.files?.[0] || null)
                      }
                      className="h-8 flex-1 rounded-lg border-white/6 bg-white/3 text-xs file:text-xs file:text-muted-foreground/50 focus-visible:border-white/12 focus-visible:ring-0"
                    />
                    {uploadFile && (
                      <span className="max-w-[240px] truncate rounded-md border border-white/6 bg-white/3 px-2 py-0.5 text-[10px] text-muted-foreground/60">
                        {uploadFile.name}
                      </span>
                    )}
                  </div>
                </Field>

                <Field>
                  <FieldLabel className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/50">
                    Source Type
                  </FieldLabel>
                  <Select
                    value={uploadSourceType}
                    onValueChange={setUploadSourceType}
                  >
                    <SelectTrigger className="h-8 rounded-lg border-white/6 bg-white/3 text-xs focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border-white/8 bg-[#1a1a1a] p-1">
                      <SelectItem
                        value="pdf"
                        className="rounded-md px-2.5 py-1.5 text-xs"
                      >
                        PDF
                      </SelectItem>
                      <SelectItem
                        value="docx"
                        className="rounded-md px-2.5 py-1.5 text-xs"
                      >
                        DOCX
                      </SelectItem>
                      <SelectItem
                        value="text"
                        className="rounded-md px-2.5 py-1.5 text-xs"
                      >
                        Text
                      </SelectItem>
                      <SelectItem
                        value="markdown"
                        className="rounded-md px-2.5 py-1.5 text-xs"
                      >
                        Markdown
                      </SelectItem>
                      <SelectItem
                        value="html"
                        className="rounded-md px-2.5 py-1.5 text-xs"
                      >
                        HTML
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Button
                  size="sm"
                  className="h-8 rounded-lg text-xs"
                  disabled={!uploadFile || uploadMutation.isPending}
                  onClick={() => {
                    if (!uploadFile || !hasResourceScope) {
                      return;
                    }
                    const formData = new FormData();
                    formData.append("file", uploadFile);
                    formData.append("source_type", uploadSourceType);
                    if (scopedKbId) {
                      formData.append("kb_id", scopedKbId);
                    } else {
                      formData.append("instance_id", effectiveInstanceId);
                      formData.append("namespace_id", effectiveNamespaceId);
                    }

                    uploadMutation.mutate(formData, {
                      onSuccess: (result) => {
                        toast.success("File uploaded", {
                          description: `Indexed ${result.chunks_indexed} chunks successfully.`,
                        });
                        setUploadFile(null);
                      },
                      onError: (error: Error) => {
                        toast.error("Failed to upload file", {
                          description: error.message,
                        });
                      },
                    });
                  }}
                >
                  {uploadMutation.isPending && (
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  )}
                  <Upload className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.5} />
                  Upload File
                </Button>
              </FieldGroup>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="links">
          <div className="rounded-xl border border-white/6 bg-[#111]">
            <div className="px-5 py-4">
              <h2 className="text-sm font-medium text-white">Ingest Link Resources</h2>
              <p className="mt-0.5 text-xs text-muted-foreground/40">
                Crawl documentation links, review discovered pages, and ingest selected
                content into the current scope.
              </p>
            </div>
            <div className="border-t border-white/6 px-5 py-5">
              <FieldGroup className="gap-4">
                <Field>
                  <FieldLabel className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/50">
                    Documentation URL
                  </FieldLabel>
                  <Input
                    placeholder="https://docs.example.com"
                    value={crawlUrl}
                    onChange={(event) => setCrawlUrl(event.target.value)}
                    className="h-8 rounded-lg border-white/6 bg-white/3 text-xs placeholder:text-muted-foreground/25 focus-visible:border-white/12 focus-visible:ring-0"
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/50">
                      Scope Mode
                    </FieldLabel>
                    <Select
                      value={crawlScopeMode}
                      onValueChange={(value: "strict_docs" | "same_domain") =>
                        setCrawlScopeMode(value)
                      }
                    >
                      <SelectTrigger className="h-8 rounded-lg border-white/6 bg-white/3 text-xs focus:ring-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border-white/8 bg-[#1a1a1a] p-1">
                        <SelectItem
                          value="strict_docs"
                          className="rounded-md px-2.5 py-1.5 text-xs"
                        >
                          Strict Docs Scope
                        </SelectItem>
                        <SelectItem
                          value="same_domain"
                          className="rounded-md px-2.5 py-1.5 text-xs"
                        >
                          Same Domain
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/50">
                      Scope Path (Optional)
                    </FieldLabel>
                    <Input
                      placeholder="/docs or /docs/svelte"
                      value={crawlScopePath}
                      disabled={crawlScopeMode === "same_domain"}
                      onChange={(event) => setCrawlScopePath(event.target.value)}
                      className="h-8 rounded-lg border-white/6 bg-white/3 text-xs placeholder:text-muted-foreground/25 focus-visible:border-white/12 focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </Field>
                </div>

                <div className="flex flex-wrap items-end gap-4">
                  <Field className="min-w-[220px] flex-1">
                    <FieldLabel className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/50">
                      Max Pages
                    </FieldLabel>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={crawlMaxPages}
                      onChange={(event) => {
                        const parsed = Number(event.target.value);
                        if (Number.isNaN(parsed)) {
                          setCrawlMaxPages(20);
                          return;
                        }
                        setCrawlMaxPages(Math.max(1, Math.min(100, parsed)));
                      }}
                      className="h-8 w-28 rounded-lg border-white/6 bg-white/3 text-xs focus-visible:border-white/12 focus-visible:ring-0"
                    />
                  </Field>
                  <label className="flex h-8 items-center gap-2 rounded-lg border border-white/6 bg-white/3 px-3">
                    <Switch
                      checked={crawlSubpages}
                      onCheckedChange={setCrawlSubpages}
                    />
                    <span className="text-[11px] text-muted-foreground/60">
                      Crawl subpages
                    </span>
                  </label>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 rounded-lg text-xs"
                    disabled={crawlPreviewMutation.isPending}
                    onClick={handleRunCrawl}
                  >
                    {crawlPreviewMutation.isPending && (
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    )}
                    <Link2 className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.5} />
                    Crawl Links
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 rounded-lg border-primary/30 bg-primary/8 text-xs text-primary hover:bg-primary/15 hover:text-primary"
                    disabled={
                      !selectedLinks.length ||
                      crawlIngestMutation.isPending ||
                      crawlPreviewMutation.isPending
                    }
                    onClick={handleIngestLinks}
                  >
                    {crawlIngestMutation.isPending && (
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    )}
                    Extract & Ingest Selected
                  </Button>
                </div>

                <div className="rounded-lg border border-white/6 bg-black p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-[11px] font-medium text-muted-foreground/60">
                      Crawled Links ({crawledLinks.length})
                    </p>
                    {crawledLinks.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedLinks(crawledLinks)}
                          className="text-[11px] text-muted-foreground/45 transition-colors hover:text-white"
                        >
                          Select all
                        </button>
                        <span className="text-muted-foreground/30">/</span>
                        <button
                          type="button"
                          onClick={selectHighConfidenceLinks}
                          className="text-[11px] text-muted-foreground/45 transition-colors hover:text-white"
                        >
                          Select high confidence
                        </button>
                        <span className="text-muted-foreground/30">/</span>
                        <button
                          type="button"
                          onClick={() => setSelectedLinks([])}
                          className="text-[11px] text-muted-foreground/45 transition-colors hover:text-white"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                  {crawledLinks.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground/35">
                      Run crawl to discover documentation pages.
                    </p>
                  ) : (
                    <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
                      {crawledLinkItems.map((item) => {
                        const link = item.url;
                        const checked = selectedLinks.includes(link);
                        return (
                          <label
                            key={link}
                            className="flex items-center gap-2 rounded-md border border-white/6 bg-[#141414] px-2.5 py-1.5"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(value) =>
                                toggleLinkSelection(link, value === true)
                              }
                              className="size-3.5"
                            />
                            <div className="min-w-0 flex-1">
                              <span className="block truncate font-mono text-[11px] text-white/75">
                                {link}
                              </span>
                              {item.reasons.length > 0 && (
                                <span className="block truncate text-[10px] text-muted-foreground/40">
                                  {item.reasons.join(", ")}
                                </span>
                              )}
                            </div>
                            <span className="rounded-md border border-primary/25 bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                              {item.score}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </FieldGroup>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="list">
          <div className="overflow-hidden rounded-xl border border-white/6 bg-black">
            <div className="grid grid-cols-[1.5fr_0.6fr_0.5fr_0.6fr_0.8fr] items-center gap-2 px-5 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/50">
              <span>Source</span>
              <span>Type</span>
              <span>Chunks</span>
              <span>Status</span>
              <span>Created</span>
            </div>

            <div className="flex flex-col gap-px px-1 pb-1.5">
              {loadingResources ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={`grid grid-cols-[1.5fr_0.6fr_0.5fr_0.6fr_0.8fr] items-center gap-2 bg-[#141414] px-4 py-3 ${i === 0 ? "rounded-t-lg" : ""} ${i === 4 ? "rounded-b-lg" : ""}`}
                  >
                    <Skeleton className="h-4 w-32 rounded-md bg-white/3" />
                    <Skeleton className="h-4 w-14 rounded-md bg-white/3" />
                    <Skeleton className="h-4 w-8 rounded-md bg-white/3" />
                    <Skeleton className="h-4 w-16 rounded-md bg-white/3" />
                    <Skeleton className="h-4 w-20 rounded-md bg-white/3" />
                  </div>
                ))
              ) : resources && resources.length > 0 ? (
                resources.map((resource, index) => {
                  const style =
                    STATUS_STYLES[resource.status] || STATUS_STYLES.processing;
                  return (
                    <div
                      key={resource.id}
                      className={`group grid grid-cols-[1.5fr_0.6fr_0.5fr_0.6fr_0.8fr] items-center gap-2 bg-[#141414] px-4 py-3 transition-colors duration-150 hover:bg-white/4 ${index === 0 ? "rounded-t-lg" : ""} ${index === resources.length - 1 ? "rounded-b-lg" : ""}`}
                      style={{ animationDelay: `${index * 0.04}s` }}
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <FileText
                          className="h-3.5 w-3.5 shrink-0 text-muted-foreground/30"
                          strokeWidth={1.5}
                        />
                        <span className="truncate text-sm font-medium text-white/90">
                          {displaySourceRef(resource.source_ref)}
                        </span>
                      </div>

                      <span className="inline-block w-fit rounded-md bg-primary/12 px-2 py-0.5 text-[10px] font-medium text-primary">
                        {resource.source_type}
                      </span>

                      <span className="text-[11px] tabular-nums text-muted-foreground/35">
                        {resource.chunks_indexed}
                      </span>

                      <span
                        className={`inline-flex w-fit items-center gap-1 rounded-md border border-dashed px-2 py-0.5 text-[10px] ${style.border} ${style.text}`}
                      >
                        <span
                          className={`inline-block h-1.5 w-1.5 rounded-full ${style.dot}`}
                        />
                        {resource.status}
                      </span>

                      <span className="text-[11px] tabular-nums text-muted-foreground/35">
                        {formatDistanceToNow(resource.created_at)}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="px-6 py-16 text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/4">
                    <FileText
                      className="h-4 w-4 text-muted-foreground/40"
                      strokeWidth={1.5}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">No resources yet</p>
                  <p className="mt-0.5 text-xs text-muted-foreground/40">
                    Ingest content, upload files, or crawl docs links to add resources
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
