import { DocsLayout } from '@/components/docs/docs-layout';
import { includedScope, deferredScope } from '@/lib/docs-data';
import { CheckCircle, Circle } from 'lucide-react';

export default function HackathonScopePage() {
  return (
    <DocsLayout
      pageId="hackathon-scope"
      title="Hackathon Scope"
      description="What we shipped in this build, what we intentionally postponed, and why those tradeoffs were the right call."
      breadcrumbs={[{ label: 'Docs', href: '/docs' }, { label: 'Hackathon Scope' }]}
    >
      <section className="mb-12">
        <p className="text-muted-foreground leading-relaxed">
          We treated scope like a feature, not an afterthought. If we tried to build every enterprise checkbox during hackathon time, we would have delivered a beautiful pile of unfinished ambition.
        </p>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section id="included" className="p-6 rounded-xl bg-poof-mint/5 border border-poof-mint/20">
          <div className="flex items-center gap-2 mb-6">
            <CheckCircle className="w-5 h-5 text-poof-mint" />
            <h2 className="text-lg font-semibold text-poof-mint">Included in This Build</h2>
          </div>

          <ul className="space-y-3">
            {includedScope.map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-poof-mint flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">{item.text}</span>
              </li>
            ))}
          </ul>
        </section>

        <section id="deferred" className="p-6 rounded-xl bg-muted/30 border border-border">
          <div className="flex items-center gap-2 mb-6">
            <Circle className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-muted-foreground">Deferred On Purpose</h2>
          </div>

          <ul className="space-y-3">
            {deferredScope.map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <span className="text-sm text-muted-foreground">{item.text}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">Decision Notes</h2>
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-card border border-border">
            <h3 className="font-medium text-foreground mb-2">Why retrieval quality came first</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              For this project, quality of answers is the product. Shipping auth before grounding would be like painting a race car that has no engine.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <h3 className="font-medium text-foreground mb-2">Why observability made the cut</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              It is easy to demo one good answer. It is hard to keep quality stable over time. Observability gives us signal instead of vibes.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <h3 className="font-medium text-foreground mb-2">Why deployment hardening is deferred</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Production hardening matters, but doing it too early would slow the core loop. We built a strong retrieval foundation first so scale work later is worth it.
            </p>
          </div>
        </div>
      </section>
    </DocsLayout>
  );
}
