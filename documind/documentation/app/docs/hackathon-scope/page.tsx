import { DocsLayout } from '@/components/docs/docs-layout';
import { includedScope, deferredScope } from '@/lib/docs-data';
import { CheckCircle, Circle } from 'lucide-react';
import Link from 'next/link';

export default function HackathonScopePage() {
  return (
    <DocsLayout
      pageId="hackathon-scope"
      title="Hackathon Scope"
      description="What's included in this build vs. what's deferred for future development."
      breadcrumbs={[
        { label: 'Docs', href: '/docs' },
        { label: 'Hackathon Scope' }
      ]}
    >
      {/* Overview */}
      <section className="mb-12">
        <p className="text-muted-foreground leading-relaxed">
          DocuMind was built for the Actian hackathon with a focus on demonstrating core functionality. 
          This page outlines what features are included in the current build and what has been 
          intentionally deferred for future development.
        </p>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Included Features */}
        <section id="included" className="p-6 rounded-xl bg-poof-mint/5 border border-poof-mint/20">
          <div className="flex items-center gap-2 mb-6">
            <CheckCircle className="w-5 h-5 text-poof-mint" />
            <h2 className="text-lg font-semibold text-poof-mint">Included in Build</h2>
          </div>
          
          <ul className="space-y-3">
            {includedScope.map((item, index) => (
              <li 
                key={index}
                className="flex items-start gap-3"
              >
                <CheckCircle className="w-4 h-4 text-poof-mint flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">{item.text}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Deferred Features */}
        <section id="deferred" className="p-6 rounded-xl bg-muted/30 border border-border">
          <div className="flex items-center gap-2 mb-6">
            <Circle className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-muted-foreground">Deferred for Later</h2>
          </div>
          
          <ul className="space-y-3">
            {deferredScope.map((item, index) => (
              <li 
                key={index}
                className="flex items-start gap-3"
              >
                <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <span className="text-sm text-muted-foreground">{item.text}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Technical Decisions */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">Technical Decisions</h2>
        
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-card border border-border">
            <h3 className="font-medium text-foreground mb-2">Vector Database: Actian</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We chose Actian for vector storage due to its robust support for HNSW indexing and 
              efficient approximate nearest neighbor search. This provides the foundation for fast 
              semantic retrieval at scale.
            </p>
          </div>
          
          <div className="p-4 rounded-xl bg-card border border-border">
            <h3 className="font-medium text-foreground mb-2">Hybrid Retrieval with RRF</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Combining vector similarity search with BM25 keyword matching using Reciprocal Rank 
              Fusion (RRF) provides better retrieval quality than either method alone, especially 
              for technical documentation.
            </p>
          </div>
          
          <div className="p-4 rounded-xl bg-card border border-border">
            <h3 className="font-medium text-foreground mb-2">MCP Integration</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Adding Model Context Protocol support allows AI assistants to directly query DocuMind, 
              making it easier for teams to access their documentation through natural conversation.
            </p>
          </div>
        </div>
      </section>

      {/* Future Roadmap */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">Future Roadmap</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Post-hackathon development will focus on production hardening and enterprise features:
        </p>
        
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="p-4 rounded-lg bg-secondary/30 border border-border">
            <div className="text-sm font-medium text-foreground mb-1">Phase 1</div>
            <p className="text-xs text-muted-foreground">Authentication, access control, and audit logging</p>
          </div>
          <div className="p-4 rounded-lg bg-secondary/30 border border-border">
            <div className="text-sm font-medium text-foreground mb-1">Phase 2</div>
            <p className="text-xs text-muted-foreground">Native connectors for Slack, Notion, and Confluence</p>
          </div>
          <div className="p-4 rounded-lg bg-secondary/30 border border-border">
            <div className="text-sm font-medium text-foreground mb-1">Phase 3</div>
            <p className="text-xs text-muted-foreground">OCR support and custom embedding model training</p>
          </div>
          <div className="p-4 rounded-lg bg-secondary/30 border border-border">
            <div className="text-sm font-medium text-foreground mb-1">Phase 4</div>
            <p className="text-xs text-muted-foreground">Horizontal scaling and multi-region deployment</p>
          </div>
        </div>
      </section>

      {/* Next Steps */}
      <section className="mt-12 pt-8 border-t border-border">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Start Exploring
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link 
            href="/docs/getting-started"
            className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border hover:border-poof-accent/50 transition-colors group"
          >
            <div>
              <span className="font-medium text-foreground group-hover:text-poof-accent transition-colors">
                Getting Started
              </span>
              <p className="text-xs text-muted-foreground">Set up DocuMind locally</p>
            </div>
          </Link>
          
          <Link 
            href="/docs"
            className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border hover:border-poof-accent/50 transition-colors group"
          >
            <div>
              <span className="font-medium text-foreground group-hover:text-poof-accent transition-colors">
                Overview
              </span>
              <p className="text-xs text-muted-foreground">Back to documentation home</p>
            </div>
          </Link>
        </div>
      </section>
    </DocsLayout>
  );
}
