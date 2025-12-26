import { FileText, BookOpen, MessageSquare, Scale, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

const tools = [
  {
    title: 'Sentence Boundary Detection',
    description: 'Leverage our CNN-CRF model to accurately detect sentence boundaries in complex legal documents.',
    icon: FileText,
    url: '/sentence-detection',
    accent: 'from-primary/20 to-primary/5',
  },
  {
    title: 'Extractive Summarizer',
    description: 'Generate concise summaries from lengthy legal texts using advanced NLP techniques.',
    icon: BookOpen,
    url: '/summarizer',
    accent: 'from-forest/20 to-forest/5',
  },
  {
    title: 'Legal Chatbot',
    description: 'Upload legal documents and ask questions powered by RAG-based retrieval and generation.',
    icon: MessageSquare,
    url: '/chatbot',
    accent: 'from-gold/20 to-gold/5',
  },
];

export default function Dashboard() {
  return (
    <DashboardLayout>
      {/* Header */}
      <header className="mb-12">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
            <Scale className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Welcome to LeXiDesk
            </h1>
            <p className="text-muted-foreground">
              Your AI-powered legal document workbench
            </p>
          </div>
        </div>
      </header>

      {/* Tools Grid */}
      <section>
        <h2 className="text-lg font-display font-semibold text-foreground mb-6">
          Available Tools
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <Link
              key={tool.url}
              to={tool.url}
              className="group card-academia p-6 hover:border-primary/30 transition-all duration-300 hover:glow-gold"
            >
              <div
                className={`w-12 h-12 rounded-lg bg-gradient-to-br ${tool.accent} border border-border/50 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300`}
              >
                <tool.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-display font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                {tool.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                {tool.description}
              </p>
              <div className="flex items-center text-sm text-primary/70 group-hover:text-primary transition-colors">
                <span>Open Tool</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Info Section */}
      <section className="mt-12 card-academia p-6">
        <h2 className="text-lg font-display font-semibold text-foreground mb-4">
          About LeXiDesk
        </h2>
        <div className="prose-legal text-sm space-y-3">
          <p className="text-muted-foreground">
            LeXiDesk combines cutting-edge natural language processing with legal expertise 
            to streamline document analysis. Our tools are designed to assist legal professionals 
            in processing, understanding, and extracting insights from complex legal texts.
          </p>
          <p className="text-muted-foreground">
            Powered by CNN-CRF models for precise sentence segmentation and RAG-based retrieval 
            for intelligent question answering, LeXiDesk represents the intersection of artificial 
            intelligence and legal scholarship.
          </p>
        </div>
      </section>
    </DashboardLayout>
  );
}
