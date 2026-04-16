"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Loader2,
  Upload,
  FileText,
  AlertCircle,
  Hash,
  Clock,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  FieldGroup,
  Field,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { useIngestResource, useUploadResource } from "@/hooks/mutations";
import { useResources } from "@/hooks/queries";
import { useAppContext } from "@/lib/context";
import { formatDistanceToNow } from "@/lib/format";
import { ingestResourceSchema, type IngestResourceBody } from "@/utils/validations";

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

export default function ResourcesPage() {
  const {
    activeInstanceId,
    activeNamespaceId,
    activeInstanceName,
    hasContext,
  } = useAppContext();

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadSourceType, setUploadSourceType] = useState<string>("pdf");
  const [uploadSourceRef, setUploadSourceRef] = useState("");

  const ingestMutation = useIngestResource();
  const uploadMutation = useUploadResource();

  const form = useForm<IngestResourceBody>({
    resolver: zodResolver(ingestResourceSchema),
    defaultValues: {
      source_type: "text",
      content: "",
      source_ref: "",
      user_id: "",
      session_id: "",
    },
  });

  const { data: resources, isLoading: loadingResources } = useResources(
    {
      instance_id: activeInstanceId || undefined,
      namespace_id: activeNamespaceId || undefined,
    },
    hasContext
  );

  const onSubmit = (data: IngestResourceBody) => {
    ingestMutation.mutate(
      {
        ...data,
        instance_id: activeInstanceId || undefined,
        namespace_id: activeNamespaceId || undefined,
      },
      {
        onSuccess: (result) => {
          toast.success("Resource ingested", {
            description: `Indexed ${result.chunks_indexed} chunks successfully.`,
          });
          form.reset();
        },
        onError: (error: Error) => {
          toast.error("Failed to ingest resource", {
            description: error.message,
          });
        },
      }
    );
  };

  if (!hasContext) {
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
            <p className="text-xs font-medium text-white/80">
              Context Required
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground/40">
              Please select an instance and namespace from the top bar to manage
              resources.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      {/* Header */}
      <div className="pb-6">
        <h1 className="text-sm font-medium text-white">Resources</h1>
        <p className="mt-0.5 text-xs text-muted-foreground/60">
          Ingest and manage resources for {activeInstanceName} /{" "}
          {activeNamespaceId}
        </p>
      </div>

      <Tabs defaultValue="ingest" className="space-y-5">
        {/* Poof-styled segmented control for tabs */}
        <TabsList className="h-auto w-auto gap-0.5 rounded-md border border-white/6 bg-white/2 p-0.5">
          <TabsTrigger
            value="ingest"
            className="rounded-[5px] border-0 bg-transparent px-2.5 py-1 text-[11px] font-medium text-muted-foreground/50 shadow-none transition-colors hover:text-muted-foreground data-[state=active]:bg-white/8 data-[state=active]:text-white data-[state=active]:shadow-none"
          >
            Ingest Text
          </TabsTrigger>
          <TabsTrigger
            value="upload"
            className="rounded-[5px] border-0 bg-transparent px-2.5 py-1 text-[11px] font-medium text-muted-foreground/50 shadow-none transition-colors hover:text-muted-foreground data-[state=active]:bg-white/8 data-[state=active]:text-white data-[state=active]:shadow-none"
          >
            Upload File
          </TabsTrigger>
          <TabsTrigger
            value="list"
            className="rounded-[5px] border-0 bg-transparent px-2.5 py-1 text-[11px] font-medium text-muted-foreground/50 shadow-none transition-colors hover:text-muted-foreground data-[state=active]:bg-white/8 data-[state=active]:text-white data-[state=active]:shadow-none"
          >
            View Resources
          </TabsTrigger>
        </TabsList>

        {/* Ingest Text/Markdown Tab */}
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
                  <div className="grid gap-4 sm:grid-cols-2">
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
                        Source Reference
                      </FieldLabel>
                      <Input
                        placeholder="e.g., deploy-notes.md"
                        className="h-8 rounded-lg border-white/6 bg-white/3 text-xs placeholder:text-muted-foreground/25 focus-visible:border-white/12 focus-visible:ring-0"
                        {...form.register("source_ref")}
                      />
                      {form.formState.errors.source_ref && (
                        <FieldError>
                          {form.formState.errors.source_ref.message}
                        </FieldError>
                      )}
                    </Field>
                  </div>

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

        {/* Upload File Tab */}
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
                      <span className="rounded-md border border-white/6 bg-white/3 px-2 py-0.5 text-[10px] text-muted-foreground/60">
                        {uploadFile.name}
                      </span>
                    )}
                  </div>
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
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
                  <Field>
                    <FieldLabel className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/50">
                      Source Reference (Optional)
                    </FieldLabel>
                    <Input
                      placeholder="Leave empty to use filename"
                      value={uploadSourceRef}
                      onChange={(e) => setUploadSourceRef(e.target.value)}
                      className="h-8 rounded-lg border-white/6 bg-white/3 text-xs placeholder:text-muted-foreground/25 focus-visible:border-white/12 focus-visible:ring-0"
                    />
                  </Field>
                </div>

                <Button
                  size="sm"
                  className="h-8 rounded-lg text-xs"
                  disabled={!uploadFile || uploadMutation.isPending}
                  onClick={() => {
                    if (!uploadFile || !activeInstanceId || !activeNamespaceId) {
                      return;
                    }
                    const formData = new FormData();
                    formData.append("file", uploadFile);
                    formData.append("instance_id", activeInstanceId);
                    formData.append("namespace_id", activeNamespaceId);
                    formData.append("source_type", uploadSourceType);
                    formData.append("source_ref", uploadSourceRef || uploadFile.name);

                    uploadMutation.mutate(formData, {
                      onSuccess: (result) => {
                        toast.success("File uploaded", {
                          description: `Indexed ${result.chunks_indexed} chunks successfully.`,
                        });
                        setUploadFile(null);
                        setUploadSourceRef("");
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

        {/* Resources List Tab */}
        <TabsContent value="list">
          <div className="overflow-hidden rounded-xl border border-white/6 bg-black">
            {/* Column headers */}
            <div className="grid grid-cols-[1.5fr_0.6fr_0.5fr_0.6fr_0.8fr] items-center gap-2 px-5 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/50">
              <span>Source</span>
              <span>Type</span>
              <span>Chunks</span>
              <span>Status</span>
              <span>Created</span>
            </div>

            {/* Rows */}
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
                      {/* Source */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText
                          className="h-3.5 w-3.5 shrink-0 text-muted-foreground/30"
                          strokeWidth={1.5}
                        />
                        <span className="truncate text-sm font-medium text-white/90">
                          {resource.source_ref}
                        </span>
                      </div>

                      {/* Type */}
                      <span className="inline-block w-fit rounded-md bg-primary/12 px-2 py-0.5 text-[10px] font-medium text-primary">
                        {resource.source_type}
                      </span>

                      {/* Chunks */}
                      <span className="text-[11px] tabular-nums text-muted-foreground/35">
                        {resource.chunks_indexed}
                      </span>

                      {/* Status */}
                      <span
                        className={`inline-flex w-fit items-center gap-1 rounded-md border border-dashed px-2 py-0.5 text-[10px] ${style.border} ${style.text}`}
                      >
                        <span
                          className={`inline-block h-1.5 w-1.5 rounded-full ${style.dot}`}
                        />
                        {resource.status}
                      </span>

                      {/* Created */}
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
                  <p className="text-sm text-muted-foreground">
                    No resources yet
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground/40">
                    Ingest content or upload files to add resources
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
