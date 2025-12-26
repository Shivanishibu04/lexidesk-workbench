import { Scale, FileText, MessageSquare, BookOpen, Home } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const menuItems = [
  {
    title: 'Dashboard',
    url: '/',
    icon: Home,
    description: 'Overview',
  },
  {
    title: 'Sentence Detection',
    url: '/sentence-detection',
    icon: FileText,
    description: 'CNN-CRF Boundary Detection',
  },
  {
    title: 'Summarizer',
    url: '/summarizer',
    icon: BookOpen,
    description: 'Extractive Summarization',
  },
  {
    title: 'Legal Chatbot',
    url: '/chatbot',
    icon: MessageSquare,
    description: 'RAG-Powered Assistant',
  },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo / Header */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <Scale className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-display font-bold text-sidebar-accent-foreground">
              LeXiDesk
            </h1>
            <p className="text-xs text-sidebar-foreground/60">Legal AI Workbench</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-academia">
        <p className="px-3 py-2 text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider">
          Tools
        </p>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.url;
          return (
            <NavLink
              key={item.url}
              to={item.url}
              className={cn(
                'sidebar-item group',
                isActive && 'sidebar-item-active'
              )}
            >
              <item.icon
                className={cn(
                  'w-5 h-5 transition-colors',
                  isActive ? 'text-primary' : 'text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground'
                )}
              />
              <div className="flex-1">
                <span
                  className={cn(
                    'block text-sm font-medium',
                    isActive ? 'text-sidebar-accent-foreground' : ''
                  )}
                >
                  {item.title}
                </span>
                <span className="block text-xs text-sidebar-foreground/50">
                  {item.description}
                </span>
              </div>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="px-3 py-2 rounded-md bg-muted/20">
          <p className="text-xs text-sidebar-foreground/60 italic">
            "Justice is the constant and perpetual will to render to everyone his due."
          </p>
          <p className="text-xs text-primary/70 mt-1">— Justinian</p>
        </div>
      </div>
    </aside>
  );
}
