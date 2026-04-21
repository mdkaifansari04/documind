import { DocsLayout } from '@/components/docs/docs-layout';
import { pipelineSteps } from '@/lib/docs-data';
import Image from 'next/image';

const colorClasses: Record<string, string> = {
  violet: 'bg-poof-violet/10 border-poof-violet/30 text-poof-violet',
  accent: 'bg-primary/10 border-primary/30 text-primary',
  peach: 'bg-poof-peach/10 border-poof-peach/30 text-poof-peach',
  mint: 'bg-poof-mint/10 border-poof-mint/30 text-poof-mint',
};

export default function ArchitecturePage() {
  return (
    <DocsLayout
      pageId="architecture"
      title="Architecture"
      description="How DocuMind moves from raw docs to grounded answers without feeding the LLM your entire company wiki every request."
      breadcrumbs={[{ label: 'Docs', href: '/docs' }, { label: 'Architecture' }]}
    >
      <section id="pipeline" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">System Architecture</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          The architecture is intentionally boring in the best way: clear boundaries, predictable flow, minimal magic. We ingest once, retrieve fast, answer with context, and score output quality so we know when things drift.
        </p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pipelineSteps.map((step) => (
            <div key={step.step} className={`rounded-lg border p-4 ${colorClasses[step.color]}`}>
              <p className="text-xs uppercase tracking-wide opacity-80 mb-1">{step.step}</p>
              <p className="text-sm font-medium">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="data-flow" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">Data Flows</h2>

        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-card border border-border">
            <h3 className="font-semibold text-foreground mb-2">Ingestion Flow</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Upload docs, parse text, split into overlap-aware chunks (commonly around 512 tokens with overlap), embed, and upsert into Actian with metadata. Translation: we turn document chaos into searchable memory.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              It supports docs and conversation-like sources, because yes, team knowledge also lives in chat logs and random transcript dumps.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-card border border-border">
            <h3 className="font-semibold text-foreground mb-2">Query Flow</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              User asks question, system embeds query, runs semantic or hybrid retrieval, picks top chunks, and injects only that context into the answer prompt.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This is the opposite of paste-everything-and-pray prompting. Cheaper, faster, and way less hallucinatory.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-card border border-border">
            <h3 className="font-semibold text-foreground mb-2">Memory Flow</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Conversation history can be ingested into a dedicated `conversation_memory` index with session and user metadata. At query time we retrieve only relevant memory snippets, not the full transcript novel.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Net effect: the assistant feels consistent across sessions instead of acting like it had a hard reset every hour.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-card border border-border">
            <h3 className="font-semibold text-foreground mb-2">Observability Flow</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Every query cycle gets scored for retrieval quality, chunk relevance, and hallucination rate. Alerts fire on threshold breaches so bad answers do not quietly become normal.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Because seeming fine in one demo is not a monitoring strategy.
            </p>
          </div>
        </div>
      </section>

      <section id="diagram" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">Architecture Diagram</h2>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Image
            src="/images/arch-light.svg"
            alt="DocuMind architecture diagram (light theme)"
            width={1800}
            height={1000}
            className="block w-full h-auto dark:hidden"
            priority
          />
          <Image
            src="/images/arch-dark.svg"
            alt="DocuMind architecture diagram (dark theme)"
            width={1800}
            height={1000}
            className="hidden w-full h-auto dark:block"
            priority
          />
        </div>
      </section>
    </DocsLayout>
  );
}
