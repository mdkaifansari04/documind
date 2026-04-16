import { DocsLayout } from '@/components/docs/docs-layout';
import { components } from '@/lib/docs-data';
import { FileCode, Layers, Database, Activity, Terminal, Server } from 'lucide-react';
import Link from 'next/link';

const componentIcons: Record<string, React.ReactNode> = {
  'DocuMind API': <FileCode className="w-5 h-5" />,
  'Runtime Container': <Layers className="w-5 h-5" />,
  'Retrieval Layer': <Database className="w-5 h-5" />,
  'Observability Layer': <Activity className="w-5 h-5" />,
  'DCLI Interface': <Terminal className="w-5 h-5" />,
  'MCP Server': <Server className="w-5 h-5" />,
};

const componentIds: Record<string, string> = {
  'DocuMind API': 'api',
  'Runtime Container': 'runtime',
  'Retrieval Layer': 'retrieval',
  'Observability Layer': 'observability',
  'DCLI Interface': 'dcli-component',
  'MCP Server': 'mcp-component',
};

export default function ComponentsPage() {
  return (
    <DocsLayout
      pageId="components"
      title="Components"
      description="DocuMind is composed of several modular components that work together to provide intelligent document retrieval."
      breadcrumbs={[
        { label: 'Docs', href: '/docs' },
        { label: 'Components' }
      ]}
    >
      <div className="space-y-8">
        {components.map((component, index) => (
          <section 
            key={component.name} 
            id={componentIds[component.name]}
            className="p-6 rounded-xl bg-card border border-border"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-poof-accent/10 flex items-center justify-center text-poof-accent">
                {componentIcons[component.name]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h2 className="text-lg font-semibold text-foreground">{component.name}</h2>
                  <code className="text-xs font-mono text-muted-foreground bg-code-bg px-2 py-1 rounded">
                    {component.fileRef}
                  </code>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  {component.description}
                </p>
                
                {/* Additional details per component */}
                {component.name === 'DocuMind API' && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-foreground">Key Endpoints:</h4>
                    <div className="grid gap-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="px-2 py-0.5 rounded bg-poof-mint/10 text-poof-mint font-mono text-xs">POST</span>
                        <code className="text-muted-foreground font-mono">/ingest</code>
                        <span className="text-muted-foreground">- Upload documents</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="px-2 py-0.5 rounded bg-poof-accent/10 text-poof-accent font-mono text-xs">POST</span>
                        <code className="text-muted-foreground font-mono">/search</code>
                        <span className="text-muted-foreground">- Search documents</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="px-2 py-0.5 rounded bg-poof-violet/10 text-poof-violet font-mono text-xs">POST</span>
                        <code className="text-muted-foreground font-mono">/ask</code>
                        <span className="text-muted-foreground">- Q&A with sources</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {component.name === 'Runtime Container' && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-foreground">Includes:</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 text-xs rounded bg-secondary text-muted-foreground">Python 3.11</span>
                      <span className="px-2 py-1 text-xs rounded bg-secondary text-muted-foreground">FastAPI</span>
                      <span className="px-2 py-1 text-xs rounded bg-secondary text-muted-foreground">Uvicorn</span>
                      <span className="px-2 py-1 text-xs rounded bg-secondary text-muted-foreground">Embedding Models</span>
                    </div>
                  </div>
                )}
                
                {component.name === 'Retrieval Layer' && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-foreground">Search Methods:</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 text-xs rounded bg-poof-accent/10 text-poof-accent">Vector Similarity</span>
                      <span className="px-2 py-1 text-xs rounded bg-poof-violet/10 text-poof-violet">BM25 Keyword</span>
                      <span className="px-2 py-1 text-xs rounded bg-poof-mint/10 text-poof-mint">Hybrid RRF</span>
                    </div>
                  </div>
                )}
                
                {component.name === 'Observability Layer' && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-foreground">Features:</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 text-xs rounded bg-secondary text-muted-foreground">Structured Logging</span>
                      <span className="px-2 py-1 text-xs rounded bg-secondary text-muted-foreground">Request Tracing</span>
                      <span className="px-2 py-1 text-xs rounded bg-secondary text-muted-foreground">Metrics Export</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* Next Steps */}
      <section className="mt-12 pt-8 border-t border-border">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Related Documentation
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link 
            href="/docs/dcli"
            className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border hover:border-poof-accent/50 transition-colors group"
          >
            <div>
              <span className="font-medium text-foreground group-hover:text-poof-accent transition-colors">
                DCLI Reference
              </span>
              <p className="text-xs text-muted-foreground">Full command documentation</p>
            </div>
          </Link>
          
          <Link 
            href="/docs/mcp-server"
            className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border hover:border-poof-accent/50 transition-colors group"
          >
            <div>
              <span className="font-medium text-foreground group-hover:text-poof-accent transition-colors">
                MCP Server
              </span>
              <p className="text-xs text-muted-foreground">AI assistant integration</p>
            </div>
          </Link>
        </div>
      </section>
    </DocsLayout>
  );
}
