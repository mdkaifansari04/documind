'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FieldGroup, Field, FieldLabel, FieldError } from '@/components/ui/field'
import api from '@/lib/api'
import type { ApiError } from '@/lib/types'

const createInstanceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
})

type CreateInstanceForm = z.infer<typeof createInstanceSchema>

interface CreateInstanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateInstanceDialog({
  open,
  onOpenChange,
}: CreateInstanceDialogProps) {
  const queryClient = useQueryClient()

  const form = useForm<CreateInstanceForm>({
    resolver: zodResolver(createInstanceSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  })

  const createMutation = useMutation({
    mutationFn: api.createInstance.bind(api),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['instances'] })
      toast.success('Instance created', {
        description: `"${data.name}" has been created successfully.`,
      })
      onOpenChange(false)
      form.reset()
    },
    onError: (error: ApiError) => {
      toast.error('Failed to create instance', {
        description: error.message || 'An unexpected error occurred.',
      })
    },
  })

  const onSubmit = (data: CreateInstanceForm) => {
    createMutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-white/6 bg-[#111] p-0 gap-0 rounded-xl">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-sm font-medium text-white">Create Instance</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground/50">
            Create a new instance to organize your knowledge bases.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup className="gap-4 px-6 py-5">
            <Field>
              <FieldLabel htmlFor="name" className="text-[11px] uppercase tracking-wide text-muted-foreground/50 font-medium">Name</FieldLabel>
              <Input
                id="name"
                placeholder="e.g., Acme Corp"
                className="h-8 rounded-lg border-white/6 bg-white/3 text-xs placeholder:text-muted-foreground/25 focus-visible:border-white/12 focus-visible:ring-0"
                {...form.register('name')}
              />
              {form.formState.errors.name && (
                <FieldError>{form.formState.errors.name.message}</FieldError>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="description" className="text-[11px] uppercase tracking-wide text-muted-foreground/50 font-medium">Description (Optional)</FieldLabel>
              <Textarea
                id="description"
                placeholder="Brief description of this instance..."
                rows={3}
                className="rounded-lg border-white/6 bg-white/3 text-xs placeholder:text-muted-foreground/25 focus-visible:border-white/12 focus-visible:ring-0"
                {...form.register('description')}
              />
              {form.formState.errors.description && (
                <FieldError>
                  {form.formState.errors.description.message}
                </FieldError>
              )}
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
              Create Instance
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
