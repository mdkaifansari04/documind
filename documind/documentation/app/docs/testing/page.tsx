import { DocsLayout } from '@/components/docs/docs-layout';
import { testCards } from '@/lib/docs-data';
import { CheckCircle, AlertTriangle, XCircle, FileImage } from 'lucide-react';
import Link from 'next/link';

const statusConfig = {
  'Passed': {
    icon: CheckCircle,
    bgColor: 'bg-poof-mint/10',
    borderColor: 'border-poof-mint/30',
    textColor: 'text-poof-mint',
  },
  'Needs Review': {
    icon: AlertTriangle,
    bgColor: 'bg-poof-peach/10',
    borderColor: 'border-poof-peach/30',
    textColor: 'text-poof-peach',
  },
  'Failed': {
    icon: XCircle,
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/30',
    textColor: 'text-destructive',
  },
};

export default function TestingPage() {
  const passedCount = testCards.filter(t => t.status === 'Passed').length;
  const reviewCount = testCards.filter(t => t.status === 'Needs Review').length;
  const failedCount = testCards.filter(t => t.status === 'Failed').length;

  return (
    <DocsLayout
      pageId="testing"
      title="Testing & Validation"
      description="Screenshot-based test documentation with status tracking for DocuMind functionality."
      breadcrumbs={[
        { label: 'Docs', href: '/docs' },
        { label: 'Testing & Validation' }
      ]}
    >
      {/* Test Overview */}
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
          This page documents the test results for core DocuMind functionality. Each test includes 
          the objective, command used, observed results, and current status.
        </p>
      </section>

      {/* Test Results */}
      <section id="test-results" className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-6">Test Results</h2>
        
        <div className="space-y-6">
          {testCards.map((test) => {
            const config = statusConfig[test.status];
            const StatusIcon = config.icon;
            
            return (
              <div 
                key={test.id}
                className="p-5 rounded-xl bg-card border border-border"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{test.title}</h3>
                    <p className="text-sm text-muted-foreground">{test.objective}</p>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${config.bgColor} border ${config.borderColor}`}>
                    <StatusIcon className={`w-3.5 h-3.5 ${config.textColor}`} />
                    <span className={`text-xs font-medium ${config.textColor}`}>{test.status}</span>
                  </div>
                </div>

                {/* Screenshot Placeholder */}
                {test.image ? (
                  <div className="relative aspect-video mb-4 rounded-lg overflow-hidden bg-secondary/50 border border-border">
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                      <FileImage className="w-8 h-8 mb-2 opacity-50" />
                      <code className="text-xs font-mono opacity-70">{test.image}</code>
                    </div>
                  </div>
                ) : null}

                {/* Command */}
                <div className="mb-4">
                  <div className="text-xs text-muted-foreground mb-1.5 font-medium">Command</div>
                  <div className="bg-code-bg border border-border rounded-lg p-3 overflow-x-auto">
                    <code className="text-sm font-mono text-code-text">{test.command}</code>
                  </div>
                </div>

                {/* Notes */}
                <div className="p-3 rounded-lg bg-secondary/30">
                  <div className="text-xs text-muted-foreground mb-1 font-medium">Notes</div>
                  <p className="text-sm text-foreground">{test.notes}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Next Steps */}
      <section className="mt-12 pt-8 border-t border-border">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Related Documentation
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link 
            href="/docs/hackathon-scope"
            className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border hover:border-poof-accent/50 transition-colors group"
          >
            <div>
              <span className="font-medium text-foreground group-hover:text-poof-accent transition-colors">
                Hackathon Scope
              </span>
              <p className="text-xs text-muted-foreground">What&apos;s included in this build</p>
            </div>
          </Link>
          
          <Link 
            href="/docs/components"
            className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border hover:border-poof-accent/50 transition-colors group"
          >
            <div>
              <span className="font-medium text-foreground group-hover:text-poof-accent transition-colors">
                Components
              </span>
              <p className="text-xs text-muted-foreground">Explore system components</p>
            </div>
          </Link>
        </div>
      </section>
    </DocsLayout>
  );
}
