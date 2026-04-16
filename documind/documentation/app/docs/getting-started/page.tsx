import { DocsLayout } from '@/components/docs/docs-layout';
import { StepCommandBlock } from '@/components/docs/command-block';
import { Info } from 'lucide-react';
import Link from 'next/link';

export default function GettingStartedPage() {
  return (
    <DocsLayout
      pageId="getting-started"
      title="Getting Started"
      description="Spin up DocuMind locally, index a document, and run your first real query in a few commands."
      breadcrumbs={[{ label: 'Docs', href: '/docs' }, { label: 'Getting Started' }]}
    >
      <section id="prerequisites" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">Before You Hit Enter</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Keep this practical: you do not need a giant DevOps ceremony, but you do need a few basics.
        </p>
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
            <span>Python 3.10+</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
            <span>Local Actian Vector setup from this repo</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
            <span>A terminal and mild tolerance for setup logs</span>
          </li>
        </ul>
      </section>

      <section id="backend-quickstart" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-6">Backend Quick Start</h2>

        <div className="space-y-8">
          <StepCommandBlock
            step={1}
            title="Jump into the backend"
            command="cd documind/backend"
            description="This is where FastAPI, ingestion, retrieval, and service wiring live."
          />

          <StepCommandBlock
            step={2}
            title="Create and activate virtual environment"
            command="python -m venv .venv && source .venv/bin/activate"
            description="Clean env, fewer mysterious package arguments later."
          />

          <StepCommandBlock
            step={3}
            title="Install dependencies"
            command="pip install -r requirements.txt"
            description="Includes FastAPI, parsing libs, and dependencies needed for ingestion/retrieval flow."
          />

          <StepCommandBlock
            step={4}
            title="Run API server"
            command="uvicorn app.main:app --reload --port 8000"
            description="DocuMind API starts on http://localhost:8000."
          />
        </div>

        <div className="mt-6 p-4 rounded-lg bg-poof-peach/5 border border-poof-peach/20">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-poof-peach flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-poof-peach mb-1">Reality Check</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                If `/health` is up but retrieval is empty, your API is alive but your namespace likely has no data yet. Classic first-run confusion, we all do it.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="dcli-quickstart" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-6">DCLI Quick Start</h2>

        <div className="space-y-8">
          <StepCommandBlock
            step={1}
            title="Install DCLI globally (recommended)"
            command="pipx install /Users/mdkaifansari04/code/projects/vector-ai/documind/backend"
            description="This gives you `dcli` and `DCLI` command aliases."
          />

          <StepCommandBlock
            step={2}
            title="Point CLI to your API"
            command='export DOCUMIND_API_URL="http://localhost:8000"'
            description="So DCLI knows where to send requests."
          />

          <StepCommandBlock
            step={3}
            title="Initialize context"
            command="dcli init --namespace-id company_docs"
            description="Sets active context so you do not type instance and namespace every single time."
          />

          <StepCommandBlock
            step={4}
            title="Check context + run first query"
            command='dcli context-show && dcli search-docs --qr "deploy command" --top-k 5'
            description="If this works, your retrieval path is alive."
          />
        </div>
      </section>

      <section id="next-steps" className="mt-12 pt-8 border-t border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">What To Open Next</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          You are running now. Next move is understanding architecture and tool interfaces so debugging does not become interpretive art.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/docs/architecture"
            className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors group"
          >
            <div>
              <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                Architecture
              </span>
              <p className="text-xs text-muted-foreground">How data actually moves through the system</p>
            </div>
          </Link>

          <Link
            href="/docs/dcli"
            className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors group"
          >
            <div>
              <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                DCLI Reference
              </span>
              <p className="text-xs text-muted-foreground">Every command and what it does</p>
            </div>
          </Link>
        </div>
      </section>
    </DocsLayout>
  );
}
