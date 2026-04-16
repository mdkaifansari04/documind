'use client';

import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle, XCircle, ImageOff } from 'lucide-react';
import type { TestCard as TestCardType } from '@/lib/docs-data';
import Image from 'next/image';
import { useState } from 'react';

interface TestCardProps {
  test: TestCardType;
  index?: number;
}

const statusConfig = {
  'Passed': {
    icon: CheckCircle2,
    bg: 'bg-poof-mint/10',
    border: 'border-poof-mint/30',
    text: 'text-poof-mint',
  },
  'Needs Review': {
    icon: AlertCircle,
    bg: 'bg-poof-peach/10',
    border: 'border-poof-peach/30',
    text: 'text-poof-peach',
  },
  'Failed': {
    icon: XCircle,
    bg: 'bg-destructive/10',
    border: 'border-destructive/30',
    text: 'text-destructive',
  },
};

export function TestCard({ test, index = 0 }: TestCardProps) {
  const [imageError, setImageError] = useState(false);
  const config = statusConfig[test.status];
  const StatusIcon = config.icon;

  return (
    <div 
      className={cn(
        'group relative bg-card border border-border rounded-xl overflow-hidden',
        'hover:border-poof-accent/30 transition-all duration-300',
        'animate-in fade-in slide-in-from-bottom-3'
      )}
      style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'both' }}
    >
      {/* Image or Placeholder */}
      <div className="relative aspect-video bg-secondary/50 border-b border-border">
        {test.image && !imageError ? (
          <Image 
            src={test.image} 
            alt={test.title}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
            <ImageOff className="w-8 h-8 mb-2 opacity-50" />
            <span className="text-xs opacity-50">Screenshot not available</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-base font-semibold text-foreground leading-tight">
            {test.title}
          </h3>
          <span className={cn(
            'flex-shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
            config.bg,
            config.border,
            config.text,
            'border'
          )}>
            <StatusIcon className="w-3 h-3" />
            {test.status}
          </span>
        </div>

        {/* Objective */}
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          {test.objective}
        </p>

        {/* Command */}
        <div className="mb-3">
          <div className="text-xs text-muted-foreground mb-1 font-medium">Command</div>
          <div className="bg-code-bg border border-border rounded-md p-2.5 overflow-x-auto">
            <code className="text-xs font-mono text-code-text whitespace-nowrap">
              {test.command}
            </code>
          </div>
        </div>

        {/* Notes */}
        <div>
          <div className="text-xs text-muted-foreground mb-1 font-medium">Notes</div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {test.notes}
          </p>
        </div>
      </div>
    </div>
  );
}
