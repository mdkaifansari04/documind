"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FieldGroup,
  Field,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { useInstances } from "@/hooks/queries";
import { useCreateKnowledgeBase } from "@/hooks/mutations";
import {
  createKnowledgeBaseSchema,
  type CreateKnowledgeBaseBody,
} from "@/utils/validations";
import { useAppContext } from "@/lib/context";
import type { KnowledgeBase } from "@/lib/types";

interface CreateKnowledgeBaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultInstanceId?: string;
  lockInstance?: boolean;
  onCreated?: (knowledgeBase: KnowledgeBase) => void;
}

export function CreateKnowledgeBaseDialog({
  open,
  onOpenChange,
  defaultInstanceId,
  lockInstance = false,
  onCreated,
}: CreateKnowledgeBaseDialogProps) {
  const { activeInstanceId } = useAppContext();
  const createMutation = useCreateKnowledgeBase();

  const { data: instances } = useInstances();

  const form = useForm<CreateKnowledgeBaseBody>({
    resolver: zodResolver(createKnowledgeBaseSchema),
    defaultValues: {
      instance_id: defaultInstanceId || activeInstanceId || "",
      namespace_id: "",
      name: "",
      embedding_profile: "general_text_search",
      distance_metric: "cosine",
    },
  });

  useEffect(() => {
    if (!open) return;
    const resolvedInstanceId = defaultInstanceId || activeInstanceId || "";
    form.reset({
      instance_id: resolvedInstanceId,
      namespace_id: "",
      name: "",
      embedding_profile: "general_text_search",
      distance_metric: "cosine",
      llm_profile: "",
      embedding_model: "",
    });
  }, [open, defaultInstanceId, activeInstanceId, form]);

  const onSubmit = (data: CreateKnowledgeBaseBody) => {
    createMutation.mutate(data, {
      onSuccess: (kb) => {
        toast.success("Knowledge Base created", {
          description: `"${kb.name}" has been created successfully.`,
        });
        onCreated?.(kb);
        onOpenChange(false);
        form.reset();
      },
      onError: (error: Error) => {
        toast.error("Failed to create Knowledge Base", {
          description: error.message || "An unexpected error occurred.",
        });
      },
    });
  };

  const triggerClassName =
    "h-8 border-white/6 bg-white/3 text-xs text-white shadow-none data-[placeholder]:text-muted-foreground/25 focus-visible:border-white/12 focus-visible:ring-0";
  const contentClassName =
    "rounded-lg border-white/8 bg-[#1a1a1a] p-1 text-xs text-white";
  const itemClassName =
    "rounded-md px-2.5 py-1.5 text-xs text-muted-foreground focus:bg-white/8 focus:text-white";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg border-white/6 bg-[#111] p-0 gap-0 rounded-xl">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-sm font-medium text-white">
            Create Knowledge Base
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground/50">
            Create a new knowledge base to store and query documents.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup className="gap-4 px-6 py-5">
            <Field>
              <FieldLabel
                htmlFor="instance_id"
                className="text-[11px] uppercase tracking-wide text-muted-foreground/50 font-medium"
              >
                Instance
              </FieldLabel>
              <Select
                value={form.watch("instance_id")}
                onValueChange={(value) => form.setValue("instance_id", value)}
                disabled={lockInstance}
              >
                <SelectTrigger
                  id="instance_id"
                  className={`${triggerClassName} ${
                    lockInstance
                      ? "cursor-not-allowed opacity-60"
                      : ""
                  }`}
                >
                  <SelectValue placeholder="Select an instance" />
                </SelectTrigger>
                <SelectContent className={contentClassName}>
                  {instances?.map((instance) => (
                    <SelectItem
                      key={instance.id}
                      value={instance.id}
                      className={itemClassName}
                    >
                      {instance.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.instance_id && (
                <FieldError className="text-[11px]">
                  {form.formState.errors.instance_id.message}
                </FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel
                htmlFor="namespace_id"
                className="text-[11px] uppercase tracking-wide text-muted-foreground/50 font-medium"
              >
                Namespace
              </FieldLabel>
              <Input
                id="namespace_id"
                placeholder="e.g., engineering-docs"
                className="h-8 rounded-lg border-white/6 bg-white/3 text-xs placeholder:text-muted-foreground/25 focus-visible:border-white/12 focus-visible:ring-0"
                {...form.register("namespace_id")}
              />
              {form.formState.errors.namespace_id && (
                <FieldError className="text-[11px]">
                  {form.formState.errors.namespace_id.message}
                </FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel
                htmlFor="name"
                className="text-[11px] uppercase tracking-wide text-muted-foreground/50 font-medium"
              >
                Name
              </FieldLabel>
              <Input
                id="name"
                placeholder="e.g., Engineering Documentation"
                className="h-8 rounded-lg border-white/6 bg-white/3 text-xs placeholder:text-muted-foreground/25 focus-visible:border-white/12 focus-visible:ring-0"
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <FieldError className="text-[11px]">
                  {form.formState.errors.name.message}
                </FieldError>
              )}
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel
                  htmlFor="embedding_profile"
                  className="text-[11px] uppercase tracking-wide text-muted-foreground/50 font-medium"
                >
                  Embedding Profile
                </FieldLabel>
                <Select
                  value={form.watch("embedding_profile")}
                  onValueChange={(value) =>
                    form.setValue("embedding_profile", value)
                  }
                >
                  <SelectTrigger
                    id="embedding_profile"
                    className={triggerClassName}
                  >
                    <SelectValue placeholder="Select profile" />
                  </SelectTrigger>
                  <SelectContent className={contentClassName}>
                    <SelectItem
                      value="general_text_search"
                      className={itemClassName}
                    >
                      General Text Search
                    </SelectItem>
                    <SelectItem value="code_search" className={itemClassName}>
                      Code Search
                    </SelectItem>
                    <SelectItem value="qa" className={itemClassName}>
                      Q&A
                    </SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel
                  htmlFor="distance_metric"
                  className="text-[11px] uppercase tracking-wide text-muted-foreground/50 font-medium"
                >
                  Distance Metric
                </FieldLabel>
                <Select
                  value={form.watch("distance_metric")}
                  onValueChange={(value: "cosine" | "euclidean" | "dot") =>
                    form.setValue("distance_metric", value)
                  }
                >
                  <SelectTrigger id="distance_metric" className={triggerClassName}>
                    <SelectValue placeholder="Select metric" />
                  </SelectTrigger>
                  <SelectContent className={contentClassName}>
                    <SelectItem value="cosine" className={itemClassName}>
                      Cosine
                    </SelectItem>
                    <SelectItem value="euclidean" className={itemClassName}>
                      Euclidean
                    </SelectItem>
                    <SelectItem value="dot" className={itemClassName}>
                      Dot Product
                    </SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field>
              <FieldLabel
                htmlFor="llm_profile"
                className="text-[11px] uppercase tracking-wide text-muted-foreground/50 font-medium"
              >
                LLM Profile
              </FieldLabel>
              <Select
                value={form.watch("llm_profile") || ""}
                onValueChange={(value) => form.setValue("llm_profile", value)}
              >
                <SelectTrigger id="llm_profile" className={triggerClassName}>
                  <SelectValue placeholder="Select LLM profile (optional)" />
                </SelectTrigger>
                <SelectContent className={contentClassName}>
                  <SelectItem value="balanced" className={itemClassName}>
                    Balanced
                  </SelectItem>
                  <SelectItem value="fast" className={itemClassName}>
                    Fast
                  </SelectItem>
                  <SelectItem value="accurate" className={itemClassName}>
                    Accurate
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          <div className="flex items-center justify-end gap-2 border-t border-white/6 px-6 py-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-8 rounded-lg px-3 text-[11px] font-medium text-muted-foreground/50 transition-colors hover:text-white"
            >
              Cancel
            </button>
            <Button
              type="submit"
              size="sm"
              className="h-8 rounded-lg text-xs"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              )}
              Create Knowledge Base
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
