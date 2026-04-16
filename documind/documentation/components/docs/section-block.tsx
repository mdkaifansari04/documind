'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface SectionBlockProps {
  id: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

export function SectionBlock({ id, title, subtitle, children, className }: SectionBlockProps) {
  return (
    <section 
      id={id} 
      className={cn(
        'scroll-mt-24 py-10 border-b border-border/50 last:border-b-0',
        'animate-in fade-in slide-in-from-bottom-4 duration-500',
        className
      )}
    >
      <h2 className="text-2xl font-bold text-foreground mb-2 tracking-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="text-muted-foreground mb-6 leading-relaxed max-w-2xl text-balance">
          {subtitle}
        </p>
      )}
      <div className="mt-6">
        {children}
      </div>
    </section>
  );
}

interface SubSectionProps {
  id: string;
  title: string;
  children: ReactNode;
  className?: string;
}

export function SubSection({ id, title, children, className }: SubSectionProps) {
  return (
    <div id={id} className={cn('scroll-mt-24 mt-8 first:mt-0', className)}>
      <h3 className="text-lg font-semibold text-foreground mb-4">
        {title}
      </h3>
      {children}
    </div>
  );
}
