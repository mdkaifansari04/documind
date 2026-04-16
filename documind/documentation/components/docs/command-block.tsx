'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommandBlockProps {
  command: string;
  title?: string;
  className?: string;
}

export function CommandBlock({ command, title, className }: CommandBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn('group relative', className)}>
      {title && (
        <div className="text-xs text-muted-foreground mb-1.5 font-medium">
          {title}
        </div>
      )}
      <div className="relative bg-code-bg border border-border rounded-lg overflow-hidden">
        <pre className="p-4 pr-12 overflow-x-auto text-sm font-mono text-code-text">
          <code>{command}</code>
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 p-1.5 rounded-md bg-secondary hover:bg-muted transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
          aria-label="Copy to clipboard"
        >
          {copied ? (
            <Check className="w-4 h-4 text-poof-mint" />
          ) : (
            <Copy className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </div>
    </div>
  );
}

interface MultiCommandBlockProps {
  commands: string[];
  title?: string;
  className?: string;
}

export function MultiCommandBlock({ commands, title, className }: MultiCommandBlockProps) {
  const [copied, setCopied] = useState(false);
  const fullCommand = commands.join('\n');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn('group relative', className)}>
      {title && (
        <div className="text-xs text-muted-foreground mb-1.5 font-medium">
          {title}
        </div>
      )}
      <div className="relative bg-code-bg border border-border rounded-lg overflow-hidden">
        <pre className="p-4 pr-12 overflow-x-auto text-sm font-mono">
          <code>
            {commands.map((cmd, i) => (
              <div key={i} className="text-code-text">
                <span className="text-muted-foreground select-none">$ </span>
                {cmd}
              </div>
            ))}
          </code>
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 p-1.5 rounded-md bg-secondary hover:bg-muted transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
          aria-label="Copy all commands"
        >
          {copied ? (
            <Check className="w-4 h-4 text-poof-mint" />
          ) : (
            <Copy className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </div>
    </div>
  );
}

// Numbered step command block like Clerk docs
interface StepCommandBlockProps {
  step: number;
  title: string;
  command: string;
  description?: string;
  className?: string;
}

export function StepCommandBlock({ step, title, command, description, className }: StepCommandBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn('', className)} id={`step-${step}`}>
      <div className="flex items-start gap-4 mb-3">
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-semibold">
          {step}
        </div>
        <h3 className="text-lg font-semibold text-foreground pt-0.5">{title}</h3>
      </div>
      
      <div className="pl-11">
        <div className="group relative bg-code-bg border border-border rounded-lg overflow-hidden">
          <pre className="p-4 pr-12 overflow-x-auto text-sm font-mono text-code-text">
            <code>{command}</code>
          </pre>
          <button
            onClick={handleCopy}
            className="absolute top-3 right-3 p-1.5 rounded-md bg-secondary hover:bg-muted transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
            aria-label="Copy to clipboard"
          >
            {copied ? (
              <Check className="w-4 h-4 text-poof-mint" />
            ) : (
              <Copy className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </div>
        
        {description && (
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
