import { useState, useEffect } from 'react';
import { AlignLeft, Sparkles, Copy, RotateCcw } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LoadingState } from '@/components/ui/LoadingSpinner';
import { abstractiveSummarizeText, AbstractiveSummaryResponse } from '@/lib/api';
import { toast } from 'sonner';
import { FileInputComponent } from '@/components/ui/FileInputComponent';
import { useDocumentContext } from '@/lib/DocumentContext';

export default function AbstractiveSummary() {
    const { documentText, setDocumentText, abstractiveResults, setAbstractiveResults, resetContext } = useDocumentContext();
    const [result, setResult] = useState<AbstractiveSummaryResponse | null>(abstractiveResults);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (abstractiveResults) {
            setResult(abstractiveResults);
        }
    }, [abstractiveResults]);

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

        if (!forceRun && textToSummarize === documentText && abstractiveResults) {
            toast.info('Results already loaded from context');
            return;
        }

        setIsLoading(true);
        try {
            const response = await abstractiveSummarizeText(textToSummarize);
            setResult(response);
            setAbstractiveResults(response);
            toast.success('Abstractive summary generated successfully');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to generate abstractive summary';
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
        setAbstractiveResults(null);
        setDocumentText(''); // clear local text tracking in UI
        resetContext();
    };

    return (
        <DashboardLayout>
            {/* Header */}
            <header className="mb-8">
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-2.5 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/20">
                        <AlignLeft className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-display font-bold text-foreground">
                            Abstractive Summarizer
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Generate concise, re-written summaries of complex legal texts
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
                    </div>

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
                            Generated Abstractive Summary
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
                        <LoadingState message="Generating abstractive summary..." />
                    ) : result ? (
                        <div className="animate-fade-in h-full">
                            {/* Summary Text Area */}
                            <div className="p-6 bg-gradient-to-br from-purple-500/10 to-transparent rounded-lg border border-purple-500/20 h-full min-h-[300px]">
                                <p className="text-base text-foreground/90 leading-relaxed font-serif whitespace-pre-wrap">
                                    {result.summary}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center h-full min-h-[300px]">
                            <AlignLeft className="w-12 h-12 text-muted-foreground/30 mb-4" />
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
