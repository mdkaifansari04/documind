import { DocsLayout } from '@/components/docs/docs-layout';
import { pipelineSteps } from '@/lib/docs-data';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

const colorClasses: Record<string, string> = {
  violet: 'bg-poof-violet/10 border-poof-violet/30 text-poof-violet',
  accent: 'bg-poof-accent/10 border-poof-accent/30 text-poof-accent',
  peach: 'bg-poof-peach/10 border-poof-peach/30 text-poof-peach',
  mint: 'bg-poof-mint/10 border-poof-mint/30 text-poof-mint',
};

export default function ArchitecturePage() {
  return (
    <DocsLayout
      pageId="architecture"
      title="Architecture"
      description="DocuMind follows a modular pipeline architecture for document processing and retrieval."
      breadcrumbs={[
        { label: 'Docs', href: '/docs' },
        { label: 'Architecture' }
      ]}
    >
      {/* Pipeline Overview */}
      <section id="pipeline" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">Pipeline Overview</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          The DocuMind pipeline processes documents through several stages, from ingestion to answer generation. 
          Each stage is designed to be modular and can be customized based on your requirements.
        </p>
        
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {pipelineSteps.map((step, index) => (
            <div key={step.step} className="flex items-center gap-3">
              <div className={`px-4 py-3 rounded-lg border ${colorClasses[step.color]}`}>
                <div className="text-sm font-semibold">{step.step}</div>
                <div className="text-xs opacity-70 mt-0.5">{step.description}</div>
              </div>
              {index < pipelineSteps.length - 1 && (
                <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0 hidden sm:block" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Data Flow */}
      <section id="data-flow" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">Data Flow</h2>
        
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-card border border-border">
            <h3 className="font-semibold text-foreground mb-3">1. Document Ingestion</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Documents enter the system through the REST API or DCLI. The ingestion layer supports 
              multiple formats and automatically handles parsing based on file type.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 text-xs rounded bg-secondary text-muted-foreground">Markdown</span>
              <span className="px-2 py-1 text-xs rounded bg-secondary text-muted-foreground">Plain Text</span>
              <span className="px-2 py-1 text-xs rounded bg-secondary text-muted-foreground">JSON</span>
            </div>
          </div>
          
          <div className="p-5 rounded-xl bg-card border border-border">
            <h3 className="font-semibold text-foreground mb-3">2. Chunking Strategy</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Documents are split into semantic chunks using a recursive text splitter. This ensures 
              that each chunk maintains contextual coherence while staying within token limits.
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Chunk Size:</span>
                <span className="ml-2 text-foreground font-mono">512 tokens</span>
              </div>
              <div>
                <span className="text-muted-foreground">Overlap:</span>
                <span className="ml-2 text-foreground font-mono">64 tokens</span>
              </div>
            </div>
          </div>
          
          <div className="p-5 rounded-xl bg-card border border-border">
            <h3 className="font-semibold text-foreground mb-3">3. Embedding Generation</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Each chunk is converted to a dense vector representation using a transformer-based 
              embedding model. These vectors capture semantic meaning for similarity search.
            </p>
            <div className="text-sm">
              <span className="text-muted-foreground">Embedding Dimensions:</span>
              <span className="ml-2 text-foreground font-mono">1536</span>
            </div>
          </div>
          
          <div className="p-5 rounded-xl bg-card border border-border">
            <h3 className="font-semibold text-foreground mb-3">4. Vector Storage</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Vectors and metadata are stored in Actian&apos;s vector database. The database supports 
              efficient approximate nearest neighbor (ANN) search for fast retrieval.
            </p>
            <div className="text-sm">
              <span className="text-muted-foreground">Index Type:</span>
              <span className="ml-2 text-foreground font-mono">HNSW</span>
            </div>
          </div>
          
          <div className="p-5 rounded-xl bg-card border border-border">
            <h3 className="font-semibold text-foreground mb-3">5. Hybrid Retrieval</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Search queries use both semantic similarity and keyword matching. Results are combined 
              using reciprocal rank fusion (RRF) for optimal relevance.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 text-xs rounded bg-poof-accent/10 text-poof-accent">Vector Search</span>
              <span className="px-2 py-1 text-xs rounded bg-poof-violet/10 text-poof-violet">BM25</span>
              <span className="px-2 py-1 text-xs rounded bg-poof-mint/10 text-poof-mint">RRF Fusion</span>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Diagram */}
      <section id="diagram" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">Architecture Diagram</h2>
        <div className="border-2 border-dashed border-border rounded-xl p-12 flex flex-col items-center justify-center bg-card/50">
          <div className="text-muted-foreground text-center">
            <div className="text-4xl mb-4 opacity-50">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </div>
            <p className="text-sm font-medium mb-2">Architecture Diagram Placeholder</p>
            <code className="text-xs font-mono text-muted-foreground bg-code-bg px-2 py-1 rounded">
              /public/architecture-diagram.png
            </code>
          </div>
        </div>
      </section>

      {/* Next Steps */}
      <section className="mt-12 pt-8 border-t border-border">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Learn More
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link 
            href="/docs/components"
            className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border hover:border-poof-accent/50 transition-colors group"
          >
            <div>
              <span className="font-medium text-foreground group-hover:text-poof-accent transition-colors">
                Components
              </span>
              <p className="text-xs text-muted-foreground">Explore each system component</p>
            </div>
          </Link>
          
          <Link 
            href="/docs/dcli"
            className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border hover:border-poof-accent/50 transition-colors group"
          >
            <div>
              <span className="font-medium text-foreground group-hover:text-poof-accent transition-colors">
                DCLI Reference
              </span>
              <p className="text-xs text-muted-foreground">Command-line interface docs</p>
            </div>
          </Link>
        </div>
      </section>
    </DocsLayout>
  );
}
