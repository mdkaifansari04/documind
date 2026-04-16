import { DocsLayout } from '@/components/docs/docs-layout';
import { CommandBlock, StepCommandBlock } from '@/components/docs/command-block';
import { dcliCommands } from '@/lib/docs-data';
import { Info } from 'lucide-react';

export default function DCLIPage() {
  return (
    <DocsLayout
      pageId="dcli"
      title="DCLI"
      description="DocuMind from your terminal: fast setup, context-aware commands, and JSON mode when you need automation."
      breadcrumbs={[{ label: 'Docs', href: '/docs' }, { label: 'DCLI' }]}
    >
      <section id="installation" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">Install It Once, Use It Everywhere</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          DCLI is the command surface for DocuMind. If you like doing real work from the terminal instead of clicking seven panels, this is your page — respectfully.
        </p>

        <div className="space-y-6">
          <StepCommandBlock
            step={1}
            title="Global install with pipx (recommended)"
            command="pipx install ./documind/backend"
            description="Installs `dcli` globally while keeping dependencies isolated."
          />

          <StepCommandBlock
            step={2}
            title="Point DCLI at local API"
            command='export DOCUMIND_API_URL="http://localhost:8000"'
            description="DCLI needs the backend URL, otherwise it will shout connection errors at you."
          />

          <StepCommandBlock
            step={3}
            title="Initialize context"
            command="dcli init --namespace-id company_docs"
            description="Creates or selects an instance and stores active context for later commands."
          />
        </div>
      </section>

      <section id="command-reference" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-6">Command Reference</h2>

        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold text-foreground">Command</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">Description</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground hidden lg:table-cell">Example</th>
              </tr>
            </thead>
            <tbody>
              {dcliCommands.map((cmd) => (
                <tr key={cmd.command} className="border-b border-border/50 last:border-b-0 hover:bg-secondary/30 transition-colors">
                  <td className="py-3 px-4">
                    <code className="font-mono text-code-text bg-code-bg px-2 py-0.5 rounded text-xs">
                      {cmd.command}
                    </code>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{cmd.description}</td>
                  <td className="py-3 px-4 hidden lg:table-cell">
                    {cmd.example && <code className="font-mono text-xs text-muted-foreground">{cmd.example}</code>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="output-modes" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">Output Modes</h2>

        <div className="p-4 rounded-lg bg-poof-peach/5 border border-poof-peach/20 mb-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-poof-peach flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-poof-peach mb-1">Human mode vs Bot mode</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Default output is human-friendly. Add <code className="font-mono text-code-text bg-code-bg px-1 rounded text-xs">--bot=true</code> to get JSON envelopes (`status`, `data`, `meta`, `text`) for automation and agent usage.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 rounded-xl bg-card border border-border">
            <h4 className="font-medium text-foreground mb-3">Human mode</h4>
            <CommandBlock command='dcli search-docs --qr "deploy command" --top-k 5' />
          </div>

          <div className="p-4 rounded-xl bg-card border border-border">
            <h4 className="font-medium text-foreground mb-3">Bot mode</h4>
            <CommandBlock command='dcli search-docs --qr "deploy command" --top-k 5 --bot=true' />
          </div>
        </div>
      </section>

      <section id="examples" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-6">Real Examples</h2>

        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-card border border-border">
            <h4 className="font-medium text-foreground mb-3">Context sanity check</h4>
            <CommandBlock command="dcli context-show" />
            <p className="text-sm text-muted-foreground mt-3">
              First thing to run when results look weird. Half of retrieval bugs are just wrong context.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-card border border-border">
            <h4 className="font-medium text-foreground mb-3">Ingest content from file</h4>
            <CommandBlock command="dcli ingest-text --content-file README.md --source-ref readme" />
            <p className="text-sm text-muted-foreground mt-3">
              Ingest one doc, then immediately query it to validate end-to-end behavior.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-card border border-border">
            <h4 className="font-medium text-foreground mb-3">Grounded answer with sources</h4>
            <CommandBlock command='dcli ask-docs -qs "How do I deploy?" --top-k 5' />
            <p className="text-sm text-muted-foreground mt-3">
              If an answer has no useful sources, treat it like suspicious autocomplete and investigate.
            </p>
          </div>
        </div>
      </section>
    </DocsLayout>
  );
}
