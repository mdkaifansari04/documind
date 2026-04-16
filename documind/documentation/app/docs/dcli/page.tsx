import { DocsLayout } from '@/components/docs/docs-layout';
import { CommandBlock, StepCommandBlock } from '@/components/docs/command-block';
import { dcliCommands } from '@/lib/docs-data';
import { Info } from 'lucide-react';
import Link from 'next/link';

export default function DCLIPage() {
  return (
    <DocsLayout
      pageId="dcli"
      title="DCLI"
      description="The DocuMind Command Line Interface provides a powerful way to interact with the system from your terminal."
      breadcrumbs={[
        { label: 'Docs', href: '/docs' },
        { label: 'DCLI' }
      ]}
    >
      {/* Installation */}
      <section id="installation" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">Installation</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          The DCLI is included with the DocuMind package. After installing DocuMind, the CLI is available globally.
        </p>
        
        <div className="space-y-6">
          <StepCommandBlock
            step={1}
            title="Install the CLI package"
            command="pip install documind-cli"
            description="Install the DCLI from PyPI."
          />

          <StepCommandBlock
            step={2}
            title="Configure the API endpoint"
            command='export DOCUMIND_API_URL="http://localhost:8000"'
            description="Set the environment variable to point to your DocuMind server."
          />

          <StepCommandBlock
            step={3}
            title="Verify installation"
            command="dcli --version"
            description="Check that the CLI is installed correctly."
          />
        </div>
      </section>

      {/* Command Reference */}
      <section id="command-reference" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-6">Command Reference</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold text-foreground">Command</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">Description</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground hidden md:table-cell">Example</th>
              </tr>
            </thead>
            <tbody>
              {dcliCommands.map((cmd) => (
                <tr key={cmd.command} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="py-3 px-4">
                    <code className="font-mono text-code-text bg-code-bg px-2 py-0.5 rounded text-xs">
                      {cmd.command}
                    </code>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{cmd.description}</td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    {cmd.example && (
                      <code className="font-mono text-xs text-muted-foreground">{cmd.example}</code>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Output Modes */}
      <section id="output-modes" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">Output Modes</h2>
        
        <div className="p-4 rounded-lg bg-poof-peach/5 border border-poof-peach/20 mb-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-poof-peach flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-poof-peach mb-1">Human Mode vs Bot Mode</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                By default, DCLI outputs human-readable formatted text. For programmatic use, 
                add <code className="font-mono text-code-text bg-code-bg px-1 rounded text-xs">--bot=true</code> to 
                receive structured JSON responses suitable for parsing and automation.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 rounded-xl bg-card border border-border">
            <h4 className="font-medium text-foreground mb-3">Human Mode (Default)</h4>
            <CommandBlock command="dcli search-docs --qr 'deploy'" />
            <p className="text-xs text-muted-foreground mt-3">
              Returns formatted, colored output for terminal display.
            </p>
          </div>
          
          <div className="p-4 rounded-xl bg-card border border-border">
            <h4 className="font-medium text-foreground mb-3">Bot Mode</h4>
            <CommandBlock command="dcli search-docs --qr 'deploy' --bot=true" />
            <p className="text-xs text-muted-foreground mt-3">
              Returns JSON output for programmatic consumption.
            </p>
          </div>
        </div>
      </section>

      {/* Examples */}
      <section id="examples" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-6">Examples</h2>
        
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-card border border-border">
            <h4 className="font-medium text-foreground mb-3">Initialize a New Namespace</h4>
            <CommandBlock command="dcli init --namespace-id engineering_docs" />
            <p className="text-sm text-muted-foreground mt-3">
              Creates a new namespace for organizing related documents.
            </p>
          </div>
          
          <div className="p-5 rounded-xl bg-card border border-border">
            <h4 className="font-medium text-foreground mb-3">Ingest a Document</h4>
            <CommandBlock command="dcli ingest-text --file ./docs/api-reference.md --title 'API Reference'" />
            <p className="text-sm text-muted-foreground mt-3">
              Uploads and processes a Markdown file into the current namespace.
            </p>
          </div>
          
          <div className="p-5 rounded-xl bg-card border border-border">
            <h4 className="font-medium text-foreground mb-3">Search with Filters</h4>
            <CommandBlock command='dcli search-docs --qr "authentication" --top-k 10 --min-score 0.7' />
            <p className="text-sm text-muted-foreground mt-3">
              Searches for authentication-related content with a minimum relevance score.
            </p>
          </div>
          
          <div className="p-5 rounded-xl bg-card border border-border">
            <h4 className="font-medium text-foreground mb-3">Ask a Question</h4>
            <CommandBlock command='dcli ask-docs --qr "How do I configure OAuth2?"' />
            <p className="text-sm text-muted-foreground mt-3">
              Gets an AI-generated answer with source citations from your documentation.
            </p>
          </div>
        </div>
      </section>

      {/* Next Steps */}
      <section className="mt-12 pt-8 border-t border-border">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Related Documentation
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
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
          
          <Link 
            href="/docs/testing"
            className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border hover:border-poof-accent/50 transition-colors group"
          >
            <div>
              <span className="font-medium text-foreground group-hover:text-poof-accent transition-colors">
                Testing & Validation
              </span>
              <p className="text-xs text-muted-foreground">See test results</p>
            </div>
          </Link>
        </div>
      </section>
    </DocsLayout>
  );
}
