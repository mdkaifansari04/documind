import { DocsLayout } from "@/components/docs/docs-layout";
import { FileText, Search, MessageSquare, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function OverviewPage() {
  return (
    <DocsLayout
      pageId="overview"
      title="DocuMind Documentation"
      description="AI-powered internal documentation intelligence system. Ingest private docs, store vectors, retrieve relevant context, and produce grounded answers with sources."
      breadcrumbs={[{ label: "Docs", href: "/docs" }, { label: "Overview" }]}
    >
      {/* Introduction */}
      <section id="introduction" className="mb-8 sm:mb-12">
        <h2 className="text-sm font-medium text-foreground mb-3 sm:mb-4">
          Introduction
        </h2>
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 transition-colors">
          <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground mb-3">
            DocuMind transforms how teams interact with their internal
            documentation. Instead of manually searching through scattered
            files, wikis, and knowledge bases, DocuMind provides a unified
            interface for intelligent document retrieval and question answering.
          </p>
          <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
            Built for the Actian hackathon, DocuMind demonstrates the power of
            combining vector databases with modern AI to create a practical,
            production-ready documentation assistant.
          </p>
        </div>
      </section>

      {/* Key Features */}
      <section id="features" className="mb-8 sm:mb-12">
        <h2 className="text-sm font-medium text-foreground mb-4 sm:mb-5">
          Key Features
        </h2>
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="group rounded-xl border border-border bg-card p-4 sm:p-5 transition-all duration-200 hover:border-poof-accent/30 hover:bg-secondary">
            <div className="mb-3 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-poof-accent/10 transition-colors group-hover:bg-poof-accent/15">
              <FileText
                className="h-4 w-4 sm:h-5 sm:w-5 text-poof-accent"
                strokeWidth={1.5}
              />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1.5">
              Document Ingestion
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
              Upload and process documents from various formats including
              Markdown, text files, and more.
            </p>
          </div>

          <div className="group rounded-xl border border-border bg-card p-4 sm:p-5 transition-all duration-200 hover:border-poof-accent/30 hover:bg-secondary">
            <div className="mb-3 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-poof-accent/10 transition-colors group-hover:bg-poof-accent/15">
              <Search
                className="h-4 w-4 sm:h-5 sm:w-5 text-poof-accent"
                strokeWidth={1.5}
              />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1.5">
              Semantic Search
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
              Find relevant content using hybrid retrieval combining semantic
              similarity with keyword matching.
            </p>
          </div>

          <div className="group rounded-xl border border-border bg-card p-4 sm:p-5 transition-all duration-200 hover:border-poof-mint/30 hover:bg-secondary">
            <div className="mb-3 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-poof-mint/10 transition-colors group-hover:bg-poof-mint/15">
              <MessageSquare
                className="h-4 w-4 sm:h-5 sm:w-5 text-poof-mint"
                strokeWidth={1.5}
              />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1.5">
              Grounded Answers
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
              Get accurate AI-generated responses backed by source citations
              from your documentation.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="mb-8 sm:mb-12">
        <h2 className="text-sm font-medium text-foreground mb-4 sm:mb-5">
          How It Works
        </h2>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-4 transition-colors duration-150 hover:bg-secondary/50">
            <div className="shrink-0 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-poof-accent/10 text-poof-accent text-xs sm:text-sm font-semibold">
              1
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-medium text-foreground mb-0.5">
                Ingest Your Documents
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Upload documents via the API or CLI. DocuMind parses, chunks,
                and generates embeddings automatically.
              </p>
            </div>
          </div>

          <div className="mx-4 sm:mx-5 border-t border-border/60" />

          <div className="flex gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-4 transition-colors duration-150 hover:bg-secondary/50">
            <div className="shrink-0 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-poof-accent/10 text-poof-accent text-xs sm:text-sm font-semibold">
              2
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-medium text-foreground mb-0.5">
                Store in Vector Database
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Embeddings are stored in Actian&apos;s vector database along
                with metadata for efficient retrieval.
              </p>
            </div>
          </div>

          <div className="mx-4 sm:mx-5 border-t border-border/60" />

          <div className="flex gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-4 transition-colors duration-150 hover:bg-secondary/50">
            <div className="shrink-0 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-poof-accent/10 text-poof-accent text-xs sm:text-sm font-semibold">
              3
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-medium text-foreground mb-0.5">
                Search and Ask Questions
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Query your docs using natural language. Get relevant chunks or
                full grounded answers with citations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="pt-6 sm:pt-8 border-t border-border">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 sm:mb-4">
          Next Steps
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/docs/getting-started"
            className="group flex items-center gap-3 p-3.5 sm:p-4 rounded-xl bg-card border border-border transition-all duration-200 hover:border-poof-accent/30 hover:bg-secondary"
          >
            <div className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-poof-accent/10">
              <span className="text-poof-accent text-sm font-semibold">1</span>
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-sm font-medium text-foreground group-hover:text-poof-accent transition-colors">
                Getting Started
              </span>
              <p className="text-xs text-muted-foreground">
                Set up DocuMind in minutes
              </p>
            </div>
            <ArrowRight
              className="h-3.5 w-3.5 text-muted-foreground/40 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-poof-accent"
              strokeWidth={1.5}
            />
          </Link>

          <Link
            href="/docs/architecture"
            className="group flex items-center gap-3 p-3.5 sm:p-4 rounded-xl bg-card border border-border transition-all duration-200 hover:border-poof-accent/30 hover:bg-secondary"
          >
            <div className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-poof-accent/10">
              <span className="text-poof-accent text-sm font-semibold">2</span>
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-sm font-medium text-foreground group-hover:text-poof-accent transition-colors">
                Architecture
              </span>
              <p className="text-xs text-muted-foreground">
                Understand the system design
              </p>
            </div>
            <ArrowRight
              className="h-3.5 w-3.5 text-muted-foreground/40 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-poof-accent"
              strokeWidth={1.5}
            />
          </Link>
        </div>
      </section>
    </DocsLayout>
  );
}
