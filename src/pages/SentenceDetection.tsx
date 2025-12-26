import { useState } from 'react';
import { FileText, Wand2, Copy, Check, RotateCcw } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LoadingState } from '@/components/ui/LoadingSpinner';
import { detectSentences } from '@/lib/api';
import { toast } from 'sonner';

const sampleText = `The court hereby finds that the defendant, having been duly notified of the proceedings, failed to appear at the scheduled hearing. Pursuant to Rule 55(a) of the Federal Rules of Civil Procedure, default judgment may be entered against a party who has failed to plead or otherwise defend. The plaintiff has demonstrated that proper service was effectuated in accordance with Rule 4. Therefore, the court grants the motion for default judgment.`;

export default function SentenceDetection() {
  const [inputText, setInputText] = useState('');
  const [sentences, setSentences] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleDetect = async () => {
    if (!inputText.trim()) {
      toast.error('Please enter some text to analyze');
      return;
    }

    setIsLoading(true);
    try {
      const result = await detectSentences(inputText);
      setSentences(result.sentences);
      toast.success(`Detected ${result.count} sentences`);
    } catch (error) {
      toast.error('Failed to detect sentences');
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
    const allText = sentences.map((s, i) => `${i + 1}. ${s}`).join('\n\n');
    await navigator.clipboard.writeText(allText);
    toast.success('All sentences copied to clipboard');
  };

  const handleReset = () => {
    setInputText('');
    setSentences([]);
  };

  const handleLoadSample = () => {
    setInputText(sampleText);
    setSentences([]);
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
        <section className="card-academia p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-semibold text-foreground">
              Input Text
            </h2>
            <button
              onClick={handleLoadSample}
              className="text-xs text-primary hover:text-primary/80 transition-colors"
            >
              Load Sample
            </button>
          </div>
          
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your legal text here for sentence boundary detection..."
            className="input-academia w-full h-64 resize-none font-serif text-sm leading-relaxed"
          />

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleDetect}
              disabled={isLoading || !inputText.trim()}
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
              Reset
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
            <div className="space-y-3 max-h-[500px] overflow-y-auto scrollbar-academia pr-2">
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
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-sm text-muted-foreground">
                Enter text and click "Detect Sentences" to see results
              </p>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
