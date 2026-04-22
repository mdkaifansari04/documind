import { DocsLayout } from '@/components/docs/docs-layout';
import { CommandBlock, StepCommandBlock } from '@/components/docs/command-block';
import { mcpTools } from '@/lib/docs-data';
import { AlertTriangle, Info, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function MCPServerPage() {
  return (
    <DocsLayout
      pageId="mcp-server"
      title="MCP Server"
      description="DocuMind as tools for AI clients: search, ask, ingest, and context management with guardrails baked in."
      breadcrumbs={[{ label: 'Docs', href: '/docs' }, { label: 'MCP Server' }]}
    >
      <section id="mcp-demo" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          MCP Server Testing Demo
        </h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          Watch the MCP server in action with AI client integration and see how tools interact with DocuMind.
        </p>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="relative aspect-video w-full">
            <iframe
              src="https://www.youtube.com/embed/7vh292qzmPY"
              title="MCP Server Testing Demo"
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      <section id="setup" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">Setup & Run</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          MCP is how external assistants talk to DocuMind without custom glue code. Give the assistant tools, not guesses — it behaves way better.
        </p>

        <div className="mb-6 p-4 rounded-lg bg-poof-mint/5 border border-poof-mint/20">
          <p className="text-sm text-muted-foreground leading-relaxed">
            If you want copy-paste prompts and the full DCLI <code className="font-mono text-code-text bg-code-bg px-1 rounded text-xs">SKILL.md</code>{' '}
            template for agents, use{' '}
            <Link href="/docs/agent-integration" className="text-primary underline underline-offset-4">
              Agent Integration
            </Link>
            .
          </p>
        </div>

        <div className="space-y-6">
          <StepCommandBlock
            step={1}
            title="Run backend API"
            command="cd documind/backend && uvicorn app.main:app --reload --port 8000"
            description="MCP service calls the API under the hood, so backend must be up."
          />

          <StepCommandBlock
            step={2}
            title="Start MCP server"
            command="cd documind/backend && ./run_mcp_server.sh"
            description="This launches `mcp_server.server` with `DOCUMIND_API_URL` defaulting to localhost."
          />

          <StepCommandBlock
            step={3}
            title="Verify via CLI"
            command="cd documind/backend && ./run_documind_cli.sh context-show --bot=true"
            description="Quick sanity check that context and API connectivity are healthy."
          />
        </div>
      </section>

      <section id="available-tools" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-6">Available Tools</h2>

        <div className="space-y-3">
          {mcpTools.map((tool) => (
            <div
              key={tool.name}
              className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-mono text-xs font-semibold">fn</span>
                </div>
                <div>
                  <code className="font-mono text-sm text-foreground">{tool.name}</code>
                  <p className="text-xs text-muted-foreground mt-0.5">{tool.description}</p>
                </div>
              </div>
              {tool.guardrail && (
                <span className="flex-shrink-0 flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-poof-peach/10 text-poof-peach border border-poof-peach/20">
                  <ShieldCheck className="w-3 h-3" />
                  {tool.guardrail}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      <section id="guardrails" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">Guardrails</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          We intentionally added friction for risky operations. Yes, one extra confirmation is slower. Also yes, it prevents weird accidental state changes at 1:47AM.
        </p>

        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-destructive mb-1">create_instance confirmation</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  `create_instance` requires explicit `confirm_create=true`. The server refuses silent instance creation.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-poof-peach/5 border border-poof-peach/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-poof-peach flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-poof-peach mb-1">Unknown namespace protection</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  `set_active_context` checks known namespaces first. Unknown values require the explicit `allow_unknown_namespace=true` flag.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="integration" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">Integration Notes</h2>

        <div className="p-4 rounded-lg bg-poof-mint/5 border border-poof-mint/20 mb-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-poof-mint flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-poof-mint mb-1">Tool usage strategy</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                In prompt instructions, prefer `search_docs` for factual lookups and `ask_docs` for synthesis. That one small rule improves response quality more than people expect.
              </p>
            </div>
          </div>
        </div>

        <CommandBlock
          title="Server runtime helper"
          command="cd documind/backend && ./run_mcp_server.sh"
        />
      </section>
    </DocsLayout>
  );
}
