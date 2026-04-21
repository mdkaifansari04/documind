import { DocsLayout } from '@/components/docs/docs-layout';
import { CommandBlock, StepCommandBlock } from '@/components/docs/command-block';
import { Info } from 'lucide-react';
import Link from 'next/link';

export default function GettingStartedPage() {
  return (
    <DocsLayout
      pageId="getting-started"
      title="Getting Started"
      description="Clone the repo, run backend + frontend dashboard, and bootstrap DCLI with reproducible paths."
      breadcrumbs={[{ label: 'Docs', href: '/docs' }, { label: 'Getting Started' }]}
    >
      <section id="repo-setup" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">Clone Repo & Project Map</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Start from the official source so every path in this page makes sense.
        </p>
        <StepCommandBlock
          step={1}
          title="Clone DocuMind"
          command="git clone https://github.com/mdkaifansari04/documind.git"
          description="Official repository for backend API, frontend dashboard, CLI, MCP server, and documentation."
        />
        <div className="mt-6">
          <StepCommandBlock
            step={2}
            title="Enter repository root"
            command="cd documind"
            description="All next commands on this page assume you are in this repo root."
          />
        </div>
        <div className="mt-6 rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-medium text-foreground mb-2">Repo layout you will use</p>
          <pre className="rounded-lg border border-border bg-code-bg p-3 text-xs text-code-text overflow-x-auto">
{`documind/
  backend/        # FastAPI, ingestion, retrieval, observability, DCLI, MCP
  frontend/       # Next.js dashboard to manage instances/KB/resources/query
  documentation/  # This docs site`}
          </pre>
        </div>
      </section>

      <section id="prerequisites" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">Prerequisites</h2>
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
            <span>Python 3.10+</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
            <span>Bun (for frontend dashboard)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
            <span>pipx (recommended for global DCLI install)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
            <span>Local Actian Vector setup used by backend</span>
          </li>
        </ul>
      </section>

      <section id="backend-quickstart" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-6">Backend Quick Start (FastAPI)</h2>

        <div className="space-y-8">
          <StepCommandBlock
            step={3}
            title="Go to backend"
            command="cd backend"
            description="Backend service code and runtime wiring live here."
          />

          <StepCommandBlock
            step={4}
            title="Create and activate venv"
            command="python -m venv .venv && source .venv/bin/activate"
            description="Keeps backend dependencies isolated."
          />

          <StepCommandBlock
            step={5}
            title="Install pip packages"
            command="pip install -r requirements.txt"
            description="Installs API, ingestion, retrieval, and supporting dependencies."
          />

          <StepCommandBlock
            step={6}
            title="Run backend server"
            command="uvicorn app.main:app --reload --port 8000"
            description="Backend starts at http://localhost:8000."
          />
        </div>

        <div className="mt-6 p-4 rounded-lg bg-poof-peach/5 border border-poof-peach/20">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-poof-peach flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-poof-peach mb-1">Quick check</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Open <code className="font-mono text-code-text bg-code-bg px-1 rounded text-xs">http://localhost:8000/health</code>. If it returns OK, backend is up.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="frontend-quickstart" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-6">Frontend Quick Start (Dashboard)</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          The dashboard is your control center: create instances, manage knowledge bases, ingest resources, and run search/ask flows.
        </p>

        <div className="space-y-8">
          <StepCommandBlock
            step={7}
            title="Open frontend directory"
            command="cd ../frontend"
            description="Run this from backend directory. If you are at repo root, use `cd frontend`."
          />

          <StepCommandBlock
            step={8}
            title="Install dependencies with Bun"
            command="bun install"
            description="Installs Next.js dashboard dependencies."
          />

          <StepCommandBlock
            step={9}
            title="Set API URL for frontend"
            command={"echo 'NEXT_PUBLIC_API_URL=http://localhost:8000' > .env"}
            description="Frontend uses this to call the local backend."
          />

          <StepCommandBlock
            step={10}
            title="Run frontend"
            command="bun run dev"
            description="Dashboard starts at http://localhost:3000."
          />
        </div>
      </section>

      <section id="dcli-quickstart" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-6">DCLI Quick Start</h2>

        <div className="space-y-8">
          <StepCommandBlock
            step={11}
            title="Install DCLI from repo backend package"
            command="pipx install ./backend"
            description="Run this from repo root. Installs `dcli`, `documind`, and `DCLI` commands."
          />

          <StepCommandBlock
            step={12}
            title="Point DCLI to local backend"
            command='export DOCUMIND_API_URL="http://localhost:8000"'
            description="DCLI needs backend URL for all operations."
          />

          <StepCommandBlock
            step={13}
            title="Initialize namespace context"
            command="dcli init --namespace-id company_docs"
            description="Sets active context so instance/namespace are remembered."
          />

          <StepCommandBlock
            step={14}
            title="Run a retrieval check"
            command='dcli context-show && dcli search-docs --qr "deploy command" --top-k 5'
            description="If this returns results, CLI and retrieval path are good."
          />
        </div>
      </section>

      <section id="run-order" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">Run Order & Sanity Checks</h2>
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-medium text-foreground mb-2">Recommended order</p>
            <ol className="list-decimal pl-5 space-y-1 text-sm text-muted-foreground">
              <li>Start backend server first.</li>
              <li>Start frontend dashboard second.</li>
              <li>Run DCLI init/search checks third.</li>
            </ol>
          </div>

          <CommandBlock
            title="Health checks"
            command={`curl -s http://localhost:8000/health
open http://localhost:3000`}
          />
        </div>
      </section>

      <section id="next-steps" className="mt-12 pt-8 border-t border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">Next Steps</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          Once backend + dashboard + CLI are running, move to architecture and component docs for deeper system understanding.
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
              <p className="text-xs text-muted-foreground">How data moves end-to-end</p>
            </div>
          </Link>

          <Link
            href="/docs/components"
            className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors group"
          >
            <div>
              <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                Components
              </span>
              <p className="text-xs text-muted-foreground">Backend services + dashboard modules</p>
            </div>
          </Link>
        </div>
      </section>
    </DocsLayout>
  );
}
