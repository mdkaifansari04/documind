import { DocsLayout } from '@/components/docs/docs-layout';
import { TestCard } from '@/components/docs/test-card';
import { testCards } from '@/lib/docs-data';

export default function TestingPage() {
  const passedCount = testCards.filter((t) => t.status === 'Passed').length;
  const reviewCount = testCards.filter((t) => t.status === 'Needs Review').length;
  const failedCount = testCards.filter((t) => t.status === 'Failed').length;

  return (
    <DocsLayout
      pageId="testing"
      title="Testing & Validation"
      description="Real test notes from running the system: what we executed, what we saw, and what still needs cleanup."
      breadcrumbs={[{ label: 'Docs', href: '/docs' }, { label: 'Testing & Validation' }]}
    >
      <section id="test-overview" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">Test Overview</h2>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-poof-mint/5 border border-poof-mint/20 text-center">
            <div className="text-2xl font-bold text-poof-mint mb-1">{passedCount}</div>
            <div className="text-xs text-muted-foreground">Passed</div>
          </div>
          <div className="p-4 rounded-xl bg-poof-peach/5 border border-poof-peach/20 text-center">
            <div className="text-2xl font-bold text-poof-peach mb-1">{reviewCount}</div>
            <div className="text-xs text-muted-foreground">Needs Review</div>
          </div>
          <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 text-center">
            <div className="text-2xl font-bold text-destructive mb-1">{failedCount}</div>
            <div className="text-xs text-muted-foreground">Failed</div>
          </div>
        </div>

        <p className="text-muted-foreground leading-relaxed">
          This section is intentionally screenshot-and-notes driven. We ran commands, captured terminal evidence, and wrote down what happened right there — while it was fresh and before memory turned into fiction.
        </p>
      </section>

      <section id="test-results" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-6">Test Results</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          Every card below includes objective, command, result note, and status. If a screenshot is missing, the card still keeps the log context so the test is not lost.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          {testCards.map((test, index) => (
            <TestCard key={test.id} test={test} index={index} />
          ))}
        </div>
      </section>
    </DocsLayout>
  );
}
