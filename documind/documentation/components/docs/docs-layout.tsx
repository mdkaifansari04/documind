'use client';

import { useState, useEffect, useMemo, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { 
  Menu, 
  X,
  Book, 
  Rocket, 
  Layers, 
  Box, 
  Terminal, 
  Server, 
  CheckCircle, 
  Target,
  Moon,
  Sun,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { navItems, tocItemsMap, type TocItem } from '@/lib/docs-data';

const iconMap: Record<string, React.ElementType> = {
  'book': Book,
  'rocket': Rocket,
  'layers': Layers,
  'box': Box,
  'terminal': Terminal,
  'server': Server,
  'check-circle': CheckCircle,
  'target': Target,
};

interface DocsLayoutProps {
  children: ReactNode;
  pageId?: string;
  title?: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

export function DocsLayout({ children, pageId = 'overview', title, description, breadcrumbs }: DocsLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const { setTheme, resolvedTheme } = useTheme();
  const pathname = usePathname();

  const tocItems = useMemo(() => tocItemsMap[pageId] || [], [pageId]);

  // Scrollspy for TOC
  useEffect(() => {
    if (tocItems.length === 0) return;

    const observerOptions = {
      root: null,
      rootMargin: '-100px 0px -60% 0px',
      threshold: 0,
    };

    const observerCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    tocItems.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [tocItems, pageId]);

  const handleTocClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(id);
    }
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              aria-label="Open navigation"
            >
              <Menu className="w-5 h-5 text-foreground" />
            </button>
            <Link href="/docs" className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-poof-accent to-poof-violet flex items-center justify-center">
                <span className="text-white font-bold text-xs">D</span>
              </div>
              <span className="font-semibold text-foreground">DocuMind</span>
            </Link>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
            aria-label="Toggle theme"
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="w-5 h-5 text-foreground" />
            ) : (
              <Moon className="w-5 h-5 text-foreground" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Layout */}
      <div className="flex">
        {/* Left Sidebar */}
        <aside
          className={cn(
            'fixed top-0 left-0 z-50 h-full w-72 bg-sidebar border-r border-sidebar-border',
            'transform transition-transform duration-300 ease-out',
            'lg:sticky lg:top-0 lg:z-30 lg:translate-x-0 lg:h-screen',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-5 border-b border-sidebar-border">
              <Link href="/docs" className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-poof-accent to-poof-violet flex items-center justify-center">
                  <span className="text-white font-bold text-sm">D</span>
                </div>
                <div>
                  <h1 className="text-base font-bold text-foreground">DocuMind</h1>
                  <p className="text-xs text-muted-foreground">Documentation</p>
                </div>
              </Link>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleTheme}
                  className="hidden lg:flex p-1.5 rounded-md hover:bg-sidebar-accent transition-colors"
                  aria-label="Toggle theme"
                >
                  {resolvedTheme === 'dark' ? (
                    <Sun className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Moon className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden p-1.5 rounded-md hover:bg-sidebar-accent transition-colors"
                  aria-label="Close sidebar"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4">
              <ul className="space-y-1">
                {navItems.map((item) => {
                  const Icon = iconMap[item.icon] || Book;
                  const isActive = pathname === item.href || 
                    (item.href !== '/docs' && pathname?.startsWith(item.href));
                  
                  return (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
                          'transition-all duration-200',
                          isActive
                            ? 'bg-sidebar-accent text-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50'
                        )}
                      >
                        <Icon className={cn(
                          'w-4 h-4 flex-shrink-0',
                          isActive ? 'text-poof-accent' : ''
                        )} />
                        {item.title}
                        {isActive && (
                          <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-sidebar-border">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-accent/30">
                <div className="w-2 h-2 rounded-full bg-poof-mint animate-pulse" />
                <span className="text-xs text-muted-foreground">v1.0.0 - Hackathon Build</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 lg:pl-0">
          <div className="flex">
            {/* Center Content */}
            <main className="flex-1 min-w-0 px-6 lg:px-12 py-8 lg:py-12 max-w-4xl mx-auto pt-20 lg:pt-12">
              {/* Breadcrumbs */}
              {breadcrumbs && breadcrumbs.length > 0 && (
                <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                  {breadcrumbs.map((crumb, index) => (
                    <span key={index} className="flex items-center gap-2">
                      {index > 0 && <span>/</span>}
                      {crumb.href ? (
                        <Link href={crumb.href} className="hover:text-foreground transition-colors">
                          {crumb.label}
                        </Link>
                      ) : (
                        <span className="text-foreground">{crumb.label}</span>
                      )}
                    </span>
                  ))}
                </nav>
              )}

              {/* Page Header */}
              {title && (
                <div className="mb-8">
                  <h1 className="text-3xl lg:text-4xl font-bold text-foreground text-balance mb-3">
                    {title}
                  </h1>
                  {description && (
                    <p className="text-lg text-muted-foreground leading-relaxed text-pretty">
                      {description}
                    </p>
                  )}
                </div>
              )}

              {children}
            </main>

            {/* Right TOC - Desktop */}
            {tocItems.length > 0 && (
              <aside className="hidden xl:block sticky top-0 h-screen w-56 flex-shrink-0 py-12 overflow-y-auto">
                <div className="pl-6 border-l border-border">
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">
                    Table of contents
                  </h4>
                  <nav>
                    <ul className="space-y-1">
                      {tocItems.map((item, index) => {
                        const isActive = activeSection === item.id;
                        
                        return (
                          <li key={item.id} className="flex items-start gap-2">
                            <span className={cn(
                              'flex-shrink-0 w-5 h-5 rounded-full text-xs flex items-center justify-center mt-0.5',
                              isActive 
                                ? 'bg-foreground text-background' 
                                : 'bg-muted text-muted-foreground'
                            )}>
                              {index + 1}
                            </span>
                            <button
                              onClick={() => handleTocClick(item.id)}
                              className={cn(
                                'text-left text-sm py-0.5 transition-all duration-200',
                                isActive
                                  ? 'text-foreground font-medium'
                                  : 'text-muted-foreground hover:text-foreground'
                              )}
                            >
                              {item.title}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </nav>
                </div>
              </aside>
            )}
          </div>
        </div>
      </div>

      {/* Mobile TOC Dropdown */}
      {tocItems.length > 0 && (
        <MobileToc 
          items={tocItems} 
          activeSection={activeSection} 
          onSelect={handleTocClick} 
        />
      )}
    </div>
  );
}

// Mobile TOC Component
function MobileToc({ 
  items, 
  activeSection, 
  onSelect 
}: { 
  items: TocItem[]; 
  activeSection: string; 
  onSelect: (id: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="xl:hidden fixed bottom-4 right-4 z-30">
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full shadow-lg text-sm font-medium text-foreground"
        >
          <span>On this page</span>
          <ChevronDown className={cn(
            'w-4 h-4 transition-transform duration-200',
            isOpen && 'rotate-180'
          )} />
        </button>
        
        {isOpen && (
          <div className="absolute bottom-full right-0 mb-2 w-64 bg-card border border-border rounded-lg shadow-xl overflow-hidden">
            <div className="p-2 border-b border-border">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Table of contents
              </span>
            </div>
            <nav className="p-2 max-h-64 overflow-y-auto">
              <ul className="space-y-1">
                {items.map((item, index) => {
                  const isActive = activeSection === item.id;
                  
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => {
                          onSelect(item.id);
                          setIsOpen(false);
                        }}
                        className={cn(
                          'w-full flex items-center gap-2 text-left text-sm py-2 px-3 rounded-lg transition-all duration-200',
                          isActive
                            ? 'bg-sidebar-accent text-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50'
                        )}
                      >
                        <span className={cn(
                          'flex-shrink-0 w-5 h-5 rounded-full text-xs flex items-center justify-center',
                          isActive 
                            ? 'bg-foreground text-background' 
                            : 'bg-muted text-muted-foreground'
                        )}>
                          {index + 1}
                        </span>
                        {item.title}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}
