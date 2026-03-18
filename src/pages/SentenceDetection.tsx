import { useState, useEffect } from 'react';
import { FileText, Wand2, Copy, Check, RotateCcw } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LoadingState } from '@/components/ui/LoadingSpinner';
import { detectSentences } from '@/lib/api';
import { toast } from 'sonner';
import { FileInputComponent } from '@/components/ui/FileInputComponent';
import { useDocumentContext } from '@/lib/DocumentContext';

export default function SentenceDetection() {
  const { documentText, setDocumentText, sentenceResults, setSentenceResults, resetContext } = useDocumentContext();
  const [sentences, setSentences] = useState<string[]>(sentenceResults?.sentences || []);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (sentenceResults?.sentences) {
      setSentences(sentenceResults.sentences);
    }
  }, [sentenceResults]);

  const handleExtractText = async (text: string) => {
    resetContext();
    setDocumentText(text);
    // Auto-detect on new upload
    handleDetect(text, true);
  };

  const handleDetect = async (textToAnalyze: string = documentText, forceRun: boolean = false) => {
    if (!textToAnalyze.trim()) {
      toast.error('Please enter some text to analyze');
      return;
    }

    if (!forceRun && textToAnalyze === documentText && sentenceResults) {
      toast.success('Results already loaded from context');
      return;
    }

    setIsLoading(true);
    try {
      const result = await detectSentences(textToAnalyze);
      setSentences(result.sentences);
      setSentenceResults(result);
      toast.success(`Detected ${result.count} sentence${result.count > 1 ? 's' : ''}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to detect sentences';
      toast.error(errorMessage, {
        description: 'Ensure the LeXIDesk backend is running at the configured API URL.',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyAll = async () => {
    if (sentences.length === 0) return;
    const allText = sentences.map((s, i) => `${i + 1}. ${s}`).join('\n\n');
    await navigator.clipboard.writeText(allText);
    toast.success('All sentences copied to clipboard');
  };

  const handleReset = () => {
    setSentences([]);
    setSentenceResults(null);
    setDocumentText(''); // Also clear text for this simple reset
    resetContext();
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-2.5 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Sentence Boundary Detection
            </h1>
            <p className="text-sm text-muted-foreground">
              CNN-CRF powered legal text segmentation
            </p>
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <section className="flex flex-col gap-4">
          <FileInputComponent
            onExtractText={handleExtractText}
            isLoading={isLoading}
            value={documentText}
          />
          <div className="flex gap-3">
            <button
              onClick={() => handleDetect()}
              disabled={isLoading || !documentText.trim()}
              className="btn-primary-academia flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Wand2 className="w-4 h-4" />
              Detect Sentences
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
              Detected Sentences
              {sentences.length > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({sentences.length} found)
                </span>
              )}
            </h2>
            {sentences.length > 0 && (
              <button
                onClick={handleCopyAll}
                className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                Copy All
              </button>
            )}
          </div>

          {isLoading ? (
            <LoadingState message="Analyzing text with CNN-CRF model..." />
          ) : sentences.length > 0 ? (
            <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-academia pr-2">
              {sentences.map((sentence, index) => (
                <div
                  key={index}
                  className="sentence-block group animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3">
                      <span className="text-xs font-mono text-primary/60 mt-0.5 shrink-0">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <p className="text-sm text-foreground/90 leading-relaxed">
                        {sentence}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCopy(sentence, index)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-muted rounded"
                    >
                      {copiedIndex === index ? (
                        <Check className="w-3.5 h-3.5 text-forest" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center h-full min-h-[300px]">
              <FileText className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-sm text-muted-foreground border border-dashed border-border p-6 rounded-lg w-full">
                Upload a document or paste text, then click "Detect Sentences" to see results.
              </p>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
