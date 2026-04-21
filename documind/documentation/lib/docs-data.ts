export interface NavItem {
  id: string;
  title: string;
  href: string;
  icon: string;
}

export interface TocItem {
  id: string;
  title: string;
  level: number;
}

export interface ComponentInfo {
  name: string;
  description: string;
  fileRef: string;
}

export interface CommandInfo {
  command: string;
  description: string;
  example?: string;
}

export interface ToolInfo {
  name: string;
  description: string;
  guardrail?: string;
}

export interface TestCard {
  id: string;
  title: string;
  objective: string;
  image?: string;
  command: string;
  notes: string;
  status: 'Passed' | 'Needs Review' | 'Failed';
}

export interface TestingStep {
  id: string;
  title: string;
  whatYouDid: string;
  whatHappened: string;
  imagePlaceholder: string;
  image?: string;
  imageAlt?: string;
}

export interface TestingSection {
  id: string;
  title: string;
  summary: string;
  steps: TestingStep[];
}

export interface ScopeItem {
  text: string;
}

// Navigation items for left sidebar - now with href for routing
export const navItems: NavItem[] = [
  { id: 'overview', title: 'Overview', href: '/docs', icon: 'book' },
  { id: 'getting-started', title: 'Getting Started', href: '/docs/getting-started', icon: 'rocket' },
  { id: 'architecture', title: 'Architecture', href: '/docs/architecture', icon: 'layers' },
  { id: 'components', title: 'Components', href: '/docs/components', icon: 'box' },
  { id: 'dcli', title: 'DCLI', href: '/docs/dcli', icon: 'terminal' },
  { id: 'mcp-server', title: 'MCP Server', href: '/docs/mcp-server', icon: 'server' },
  { id: 'testing', title: 'Testing & Validation', href: '/docs/testing', icon: 'check-circle' },
  { id: 'hackathon-scope', title: 'Hackathon Scope', href: '/docs/hackathon-scope', icon: 'target' },
];

// Table of contents per page
export const tocItemsMap: Record<string, TocItem[]> = {
  'overview': [
    { id: 'origin-story', title: 'Origin Story', level: 1 },
    { id: 'solution-overview', title: 'What We Built', level: 1 },
    { id: 'problem-fit', title: 'Why This Works', level: 1 },
    { id: 'technical-stack', title: 'Technical Stack', level: 1 },
  ],
  'getting-started': [
    { id: 'repo-setup', title: 'Clone & Repo Map', level: 1 },
    { id: 'prerequisites', title: 'Prerequisites', level: 1 },
    { id: 'backend-quickstart', title: 'Backend Quick Start', level: 1 },
    { id: 'frontend-quickstart', title: 'Frontend Quick Start', level: 1 },
    { id: 'dcli-quickstart', title: 'DCLI Quick Start', level: 1 },
    { id: 'run-order', title: 'Run Order & Checks', level: 1 },
    { id: 'next-steps', title: 'Next Steps', level: 1 },
  ],
  'architecture': [
    { id: 'pipeline', title: 'System Architecture', level: 1 },
    { id: 'data-flow', title: 'Data Flows', level: 1 },
    { id: 'diagram', title: 'Architecture Diagram', level: 1 },
  ],
  'components': [
    { id: 'api', title: 'API Surface', level: 1 },
    { id: 'runtime', title: 'Runtime Container', level: 1 },
    { id: 'retrieval', title: 'Retrieval + Agent', level: 1 },
    { id: 'observability', title: 'Observability', level: 1 },
    { id: 'dcli-component', title: 'DCLI', level: 1 },
    { id: 'mcp-component', title: 'MCP Server', level: 1 },
  ],
  'dcli': [
    { id: 'installation', title: 'Installation', level: 1 },
    { id: 'command-reference', title: 'Command Reference', level: 1 },
    { id: 'output-modes', title: 'Output Modes', level: 1 },
    { id: 'examples', title: 'Examples', level: 1 },
  ],
  'mcp-server': [
    { id: 'setup', title: 'Setup & Run', level: 1 },
    { id: 'available-tools', title: 'Available Tools', level: 1 },
    { id: 'guardrails', title: 'Guardrails', level: 1 },
    { id: 'integration', title: 'Integration', level: 1 },
  ],
  'testing': [
    { id: 'testing-setup', title: 'Testing Setup in Codex CLI', level: 1 },
    { id: 'crawl-ingestion', title: 'Crawl + Ingestion Execution', level: 1 },
    { id: 'vectordb-verification', title: 'VectorDB Storage Verification', level: 1 },
    { id: 'app-query-validation', title: 'App Query Validation', level: 1 },
    { id: 'fallback-behavior', title: 'MCP + DCLI Fallback Behavior', level: 1 },
    { id: 'final-outcome', title: 'Final Outcome', level: 1 },
  ],
  'hackathon-scope': [
    { id: 'included', title: 'Included Features', level: 1 },
    { id: 'deferred', title: 'Deferred Features', level: 1 },
  ],
};

// Components data
export const components: ComponentInfo[] = [
  {
    name: 'DocuMind API',
    description: 'FastAPI app that exposes instances, knowledge bases, resources, query, memory, and observability endpoints.',
    fileRef: 'backend/app/main.py',
  },
  {
    name: 'Runtime Container',
    description: 'Dependency wiring for vector DB client, control-plane store, routing, ingestion, retrieval, agent, and observability services.',
    fileRef: 'backend/app/runtime.py',
  },
  {
    name: 'Retrieval Layer',
    description: 'Semantic retrieval plus hybrid fusion (`rrf`/`dbsf`) with metadata filters for grounded lookup.',
    fileRef: 'backend/app/services/retrieval.py',
  },
  {
    name: 'Observability Layer',
    description: 'Per-query quality summary and alert endpoints so we can catch retrieval drift and hallucination spikes early.',
    fileRef: 'backend/app/services/observability.py',
  },
  {
    name: 'DCLI Interface',
    description: 'CLI-first interface for context-aware workflows (`instance_id + namespace_id`) with human and JSON bot output modes.',
    fileRef: 'backend/documind_cli.py',
  },
  {
    name: 'MCP Server',
    description: 'FastMCP tool surface that lets assistants search, ask, ingest, and manage context with safety guardrails.',
    fileRef: 'backend/mcp_server/server.py',
  },
];

// DCLI Commands
export const dcliCommands: CommandInfo[] = [
  { command: 'init', description: 'Initialize a new namespace context', example: 'dcli init --namespace-id company_docs' },
  { command: 'context-show', description: 'Display current active context', example: 'dcli context-show' },
  { command: 'context-set', description: 'Set active namespace/instance', example: 'dcli context-set --instance-id <id> --namespace-id company_docs' },
  { command: 'instances', description: 'List all available instances', example: 'dcli instances' },
  { command: 'instance-create', description: 'Create a new instance', example: 'dcli instance-create --name "My Instance" -d "local test"' },
  { command: 'namespaces', description: 'List namespaces', example: 'dcli namespaces --instance-id <id>' },
  { command: 'list-kbs', description: 'List knowledge bases', example: 'dcli list-kbs --instance-id <id>' },
  { command: 'search-docs', description: 'Search documents with query', example: 'dcli search-docs --qr "deploy command" --top-k 5' },
  { command: 'ask-docs', description: 'Ask a question against documents', example: 'dcli ask-docs -qs "How do I deploy?" --top-k 5' },
  { command: 'ingest-text', description: 'Ingest text content into namespace', example: 'dcli ingest-text --content "hello docs" --source-ref inline' },
];

// MCP Tools
export const mcpTools: ToolInfo[] = [
  { name: 'search_docs', description: 'Fast factual lookup from indexed docs; uses active context when ids are omitted.' },
  { name: 'ask_docs', description: 'Synthesize grounded answers with sources using retrieved chunks.' },
  { name: 'ingest_text', description: 'Ingest plain text or markdown into the selected namespace.' },
  { name: 'list_knowledge_bases', description: 'List available knowledge bases, optionally scoped to one instance.' },
  { name: 'list_instances', description: 'List available instances for context selection.' },
  { name: 'create_instance', description: 'Create a new instance for setup.', guardrail: 'Requires confirm_create=true' },
  { name: 'list_namespaces', description: 'List namespaces in an instance or current context.' },
  { name: 'get_active_context', description: 'Return current default context (instance_id + namespace_id).' },
  { name: 'set_active_context', description: 'Persist active context for later calls.', guardrail: 'Unknown namespace requires allow flag' },
];

export const testingSections: TestingSection[] = [
  {
    id: 'testing-setup',
    title: 'Testing Setup in Codex CLI',
    summary:
      'We started from Codex CLI and kicked off a full crawl + ingest flow using a Sevelet documentation link as the source.',
    steps: [
      {
        id: 'setup-1',
        title: 'Session start and crawl request',
        whatYouDid:
          'Started a Codex CLI session, shared the Sevelet documentation link, and asked the agent to crawl docs and track everything in VectorDB.',
        whatHappened:
          'The run started exactly as expected and moved into setup prompts before ingestion.',
        imagePlaceholder: 'Screenshot 01: initial prompt and crawl request',
        image: '/screenshot/ss-1.png',
        imageAlt: 'Screenshot 01: initial prompt and crawl request',
      },
      {
        id: 'setup-2',
        title: 'Instance and namespace prompt',
        whatYouDid:
          'Provided the requested instance name and namespace name to initialize the context.',
        whatHappened:
          'The system requested context first, then continued execution with a concrete target namespace.',
        imagePlaceholder: 'Screenshot 02: instance/namespace setup prompt',
        image: '/screenshot/ss-2.png',
        imageAlt: 'Screenshot 02: instance and namespace setup prompt',
      },
    ],
  },
  {
    id: 'crawl-ingestion',
    title: 'Crawl + Ingestion Execution',
    summary:
      'The crawler fetched docs, generated markdown pages locally, and pushed them through DCLI ingestion flow.',
    steps: [
      {
        id: 'crawl-1',
        title: 'Execution trace and crawler ingestion loop',
        whatYouDid:
          'Observed the live execution trace while the crawler fetched docs and DCLI handled ingestion.',
        whatHappened:
          'The crawler + ingest loop ran continuously over discovered pages.',
        imagePlaceholder: 'Screenshot 03: execution trace with fetch + ingest',
        image: '/screenshot/ss-3.png',
        imageAlt: 'Screenshot 03: execution trace with fetch and ingest',
      },
      {
        id: 'crawl-2',
        title: 'Generated pages directory',
        whatYouDid:
          'Reviewed all generated pages stored by the Python crawler script.',
        whatHappened:
          'A complete set of crawled pages appeared in the local pages directory.',
        imagePlaceholder: 'Screenshot 04: list of crawled pages in directory',
        image: '/screenshot/ss-4.png',
        imageAlt: 'Screenshot 04: list of crawled pages in directory',
      },
      {
        id: 'crawl-3',
        title: 'Script artifact created by agent',
        whatYouDid:
          'Inspected the crawler/ingestion script created during the run.',
        whatHappened:
          'The script was generated and used to automate repeated fetch-and-ingest behavior.',
        imagePlaceholder: 'Screenshot 05: generated script artifact',
        image: '/screenshot/ss-5.png',
        imageAlt: 'Screenshot 05: generated script artifact',
      },
      {
        id: 'crawl-4',
        title: 'DCLI skill-based ingestion from markdown files',
        whatYouDid:
          'Added DCLI as a skill and continued ingestion from stored markdown files.',
        whatHappened:
          'The agent repeatedly called DocuMind tools and pushed content into VectorDB.',
        imagePlaceholder: 'Screenshot 06: DCLI skill ingest cycle',
        image: '/screenshot/ss-6.png',
        imageAlt: 'Screenshot 06: DCLI skill ingestion cycle',
      },
    ],
  },
  {
    id: 'vectordb-verification',
    title: 'VectorDB Storage Verification',
    summary:
      'We validated ingestion outcome with logs to confirm data was actually stored, not just reported as done.',
    steps: [
      {
        id: 'vectordb-1',
        title: 'Storage confirmation in logs',
        whatYouDid:
          'Checked ingestion logs after tool calls completed.',
        whatHappened:
          'Logs showed successful text storage in VectorDB.',
        imagePlaceholder: 'Screenshot 07: vector storage success logs',
        image: '/screenshot/ss-7.png',
        imageAlt: 'Screenshot 07: vector storage success logs',
      },
      {
        id: 'vectordb-2',
        title: 'Task completion confirmation',
        whatYouDid:
          'Verified final task completion output and post-run logs.',
        whatHappened:
          'Run completed and confirmed end-to-end storage through DCLI.',
        imagePlaceholder: 'Screenshot 08-09: final completion and storage logs',
        image: '/screenshot/ss-8.png',
        imageAlt: 'Screenshot 08: final completion and storage logs',
      },
    ],
  },
  {
    id: 'app-query-validation',
    title: 'App Query Validation',
    summary:
      'After ingestion, we tested whether the application could actually retrieve grounded answers using DCLI + vector embeddings.',
    steps: [
      {
        id: 'app-1',
        title: 'Post-ingestion app validation',
        whatYouDid:
          'Ran the app after indexing all docs and tested real questions.',
        whatHappened:
          'The system moved from ingestion mode into retrieval + answer generation mode.',
        imagePlaceholder: 'Screenshot 10: app validation run',
        image: '/screenshot/ss-9.png',
        imageAlt: 'Screenshot 09: post-ingestion app validation run',
      },
      {
        id: 'app-2',
        title: 'MCP server connection flow',
        whatYouDid:
          'Tracked how the agent explored tools and attempted MCP connection for efficient querying.',
        whatHappened:
          'The connection flow resolved correctly and tool usage continued.',
        imagePlaceholder: 'Screenshot 11: MCP connection flow',
        image: '/screenshot/ss-10.png',
        imageAlt: 'Screenshot 10: MCP server connection flow',
      },
      {
        id: 'app-3',
        title: 'Successful MCP tool response',
        whatYouDid:
          'Validated tool call responses from MCP endpoints.',
        whatHappened:
          'MCP calls returned successful responses used by the agent.',
        imagePlaceholder: 'Screenshot 12: MCP tool success response',
        image: '/screenshot/ss-11.png',
        imageAlt: 'Screenshot 11: MCP tool success response',
      },
      {
        id: 'app-4',
        title: 'Auto-create missing resource/context',
        whatYouDid:
          'Observed behavior when required context was missing.',
        whatHappened:
          'The flow created the missing piece and resumed task execution.',
        imagePlaceholder: 'Screenshot 13: missing resource auto-created',
        image: '/screenshot/ss-12.png',
        imageAlt: 'Screenshot 12: missing resource auto-created',
      },
    ],
  },
  {
    id: 'fallback-behavior',
    title: 'MCP + DCLI Fallback Behavior',
    summary:
      'We verified dual-path reliability: agent falls back to MCP when CLI has issues, and prefers DCLI when available.',
    steps: [
      {
        id: 'fallback-1',
        title: 'CLI issue fallback to MCP',
        whatYouDid:
          'Observed an execution moment where CLI path had issues.',
        whatHappened:
          'The agent switched to MCP fallback path and kept the workflow moving.',
        imagePlaceholder: 'Screenshot 14: CLI to MCP fallback behavior',
        image: '/screenshot/ss-13.png',
        imageAlt: 'Screenshot 13: CLI to MCP fallback behavior',
      },
      {
        id: 'fallback-2',
        title: 'Happy-path DCLI execution',
        whatYouDid:
          'Ran the same style task where DCLI path was available.',
        whatHappened:
          'The agent found tools, listed instances, set active context, and ingested resources cleanly.',
        imagePlaceholder: 'Screenshot 15: DCLI happy path with context set',
        image: '/screenshot/ss-14.png',
        imageAlt: 'Screenshot 14: DCLI happy path with context set',
      },
    ],
  },
  {
    id: 'final-outcome',
    title: 'Final Outcome',
    summary:
      'The test run proved the workflow can crawl docs, transform them into markdown resources, ingest them into VectorDB, and answer queries using grounded tool-based retrieval.',
    steps: [
      {
        id: 'outcome-1',
        title: 'What this validates overall',
        whatYouDid:
          'Reviewed the complete run from initial prompt to final query behavior.',
        whatHappened:
          'End-to-end pipeline worked with practical resilience: ingestion, storage verification, retrieval, and fallback execution paths.',
        imagePlaceholder: 'Screenshot 16: final proof-of-flow summary image',
        image: '/screenshot/ss-15.png',
        imageAlt: 'Screenshot 15: final proof-of-flow summary',
      },
    ],
  },
];

// Test cards data
export const testCards: TestCard[] = [
  {
    id: 'test-1',
    title: 'Ingestion Pipeline Smoke Test',
    objective: 'Confirm text/markdown input gets parsed, chunked, embedded, and indexed without manual babysitting.',
    image: '/tests/ingestion-test.png',
    command: 'dcli ingest-text --content-file README.md --source-ref readme --bot=true',
    notes: 'Indexed successfully with chunk metadata and clean status response.',
    status: 'Passed',
  },
  {
    id: 'test-2',
    title: 'Semantic + Hybrid Retrieval Check',
    objective: 'Validate that top-k results stay relevant and not just keyword lucky guesses.',
    image: '/tests/search-test.png',
    command: 'dcli search-docs --qr "authentication flow" --top-k 5',
    notes: 'Top results were relevant and contained actionable context for follow-up Q&A.',
    status: 'Passed',
  },
  {
    id: 'test-3',
    title: 'Grounded Answer Validation',
    objective: 'Check if answer quality holds up and citations actually match the generated claims.',
    command: 'dcli ask-docs -qs "How do I configure OAuth?" --top-k 5',
    notes: 'Answer included sources. One edge response still needs deeper manual review.',
    status: 'Needs Review',
  },
  {
    id: 'test-4',
    title: 'MCP Tool Invocation Test',
    objective: 'Verify external assistants can call DocuMind tools reliably with active context.',
    image: '/tests/mcp-test.png',
    command: './run_mcp_server.sh',
    notes: 'Tool surface booted and responded correctly for search/ask/context calls.',
    status: 'Passed',
  },
  {
    id: 'test-5',
    title: 'Namespace Isolation Edge Case',
    objective: 'Verify results stay isolated across namespaces and context switches.',
    command: 'dcli search-docs --qr "private data" --namespace-id other_ns',
    notes: 'Found an edge behavior during manual switching flow; flagged for follow-up hardening.',
    status: 'Failed',
  },
];

// Hackathon scope items
export const includedScope: ScopeItem[] = [
  { text: 'Resource ingestion pipeline (markdown, text, PDF, URL, transcript, conversation JSON)' },
  { text: 'Chunking + embedding + vector storage in Actian Vector DB' },
  { text: '`search_docs` tool integration for agent workflows' },
  { text: '`/ingest` and `/query` API endpoints' },
  { text: 'Memory index (`conversation_memory`) for session-aware retrieval' },
  { text: 'Demo UI + API + DCLI + MCP integration surface' },
  { text: 'Observability score/alert endpoints for retrieval quality and hallucination tracking' },
  { text: 'Configurable alert thresholds and notification hooks' },
];

export const deferredScope: ScopeItem[] = [
  { text: 'Full OCR for scanned/image-only PDFs' },
  { text: 'Authentication and full multi-tenancy' },
  { text: 'Real-time streaming responses' },
  { text: 'Native Confluence and Notion connectors' },
  { text: 'Grafana/Prometheus production dashboards' },
  { text: 'Cloud deployment hardening and remote control-plane migration' },
];

// Pipeline steps for architecture
export const pipelineSteps = [
  { step: 'Ingest', description: 'Accept docs via dashboard or API', color: 'violet' },
  { step: 'Parse', description: 'Normalize raw source into clean text', color: 'accent' },
  { step: 'Chunk', description: 'Split into overlap-aware segments', color: 'peach' },
  { step: 'Embed', description: 'Generate vectors using selected profile', color: 'mint' },
  { step: 'Store', description: 'Save vectors in Actian + metadata in SQLite', color: 'violet' },
  { step: 'Retrieve', description: 'Semantic or hybrid search with filters', color: 'accent' },
  { step: 'Ground', description: 'Answer with sources, then score quality', color: 'peach' },
];
