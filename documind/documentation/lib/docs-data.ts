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
    { id: 'introduction', title: 'Introduction', level: 1 },
    { id: 'features', title: 'Key Features', level: 1 },
    { id: 'how-it-works', title: 'How It Works', level: 1 },
  ],
  'getting-started': [
    { id: 'prerequisites', title: 'Prerequisites', level: 1 },
    { id: 'backend-quickstart', title: 'Backend Quick Start', level: 1 },
    { id: 'dcli-quickstart', title: 'DCLI Quick Start', level: 1 },
    { id: 'next-steps', title: 'Next Steps', level: 1 },
  ],
  'architecture': [
    { id: 'pipeline', title: 'Pipeline Overview', level: 1 },
    { id: 'data-flow', title: 'Data Flow', level: 1 },
    { id: 'diagram', title: 'Architecture Diagram', level: 1 },
  ],
  'components': [
    { id: 'api', title: 'DocuMind API', level: 1 },
    { id: 'runtime', title: 'Runtime Container', level: 1 },
    { id: 'retrieval', title: 'Retrieval Layer', level: 1 },
    { id: 'observability', title: 'Observability', level: 1 },
    { id: 'dcli-component', title: 'DCLI Interface', level: 1 },
    { id: 'mcp-component', title: 'MCP Server', level: 1 },
  ],
  'dcli': [
    { id: 'installation', title: 'Installation', level: 1 },
    { id: 'command-reference', title: 'Command Reference', level: 1 },
    { id: 'output-modes', title: 'Output Modes', level: 1 },
    { id: 'examples', title: 'Examples', level: 1 },
  ],
  'mcp-server': [
    { id: 'setup', title: 'Setup', level: 1 },
    { id: 'available-tools', title: 'Available Tools', level: 1 },
    { id: 'guardrails', title: 'Guardrails', level: 1 },
    { id: 'integration', title: 'Integration', level: 1 },
  ],
  'testing': [
    { id: 'test-overview', title: 'Test Overview', level: 1 },
    { id: 'test-results', title: 'Test Results', level: 1 },
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
    description: 'FastAPI-based REST API providing endpoints for document ingestion, search, and Q&A operations.',
    fileRef: 'app/main.py',
  },
  {
    name: 'Runtime Container',
    description: 'Docker container packaging the complete DocuMind stack with all dependencies pre-configured.',
    fileRef: 'Dockerfile',
  },
  {
    name: 'Retrieval Layer',
    description: 'Semantic and hybrid search layer combining vector similarity with keyword matching for optimal results.',
    fileRef: 'app/retrieval/',
  },
  {
    name: 'Observability Layer',
    description: 'Logging, metrics, and tracing infrastructure for monitoring system health and performance.',
    fileRef: 'app/observability/',
  },
  {
    name: 'DCLI Interface',
    description: 'Command-line interface for interacting with DocuMind from terminal environments.',
    fileRef: 'dcli/',
  },
  {
    name: 'MCP Server',
    description: 'Model Context Protocol server enabling AI assistants to interact with DocuMind capabilities.',
    fileRef: 'mcp/',
  },
];

// DCLI Commands
export const dcliCommands: CommandInfo[] = [
  { command: 'init', description: 'Initialize a new namespace context', example: 'dcli init --namespace-id company_docs' },
  { command: 'context-show', description: 'Display current active context', example: 'dcli context-show' },
  { command: 'context-set', description: 'Set active namespace/instance', example: 'dcli context-set --namespace-id my_ns' },
  { command: 'instances', description: 'List all available instances', example: 'dcli instances' },
  { command: 'namespaces', description: 'List all namespaces', example: 'dcli namespaces' },
  { command: 'list-kbs', description: 'List knowledge bases in namespace', example: 'dcli list-kbs' },
  { command: 'search-docs', description: 'Search documents with query', example: 'dcli search-docs --qr "deploy command" --top-k 5' },
  { command: 'ask-docs', description: 'Ask a question against documents', example: 'dcli ask-docs --qr "How do I deploy?"' },
  { command: 'ingest-text', description: 'Ingest text content into namespace', example: 'dcli ingest-text --file README.md' },
];

// MCP Tools
export const mcpTools: ToolInfo[] = [
  { name: 'search_docs', description: 'Search documents using semantic and hybrid retrieval' },
  { name: 'ask_docs', description: 'Ask questions and get grounded answers with sources' },
  { name: 'ingest_text', description: 'Ingest new text content into a knowledge base' },
  { name: 'list_knowledge_bases', description: 'List all available knowledge bases' },
  { name: 'list_instances', description: 'List all DocuMind instances' },
  { name: 'create_instance', description: 'Create a new DocuMind instance', guardrail: 'Requires confirmation' },
  { name: 'list_namespaces', description: 'List all namespaces in an instance' },
  { name: 'get_active_context', description: 'Get the current active context settings' },
  { name: 'set_active_context', description: 'Set the active namespace and instance', guardrail: 'Unknown namespace requires flag' },
];

// Test cards data
export const testCards: TestCard[] = [
  {
    id: 'test-1',
    title: 'Document Ingestion Test',
    objective: 'Verify that documents can be successfully ingested and chunked',
    image: '/tests/ingestion-test.png',
    command: 'dcli ingest-text --file sample.md --namespace-id test_ns',
    notes: 'Successfully ingested 1,234 chunks from sample document',
    status: 'Passed',
  },
  {
    id: 'test-2',
    title: 'Semantic Search Test',
    objective: 'Validate semantic search returns relevant results',
    image: '/tests/search-test.png',
    command: 'dcli search-docs --qr "authentication flow" --top-k 5',
    notes: 'Returned 5 relevant chunks with >0.8 similarity scores',
    status: 'Passed',
  },
  {
    id: 'test-3',
    title: 'Q&A Grounding Test',
    objective: 'Ensure answers are properly grounded with source citations',
    command: 'dcli ask-docs --qr "How do I configure OAuth?"',
    notes: 'Answer included 3 source citations. Manual review needed for accuracy.',
    status: 'Needs Review',
  },
  {
    id: 'test-4',
    title: 'MCP Tool Integration',
    objective: 'Test MCP server tool invocation from AI assistant',
    image: '/tests/mcp-test.png',
    command: 'mcp-client invoke search_docs --query "API endpoints"',
    notes: 'MCP tools responding correctly, latency within acceptable range',
    status: 'Passed',
  },
  {
    id: 'test-5',
    title: 'Namespace Isolation Test',
    objective: 'Verify documents are isolated between namespaces',
    command: 'dcli search-docs --qr "private data" --namespace-id other_ns',
    notes: 'Cross-namespace leakage detected in edge case. Investigation pending.',
    status: 'Failed',
  },
];

// Hackathon scope items
export const includedScope: ScopeItem[] = [
  { text: 'Document ingestion pipeline' },
  { text: 'Vector storage with Actian' },
  { text: 'Semantic & hybrid retrieval' },
  { text: 'Grounded Q&A with sources' },
  { text: 'Observability & logging' },
  { text: 'DCLI command-line interface' },
  { text: 'MCP server integration' },
  { text: 'Basic namespace support' },
];

export const deferredScope: ScopeItem[] = [
  { text: 'Full production hardening' },
  { text: 'Multi-tenant authentication' },
  { text: 'Fine-grained access control' },
  { text: 'OCR for scanned PDFs' },
  { text: 'Native connectors (Slack, Notion)' },
  { text: 'Real-time document sync' },
  { text: 'Custom embedding models' },
  { text: 'Horizontal scaling' },
];

// Pipeline steps for architecture
export const pipelineSteps = [
  { step: 'Ingest', description: 'Upload documents via API or DCLI', color: 'violet' },
  { step: 'Parse', description: 'Extract text from various formats', color: 'accent' },
  { step: 'Chunk', description: 'Split into semantic segments', color: 'peach' },
  { step: 'Embed', description: 'Generate vector embeddings', color: 'mint' },
  { step: 'Store', description: 'Persist in Actian + metadata', color: 'violet' },
  { step: 'Search', description: 'Hybrid semantic retrieval', color: 'accent' },
  { step: 'Answer', description: 'Generate grounded response', color: 'peach' },
];
