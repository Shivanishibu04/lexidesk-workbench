import { useState, useEffect } from 'react';
import { BookOpen, Sparkles, Copy, RotateCcw, Settings2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LoadingState } from '@/components/ui/LoadingSpinner';
import { summarizeText, SummarizationResponse } from '@/lib/api';
import { toast } from 'sonner';
import { FileInputComponent } from '@/components/ui/FileInputComponent';
import { useDocumentContext } from '@/lib/DocumentContext';

export default function Summarizer() {
  const { documentText, setDocumentText, extractiveResults, setExtractiveResults, resetContext } = useDocumentContext();
  const [result, setResult] = useState<SummarizationResponse | null>(extractiveResults);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [topK, setTopK] = useState<number | ''>('');
  const [compressionRatio, setCompressionRatio] = useState<number>(0.217);

  useEffect(() => {
    if (extractiveResults) {
      setResult(extractiveResults);
    }
  }, [extractiveResults]);

  const handleExtractText = async (text: string) => {
    resetContext();
    setDocumentText(text);
    handleSummarize(text, true);
  };

  const handleSummarize = async (textToSummarize: string = documentText, forceRun: boolean = false) => {
    if (!textToSummarize.trim()) {
      toast.error('Please enter some text to summarize');
      return;
    }

    if (!forceRun && textToSummarize === documentText && extractiveResults) {
      toast.info('Results already loaded from context');
      return;
    }

    setIsLoading(true);
    try {
      const response = await summarizeText(textToSummarize, {
        top_k: topK === '' ? undefined : topK,
        compression_ratio: compressionRatio,
        preserve_order: true,
      });
      setResult(response);
      setExtractiveResults(response);
      toast.success('Summary generated successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate summary';
      toast.error(errorMessage, {
        description: 'Ensure the LeXIDesk backend is running at the configured API URL.',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (result?.summary) {
      await navigator.clipboard.writeText(result.summary);
      toast.success('Summary copied to clipboard');
    }
  };

  const handleReset = () => {
    setResult(null);
    setExtractiveResults(null);
    setDocumentText(''); // clear local text tracking in UI
    resetContext();
  };

  const compressionPercentage =
    result && result.original_sentence_count > 0
      ? Math.round(
        (1 - result.summary_sentence_count / result.original_sentence_count) * 100
      )
      : 0;

  return (
    <DashboardLayout>
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-2.5 rounded-lg bg-gradient-to-br from-forest/20 to-forest/5 border border-forest/20">
            <BookOpen className="w-6 h-6 text-forest-light" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Extractive Summarizer
            </h1>
            <p className="text-sm text-muted-foreground">
              AI-powered legal document summarization
            </p>
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-display font-semibold text-foreground">
              Document Input
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-md transition-colors ${showSettings ? 'bg-muted text-primary' : 'hover:bg-muted/50 text-muted-foreground'}`}
              >
                <Settings2 className="w-4 h-4" />
                Settings
              </button>
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="mb-4 p-4 bg-muted/30 rounded-lg border border-border/50 animate-fade-in">
              <h3 className="text-sm font-medium text-foreground mb-3">
                Summarization Settings
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-2">
                    Top-K Sentences
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={topK}
                    onChange={(e) => setTopK(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Auto"
                    className="input-academia w-full text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-2">
                    Compression Ratio
                  </label>
                  <input
                    type="number"
                    min={0.1}
                    max={0.9}
                    step={0.1}
                    value={compressionRatio}
                    onChange={(e) => setCompressionRatio(Number(e.target.value))}
                    className="input-academia w-full text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          <FileInputComponent
            onExtractText={handleExtractText}
            isLoading={isLoading}
            value={documentText}
          />

          <div className="flex gap-3">
            <button
              onClick={() => handleSummarize()}
              disabled={isLoading || !documentText.trim()}
              className="btn-primary-academia flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4" />
              Generate Summary
            </button>
            <button
              onClick={handleReset}
              className="btn-secondary-academia flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Results
            </button>
          </div>
        </section>

        {/* Results Section */}
        <section className="card-academia p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-semibold text-foreground">
              Summary
            </h2>
            {result && (
              <button
                onClick={handleCopy}
                className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                Copy
              </button>
            )}
          </div>

          {isLoading ? (
            <LoadingState message="Generating extractive summary..." />
          ) : result ? (
            <div className="animate-fade-in">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-3 bg-muted/30 rounded-lg border border-border/50 text-center">
                  <p className="text-2xl font-display font-bold text-foreground">
                    {result.original_sentence_count}
                  </p>
                  <p className="text-xs text-muted-foreground">Original</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg border border-border/50 text-center">
                  <p className="text-2xl font-display font-bold text-primary">
                    {result.summary_sentence_count}
                  </p>
                  <p className="text-xs text-muted-foreground">Summary</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg border border-border/50 text-center">
                  <p className="text-2xl font-display font-bold text-forest-light">
                    {compressionPercentage}%
                  </p>
                  <p className="text-xs text-muted-foreground">Reduced</p>
                </div>
              </div>

              {/* Summary Text */}
              <div className="p-4 bg-gradient-to-br from-muted/40 to-muted/20 rounded-lg border border-border/50">
                <p className="text-sm text-foreground/90 leading-relaxed font-serif">
                  {result.summary}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center h-full min-h-[300px]">
              <BookOpen className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-sm text-muted-foreground border border-dashed border-border p-6 rounded-lg w-full">
                Upload a document or paste text, then click "Generate Summary" to see results
              </p>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
