const navItems = [
  { id: "overview", label: "Overview" },
  { id: "quickstart", label: "Quick Start" },
  { id: "architecture", label: "Architecture" },
  { id: "components", label: "Components" },
  { id: "dcli", label: "DCLI" },
  { id: "mcp", label: "MCP Server" },
  { id: "scope", label: "Scope" },
];

const pipelineSteps = [
  "Ingest resource (text, markdown, PDF, URL, conversation JSON).",
  "Parse and chunk into retrieval-safe text segments.",
  "Generate embeddings with the selected profile.",
  "Store vectors in Actian and metadata in SQLite control plane.",
  "Retrieve top-k chunks using semantic or hybrid mode.",
  "Generate grounded answers with sources.",
];

const componentCards = [
  {
    title: "DocuMind API (FastAPI)",
    body: "Class-based app that wires routers for instances, KBs, resources, query, memory, and observability.",
    ref: "documind/backend/app/main.py",
  },
  {
    title: "Runtime Container",
    body: "Dependency container for vector client, store, routing, ingestion, retrieval, agent, and observability services.",
    ref: "documind/backend/app/runtime.py",
  },
  {
    title: "Retrieval Layer",
    body: "Supports semantic retrieval and hybrid fusion with filters for instance and namespace scoped search.",
    ref: "documind/backend/app/services/retrieval.py",
  },
  {
    title: "Observability Layer",
    body: "Query log summarization and score/alert endpoints for retrieval and grounded answer quality trends.",
    ref: "documind/backend/app/services/observability.py",
  },
  {
    title: "DCLI Interface",
    body: "Developer and agent CLI for init, context management, search, ask, ingest, and namespace workflows.",
    ref: "documind/backend/documind_cli.py",
  },
  {
    title: "DocuMind MCP Server",
    body: "FastMCP tool surface exposing search_docs, ask_docs, ingest_text, context, and setup actions.",
    ref: "documind/backend/mcp_server/server.py",
  },
];

const dcliCommands = [
  ["init", "Bootstrap active context", "dcli init --namespace-id company_docs"],
  ["context-show", "Show saved context", "dcli context-show --bot=true"],
  ["context-set", "Set active context", "dcli context-set --instance-id <id> --namespace-id company_docs"],
  ["search-docs", "Fast retrieval", 'dcli search-docs --qr "deploy command" --top-k 5'],
  ["ask-docs", "Grounded answer + sources", 'dcli ask-docs -qs "What is the deploy command?" --top-k 5'],
  ["ingest-text", "Index inline or file content", 'dcli ingest-text --content "Release command is bun run deploy" --source-ref notes'],
];

const mcpTools = [
  ["search_docs", "Factual lookup in indexed docs. Uses active context if ids are omitted."],
  ["ask_docs", "Synthesized grounded response with sources from retrieved chunks."],
  ["ingest_text", "Directly ingest markdown/text into target namespace."],
  ["get_active_context", "Read default context (instance_id + namespace_id) used by tools."],
  ["set_active_context", "Set default context. Unknown namespace requires explicit confirmation flag."],
  ["create_instance", "Creates a new instance and requires explicit `confirm_create=true`."],
];

export default function Home() {
  return (
    <div className="grid-overlay text-white">
      <header className="sticky top-0 z-50 border-b border-white/6 bg-[#0d0d0d]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 md:px-8">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-widest text-poof-mist/50">
              DocuMind
            </p>
            <p className="text-sm text-white">Hackathon Documentation</p>
          </div>
          <nav className="hidden items-center gap-1 rounded-md border border-white/6 bg-white/2 p-0.5 md:flex">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="rounded-[5px] px-2.5 py-1 text-[11px] font-medium text-poof-mist/50 transition-colors hover:bg-white/8 hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 pb-14 pt-10 md:px-8">
        <section id="overview" className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
          <div className="rounded-xl border border-white/6 bg-[#111] p-6">
            <p className="mb-3 inline-flex rounded-md border border-dashed border-poof-violet/30 px-2 py-0.5 text-[10px] uppercase tracking-wider text-poof-violet">
              Retrieval-Augmented Docs Intelligence
            </p>
            <h1 className="max-w-2xl text-3xl font-semibold leading-tight md:text-4xl">
              Internal documentation search and reasoning layer powered by
              vectors, retrieval, and grounded answering.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-poof-mist/70">
              DocuMind ingests private documentation, indexes it as vectors,
              and returns precise, source-backed responses through API, CLI, and
              MCP interfaces.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-md border border-white/10 px-2 py-1 text-[11px] text-poof-mist/65">
                FastAPI backend
              </span>
              <span className="rounded-md border border-white/10 px-2 py-1 text-[11px] text-poof-mist/65">
                Actian VectorAI DB
              </span>
              <span className="rounded-md border border-white/10 px-2 py-1 text-[11px] text-poof-mist/65">
                DCLI + MCP Server
              </span>
              <span className="rounded-md border border-white/10 px-2 py-1 text-[11px] text-poof-mist/65">
                Hackathon phase scope
              </span>
            </div>
          </div>

          <aside className="rounded-xl border border-white/6 bg-[#111] p-6">
            <p className="text-[10px] font-medium uppercase tracking-widest text-poof-mist/50">
              Project Snapshot
            </p>
            <dl className="mt-4 space-y-4">
              <div className="rounded-lg border border-white/8 bg-[#141414] px-4 py-3">
                <dt className="text-[11px] uppercase tracking-wide text-poof-mist/50">
                  Primary Output
                </dt>
                <dd className="mt-1 text-sm text-white">
                  Search and answer private docs with citations.
                </dd>
              </div>
              <div className="rounded-lg border border-white/8 bg-[#141414] px-4 py-3">
                <dt className="text-[11px] uppercase tracking-wide text-poof-mist/50">
                  External Identity Model
                </dt>
                <dd className="mt-1 text-sm text-white">
                  instance_id + namespace_id
                </dd>
              </div>
              <div className="rounded-lg border border-white/8 bg-[#141414] px-4 py-3">
                <dt className="text-[11px] uppercase tracking-wide text-poof-mist/50">
                  Demo Surfaces
                </dt>
                <dd className="mt-1 text-sm text-white">
                  Web dashboard, REST API, DCLI, MCP tools
                </dd>
              </div>
            </dl>
          </aside>
        </section>

        <section id="quickstart" className="mt-10">
          <h2 className="text-xl font-semibold text-white">Quick Start</h2>
          <p className="mt-2 text-sm text-poof-mist/65">
            Local-first setup for hackathon demos.
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <article className="rounded-xl border border-white/6 bg-[#111] p-5">
              <p className="text-[10px] uppercase tracking-widest text-poof-mint/70">
                Backend API
              </p>
              <pre className="mt-3 overflow-x-auto rounded-lg border border-white/8 bg-black/40 p-3 font-mono text-[11px] leading-6 text-poof-mist/80">
{`cd documind/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000`}
              </pre>
            </article>

            <article className="rounded-xl border border-white/6 bg-[#111] p-5">
              <p className="text-[10px] uppercase tracking-widest text-poof-violet">
                DCLI Bootstrap
              </p>
              <pre className="mt-3 overflow-x-auto rounded-lg border border-white/8 bg-black/40 p-3 font-mono text-[11px] leading-6 text-poof-mist/80">
{`export DOCUMIND_API_URL="http://localhost:8000"
dcli init --namespace-id company_docs
dcli context-show
dcli search-docs --qr "deploy command" --top-k 5`}
              </pre>
            </article>
          </div>
        </section>

        <section id="architecture" className="mt-10">
          <h2 className="text-xl font-semibold text-white">Architecture</h2>
          <p className="mt-2 text-sm text-poof-mist/65">
            End-to-end ingestion and retrieval flow.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {pipelineSteps.map((step, index) => (
              <div
                key={step}
                className="rounded-lg border border-white/6 bg-[#111111] px-4 py-3"
              >
                <p className="text-[10px] uppercase tracking-wider text-poof-mist/50">
                  Step {index + 1}
                </p>
                <p className="mt-1 text-sm text-white/90">{step}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-dashed border-white/20 bg-[#111] p-8 text-center">
            <p className="text-sm font-medium text-white">
              Architecture Diagram Placeholder
            </p>
            <p className="mx-auto mt-2 max-w-xl text-xs leading-6 text-poof-mist/65">
              Add your final architecture image here for submission.
              Recommended path:{" "}
              <code className="font-mono text-poof-mint/70">
                /public/architecture-diagram.png
              </code>
              .
            </p>
          </div>
        </section>

        <section id="components" className="mt-10">
          <h2 className="text-xl font-semibold text-white">Core Components</h2>
          <p className="mt-2 text-sm text-poof-mist/65">
            System modules mapped to code ownership.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {componentCards.map((card) => (
              <article
                key={card.title}
                className="rounded-xl border border-white/6 bg-[#111] p-5 transition-colors hover:bg-[#141414]"
              >
                <h3 className="text-sm font-semibold text-white">{card.title}</h3>
                <p className="mt-2 text-xs leading-6 text-poof-mist/70">
                  {card.body}
                </p>
                <p className="mt-4 rounded-md border border-dashed border-white/10 px-2 py-1 font-mono text-[10px] text-poof-mist/60">
                  {card.ref}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section id="dcli" className="mt-10">
          <h2 className="text-xl font-semibold text-white">DCLI</h2>
          <p className="mt-2 text-sm text-poof-mist/65">
            Developer and agent CLI surface for DocuMind workflows.
          </p>
          <div className="mt-4 overflow-hidden rounded-lg border border-white/6 bg-black">
            <div className="grid grid-cols-[0.9fr_1.2fr_1.7fr] gap-2 px-5 py-2.5 text-[11px] font-medium uppercase tracking-wide text-poof-mist/50">
              <p>Command</p>
              <p>Purpose</p>
              <p>Example</p>
            </div>
            <div className="flex flex-col px-1 pb-1.5">
              {dcliCommands.map(([command, purpose, example], index) => (
                <div
                  key={command}
                  className={`grid grid-cols-[0.9fr_1.2fr_1.7fr] gap-2 bg-[#141414] px-4 py-3 text-xs transition-colors hover:bg-white/4 ${
                    index === 0 ? "rounded-t-lg" : ""
                  } ${index === dcliCommands.length - 1 ? "rounded-b-lg" : ""}`}
                >
                  <p className="font-mono text-poof-violet">{command}</p>
                  <p className="text-poof-mist/75">{purpose}</p>
                  <p className="font-mono text-poof-mint/70">{example}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="mcp" className="mt-10">
          <h2 className="text-xl font-semibold text-white">DocuMind MCP Server</h2>
          <p className="mt-2 text-sm text-poof-mist/65">
            Tool layer for external AI clients with context-aware retrieval and
            setup guardrails.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {mcpTools.map(([name, desc]) => (
              <div
                key={name}
                className="rounded-lg border border-white/6 bg-[#111] px-4 py-3"
              >
                <p className="font-mono text-sm text-poof-violet">{name}</p>
                <p className="mt-1 text-xs leading-6 text-poof-mist/70">
                  {desc}
                </p>
              </div>
            ))}
          </div>
          <pre className="mt-4 overflow-x-auto rounded-lg border border-white/8 bg-black/40 p-3 font-mono text-[11px] leading-6 text-poof-mist/80">
{`cd documind/backend
./run_mcp_server.sh

# optional in another shell
./run_documind_cli.sh context-show --bot=true`}
          </pre>
        </section>

        <section id="scope" className="mt-10 rounded-xl border border-white/6 bg-[#111] p-6">
          <h2 className="text-xl font-semibold text-white">Hackathon Scope</h2>
          <p className="mt-2 text-sm text-poof-mist/65">
            Build what demonstrates retrieval value clearly, keep production
            complexity explicit and deferred.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-white/8 bg-[#141414] p-4">
              <p className="text-[11px] uppercase tracking-wide text-poof-mint/70">
                Included
              </p>
              <ul className="mt-3 space-y-2 text-xs text-poof-mist/75">
                <li>Resource ingestion for core document formats.</li>
                <li>Semantic and hybrid retrieval.</li>
                <li>Memory namespace and observability endpoints.</li>
                <li>Web + API + DCLI + MCP demo surfaces.</li>
              </ul>
            </div>
            <div className="rounded-lg border border-white/8 bg-[#141414] p-4">
              <p className="text-[11px] uppercase tracking-wide text-poof-peach/75">
                Deferred
              </p>
              <ul className="mt-3 space-y-2 text-xs text-poof-mist/75">
                <li>Full production deployment hardening.</li>
                <li>Authentication and complete multi-tenancy.</li>
                <li>OCR for scanned image-only PDFs.</li>
                <li>Native Confluence/Notion connectors.</li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
