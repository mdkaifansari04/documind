import { DocsLayout } from '@/components/docs/docs-layout';
import { StepCommandBlock } from '@/components/docs/command-block';
import { Info } from 'lucide-react';
import Link from 'next/link';

export default function GettingStartedPage() {
  return (
    <DocsLayout
      pageId="getting-started"
      title="Getting Started"
      description="Get DocuMind running locally in minutes with these quick start guides."
      breadcrumbs={[
        { label: 'Docs', href: '/docs' },
        { label: 'Getting Started' }
      ]}
    >
      {/* Prerequisites */}
      <section id="prerequisites" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">Prerequisites</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Before getting started, ensure you have the following installed:
        </p>
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-poof-accent mt-2 flex-shrink-0" />
            <span>Python 3.10 or higher</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-poof-accent mt-2 flex-shrink-0" />
            <span>Docker (optional, for containerized deployment)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-poof-accent mt-2 flex-shrink-0" />
            <span>Access to Actian Vector Database credentials</span>
          </li>
        </ul>
      </section>

      {/* Backend Quick Start */}
      <section id="backend-quickstart" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-6">Backend Quick Start</h2>
        
        <div className="space-y-8">
          <StepCommandBlock
            step={1}
            title="Clone and navigate to the backend"
            command="cd documind/backend"
            description="Navigate to the backend directory of the DocuMind repository."
          />

          <StepCommandBlock
            step={2}
            title="Create a virtual environment"
            command="python -m venv .venv && source .venv/bin/activate"
            description="Create an isolated Python environment for DocuMind dependencies."
          />

          <StepCommandBlock
            step={3}
            title="Install dependencies"
            command="pip install -r requirements.txt"
            description="Install all required Python packages including FastAPI, embedding models, and database connectors."
          />

          <StepCommandBlock
            step={4}
            title="Start the development server"
            command="uvicorn app.main:app --reload --port 8000"
            description="Launch the FastAPI server with hot reload enabled. The API will be available at http://localhost:8000."
          />
        </div>

        {/* Note Box */}
        <div className="mt-6 p-4 rounded-lg bg-poof-peach/5 border border-poof-peach/20">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-poof-peach flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-poof-peach mb-1">Environment Variables</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Make sure to copy <code className="px-1.5 py-0.5 rounded bg-code-bg text-code-text font-mono text-xs">.env.example</code> to{' '}
                <code className="px-1.5 py-0.5 rounded bg-code-bg text-code-text font-mono text-xs">.env</code> and configure your 
                Actian database credentials before starting the server.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* DCLI Quick Start */}
      <section id="dcli-quickstart" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-6">DCLI Quick Start</h2>
        
        <div className="space-y-8">
          <StepCommandBlock
            step={1}
            title="Set the API URL"
            command='export DOCUMIND_API_URL="http://localhost:8000"'
            description="Point the CLI to your running DocuMind backend server."
          />

          <StepCommandBlock
            step={2}
            title="Initialize a namespace"
            command="dcli init --namespace-id company_docs"
            description="Create a new namespace to organize your documents. Namespaces isolate different document collections."
          />

          <StepCommandBlock
            step={3}
            title="Verify your context"
            command="dcli context-show"
            description="Confirm the CLI is connected and using the correct namespace."
          />

          <StepCommandBlock
            step={4}
            title="Search your documents"
            command='dcli search-docs --qr "deploy command" --top-k 5'
            description="Run your first semantic search query to find relevant documentation chunks."
          />
        </div>
      </section>

      {/* Next Steps */}
      <section id="next-steps" className="mt-12 pt-8 border-t border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">Next Steps</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          Now that DocuMind is running, explore these resources to learn more:
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link 
            href="/docs/architecture"
            className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border hover:border-poof-accent/50 transition-colors group"
          >
            <div>
              <span className="font-medium text-foreground group-hover:text-poof-accent transition-colors">
                Architecture Overview
              </span>
              <p className="text-xs text-muted-foreground">Understand the system design</p>
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
              <p className="text-xs text-muted-foreground">Full command documentation</p>
            </div>
          </Link>
        </div>
      </section>
    </DocsLayout>
  );
}
