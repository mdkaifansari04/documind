import { DocsLayout } from '@/components/docs/docs-layout';
import { EvidenceImage } from '@/components/docs/evidence-image';
import { testingSections } from '@/lib/docs-data';
import { Camera } from 'lucide-react';

export default function TestingPage() {
  return (
    <DocsLayout
      pageId="testing"
      title="Testing & Validation"
      description="Real test notes from running the system: what we executed, what we saw, and what still needs cleanup."
      breadcrumbs={[{ label: 'Docs', href: '/docs' }, { label: 'Testing & Validation' }]}
    >
      {testingSections.map((section, sectionIndex) => (
        <section key={section.id} id={section.id} className="mb-12">
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="border-b border-border bg-gradient-to-r from-primary/7 via-secondary/40 to-transparent px-5 py-4 sm:px-6">
              <div className="mb-2 flex items-center gap-3">
                <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-primary/15 px-2 text-xs font-semibold text-primary">
                  {sectionIndex + 1}
                </span>
                <h2 className="text-xl font-semibold text-foreground">{section.title}</h2>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{section.summary}</p>
            </div>

            <div className="relative px-4 py-5 sm:px-6">
              <div className="pointer-events-none absolute bottom-5 left-6 top-5 hidden w-px bg-border sm:block" />
              <div className="space-y-5">
                {section.steps.map((step, stepIndex) => (
                  <article key={step.id} className="relative sm:pl-8">
                    <span className="absolute left-0 top-5 hidden h-3 w-3 rounded-full border-2 border-background bg-primary sm:block" />
                    <div className="rounded-xl border border-border bg-background/40">
                      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-secondary px-2 text-xs font-semibold text-foreground">
                          {sectionIndex + 1}.{stepIndex + 1}
                        </span>
                        <h3 className="text-sm font-semibold text-foreground sm:text-base">{step.title}</h3>
                      </div>

                      <div className="grid gap-4 p-4">
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            <span className="font-medium text-foreground">What we did:</span> {step.whatYouDid}
                          </p>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            <span className="font-medium text-foreground">What happened:</span> {step.whatHappened}
                          </p>
                        </div>

                        <div className="rounded-lg border border-dashed border-border bg-secondary/30 p-3 sm:p-4">
                          <p className="mb-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                            Evidence
                          </p>
                          {step.image ? (
                            <EvidenceImage src={step.image} alt={step.imageAlt || step.title} />
                          ) : (
                            <div className="flex min-h-36 flex-col items-center justify-center rounded-md border border-border/70 bg-card px-4 py-6 text-center">
                              <Camera className="mb-2 h-6 w-6 text-muted-foreground/70" />
                              <p className="text-sm text-foreground">{step.imagePlaceholder}</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Add screenshot file here when ready.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      ))}

      <section className="mt-14 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="mb-3 text-lg font-semibold text-foreground">Image Drop-In Notes</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Each evidence slot is already mapped to your testing timeline. When you add images, set
          the `image` field for that step in `testingSections` and the panel will auto-render it.
        </p>
        <div className="mt-4 rounded-lg border border-border bg-secondary/20 p-3">
          <p className="text-xs text-muted-foreground">
            File: <code className="font-mono text-code-text">documentation/lib/docs-data.ts</code>
          </p>
        </div>
      </section>
    </DocsLayout>
  );
}
