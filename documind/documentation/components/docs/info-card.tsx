'use client';

import { cn } from '@/lib/utils';
import { FileCode2, Server, Layers, Activity, Terminal, Cpu } from 'lucide-react';

interface InfoCardProps {
  name: string;
  description: string;
  fileRef?: string;
  className?: string;
  index?: number;
}

const iconMap: Record<string, React.ElementType> = {
  'DocuMind API': FileCode2,
  'Runtime Container': Server,
  'Retrieval Layer': Layers,
  'Observability Layer': Activity,
  'DCLI Interface': Terminal,
  'MCP Server': Cpu,
};

export function InfoCard({ name, description, fileRef, className, index = 0 }: InfoCardProps) {
  const Icon = iconMap[name] || FileCode2;
  
  return (
    <div 
      className={cn(
        'group relative p-5 bg-card border border-border rounded-xl',
        'hover:border-poof-accent/30 hover:bg-secondary/50',
        'transition-all duration-300 ease-out',
        'animate-in fade-in slide-in-from-bottom-2',
        className
      )}
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-poof-accent/10 border border-poof-accent/20 flex items-center justify-center">
          <Icon className="w-5 h-5 text-poof-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-foreground mb-1.5 group-hover:text-poof-violet transition-colors">
            {name}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
          {fileRef && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-2 py-1 bg-secondary/50 border border-border rounded-md">
              <FileCode2 className="w-3 h-3 text-muted-foreground" />
              <code className="text-xs font-mono text-muted-foreground">{fileRef}</code>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
