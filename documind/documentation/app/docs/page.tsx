import { DocsLayout } from '@/components/docs/docs-layout';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function OverviewPage() {
  return (
    <DocsLayout
      pageId="overview"
      title="DocuMind Documentation"
      description="The full map of what we built for the Actian hackathon: ingestion, retrieval, grounded answers, memory, observability, DCLI, and MCP."
      breadcrumbs={[{ label: 'Docs', href: '/docs' }, { label: 'Overview' }]}
    >
      <section id="origin-story" className="mb-8 sm:mb-12">
        <h2 className="text-sm font-medium text-foreground mb-3 sm:mb-4">
          The 2AM Origin Story
        </h2>
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground mb-3">
            I was at work, asked our AI a basic internal question about deployment, and it answered with full confidence and zero facts. You know that moment when the model sounds like a senior engineer but it is absolutely improvising? Yeah, that moment.
          </p>
          <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground mb-3">
            I just sat there thinking: why are we pretending this is fine when the docs exist and the AI just cannot see them? So we built DocuMind in hackathon mode slightly sleep-deprived, aggressively caffeinated, and very motivated by spite.
          </p>
          <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
            The goal was simple: stop vibe-based answers. Make the model read our actual documentation before it says anything smart-looking.
          </p>
        </div>
      </section>

      <section id="solution-overview" className="mb-8 sm:mb-12">
        <h2 className="text-sm font-medium text-foreground mb-3 sm:mb-4">
          What We Actually Built
        </h2>
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground mb-3">
            DocuMind is an internal documentation intelligence layer. Drop in your docs, we parse and chunk them, generate embeddings, store vectors in Actian, and retrieve only the relevant slices when someone asks a question.
          </p>
          <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground mb-3">
            Instead of dumping your entire wiki into one prompt and praying, we send only top relevant chunks. Think of it like giving the LLM a curated reading list instead of making it speed-read your whole company.
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {[
              'Ingestion for markdown, text, PDF, URL, transcripts, conversation JSON',
              'Semantic and hybrid retrieval',
              'Grounded Q&A with source snippets',
              'Memory namespace for conversation context',
              'Observability scoring + alerts',
              'DCLI and MCP integration',
            ].map((item) => (
              <div key={item} className="rounded-lg border border-border bg-secondary/30 px-3 py-2">
                <p className="text-xs sm:text-sm text-foreground">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="problem-fit" className="mb-8 sm:mb-12">
        <h2 className="text-sm font-medium text-foreground mb-3 sm:mb-4">
          Why This Works (And Why It Matters)
        </h2>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="grid grid-cols-[1fr_1fr] gap-0 border-b border-border/70">
            <div className="px-4 py-3 text-xs sm:text-sm font-medium text-foreground">Problem</div>
            <div className="px-4 py-3 text-xs sm:text-sm font-medium text-foreground border-l border-border/70">How DocuMind Handles It</div>
          </div>
          {[
            ['Internal docs are private', 'We index them directly in a vector store and retrieve at query time.'],
            ['Docs are huge and fragmented', 'We chunk + index them so retrieval stays fast and focused.'],
            ['LLM answers can hallucinate', 'We ground responses on retrieved context and return sources.'],
            ['Teams lack quality visibility', 'Observability scores retrieval quality, relevance, and hallucination rate.'],
          ].map(([problem, fix]) => (
            <div key={problem} className="grid grid-cols-[1fr_1fr] border-b last:border-b-0 border-border/50">
              <div className="px-4 py-3 text-xs sm:text-sm text-muted-foreground">{problem}</div>
              <div className="px-4 py-3 text-xs sm:text-sm text-muted-foreground border-l border-border/50">{fix}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="technical-stack" className="mb-8 sm:mb-12">
        <h2 className="text-sm font-medium text-foreground mb-3 sm:mb-4">
          Stack We Ran With
        </h2>
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground mb-4">
            We kept the stack pragmatic: move fast, keep quality measurable, do not over-engineer at 3AM.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['Vector DB', 'Actian Vector Database (Beta)'],
              ['Backend', 'Python + FastAPI'],
              ['Agent Framework', 'LangChain (primary) or LlamaIndex'],
              ['LLM Layer', 'OpenAI GPT'],
              ['Control Plane', 'SQLite now'],
              ['Observability', 'RAGAS style metrics + custom scoring + alerts'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-border bg-secondary/30 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">{label}</p>
                <p className="text-xs sm:text-sm text-foreground">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mb-8 sm:mb-12">
        <h2 className="text-sm font-medium text-foreground mb-3 sm:mb-4">
          Source Repository
        </h2>
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
            Official GitHub repo:{' '}
            <a
              href="https://github.com/mdkaifansari04/documind"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-4 hover:opacity-90"
            >
              https://github.com/mdkaifansari04/documind
            </a>
          </p>
        </div>
      </section>

      <section className="pt-6 sm:pt-8 border-t border-border">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 sm:mb-4">
          Next Steps
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/docs/getting-started"
            className="group flex items-center gap-3 p-3.5 sm:p-4 rounded-xl bg-card border border-border transition-all duration-200 hover:border-primary/40 hover:bg-secondary"
          >
            <div className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <span className="text-primary text-sm font-semibold">1</span>
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                Getting Started
              </span>
              <p className="text-xs text-muted-foreground">Run it locally without drama</p>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary" strokeWidth={1.5} />
          </Link>

          <Link
            href="/docs/architecture"
            className="group flex items-center gap-3 p-3.5 sm:p-4 rounded-xl bg-card border border-border transition-all duration-200 hover:border-primary/40 hover:bg-secondary"
          >
            <div className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <span className="text-primary text-sm font-semibold">2</span>
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                Architecture
              </span>
              <p className="text-xs text-muted-foreground">See the full data flow</p>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary" strokeWidth={1.5} />
          </Link>
        </div>
      </section>
    </DocsLayout>
  );
}
