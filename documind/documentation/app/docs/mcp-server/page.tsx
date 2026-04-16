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
      description="The Model Context Protocol server enables AI assistants to interact with DocuMind capabilities."
      breadcrumbs={[
        { label: 'Docs', href: '/docs' },
        { label: 'MCP Server' }
      ]}
    >
      {/* Setup */}
      <section id="setup" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">Setup</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          The MCP server allows AI assistants like Claude to directly query and interact with your DocuMind 
          knowledge base. Follow these steps to configure the integration.
        </p>
        
        <div className="space-y-6">
          <StepCommandBlock
            step={1}
            title="Start the MCP server"
            command="python -m mcp.server --port 8001"
            description="Launch the MCP server on a separate port from the main API."
          />

          <StepCommandBlock
            step={2}
            title="Configure your AI assistant"
            command='{"mcpServers": {"documind": {"command": "npx", "args": ["-y", "@documind/mcp-client"]}}}'
            description="Add this configuration to your AI assistant's MCP settings (e.g., Claude Desktop config)."
          />

          <StepCommandBlock
            step={3}
            title="Verify the connection"
            command="mcp-client test-connection"
            description="Test that the AI assistant can communicate with DocuMind."
          />
        </div>
      </section>

      {/* Available Tools */}
      <section id="available-tools" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-6">Available Tools</h2>
        
        <div className="space-y-3">
          {mcpTools.map((tool, index) => (
            <div 
              key={tool.name}
              className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:border-poof-accent/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-poof-accent/10 flex items-center justify-center">
                  <span className="text-poof-accent font-mono text-xs font-semibold">fn</span>
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

      {/* Guardrails */}
      <section id="guardrails" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">Guardrails</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          Certain MCP tools have safety guardrails to prevent accidental or unauthorized actions. 
          These require explicit user confirmation or special flags.
        </p>
        
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-destructive mb-1">create_instance</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Creating new DocuMind instances requires explicit user confirmation. The AI assistant 
                  must ask for approval before executing this action to prevent accidental resource creation.
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-4 rounded-xl bg-poof-peach/5 border border-poof-peach/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-poof-peach flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-poof-peach mb-1">set_active_context (Unknown Namespace)</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Switching to an unknown namespace requires the{' '}
                  <code className="font-mono text-code-text bg-code-bg px-1 rounded text-xs">--allow-unknown</code>{' '}
                  flag to prevent accidental context switches to non-existent namespaces.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integration Examples */}
      <section id="integration" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">Integration</h2>
        
        <div className="p-4 rounded-lg bg-poof-mint/5 border border-poof-mint/20 mb-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-poof-mint flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-poof-mint mb-1">AI Assistant Interaction</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Once configured, your AI assistant can directly access DocuMind. Simply ask questions 
                about your documentation, and the assistant will use the appropriate MCP tools.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-card border border-border">
            <h4 className="font-medium text-foreground mb-3">Example: Search Documents</h4>
            <div className="text-sm text-muted-foreground mb-3">
              Ask your AI assistant:
            </div>
            <div className="p-3 rounded-lg bg-secondary/50 text-sm text-foreground italic">
              &quot;Search my documentation for information about API authentication&quot;
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              The assistant will invoke <code className="font-mono bg-code-bg px-1 rounded">search_docs</code> and return relevant chunks.
            </p>
          </div>
          
          <div className="p-5 rounded-xl bg-card border border-border">
            <h4 className="font-medium text-foreground mb-3">Example: Ask Questions</h4>
            <div className="text-sm text-muted-foreground mb-3">
              Ask your AI assistant:
            </div>
            <div className="p-3 rounded-lg bg-secondary/50 text-sm text-foreground italic">
              &quot;Based on my docs, how do I configure SSO for the application?&quot;
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              The assistant will invoke <code className="font-mono bg-code-bg px-1 rounded">ask_docs</code> and provide a grounded answer with sources.
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
            href="/docs/testing"
            className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border hover:border-poof-accent/50 transition-colors group"
          >
            <div>
              <span className="font-medium text-foreground group-hover:text-poof-accent transition-colors">
                Testing & Validation
              </span>
              <p className="text-xs text-muted-foreground">See MCP integration tests</p>
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
              <p className="text-xs text-muted-foreground">CLI command documentation</p>
            </div>
          </Link>
        </div>
      </section>
    </DocsLayout>
  );
}
