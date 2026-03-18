import { useState, useEffect } from 'react';
import { Tag, FileText, Copy, RotateCcw } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LoadingState } from '@/components/ui/LoadingSpinner';
import { detectSentences, classifyRhetoricalRoles, RhetoricalRoleResponse } from '@/lib/api';
import { toast } from 'sonner';
import { FileInputComponent } from '@/components/ui/FileInputComponent';
import { useDocumentContext } from '@/lib/DocumentContext';

export default function RhetoricalRole() {
    const { documentText, setDocumentText, rhetoricalRoleResults, setRhetoricalRoleResults, resetContext } = useDocumentContext();
    const [result, setResult] = useState<RhetoricalRoleResponse | null>(rhetoricalRoleResults);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (rhetoricalRoleResults) {
            setResult(rhetoricalRoleResults);
        }
    }, [rhetoricalRoleResults]);

    const handleExtractText = async (text: string) => {
        resetContext();
        setDocumentText(text);
        handleClassify(text, true);
    };

    const handleClassify = async (textToClassify: string = documentText, forceRun: boolean = false) => {
        if (!textToClassify.trim()) {
            toast.error('Please enter some text to classify');
            return;
        }

        if (!forceRun && textToClassify === documentText && rhetoricalRoleResults) {
            toast.info('Results already loaded from context');
            return;
        }

        setIsLoading(true);
        try {
            // Step 1: Detect sentences
            toast.info('Detecting sentences...');
            const sentenceResult = await detectSentences(textToClassify);

            // Step 2: Classify roles
            toast.info('Classifying rhetorical roles...');
            const roleResult = await classifyRhetoricalRoles(sentenceResult.sentences);

            setResult(roleResult);
            setRhetoricalRoleResults(roleResult);
            toast.success('Rhetorical roles classified successfully');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to classify roles';
            toast.error(errorMessage, {
                description: 'Ensure the LeXIDesk backend is running at the configured API URL.',
                duration: 5000,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = async () => {
        if (result?.roles) {
            const text = result.roles.map(r => `[${r.role}] ${r.sentence}`).join('\n\n');
            await navigator.clipboard.writeText(text);
            toast.success('Results copied to clipboard');
        }
    };

    const handleReset = () => {
        setResult(null);
        setRhetoricalRoleResults(null);
        setDocumentText(''); // clear local text tracking in UI
        resetContext();
    };

    const getRoleColor = (role: string) => {
        const roles: Record<string, string> = {
            FACT: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
            RULING: 'bg-green-500/10 text-green-500 border-green-500/20',
            ARGUMENT: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
            STATUTE: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
            PRECEDENT: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
            ISSUE: 'bg-red-500/10 text-red-500 border-red-500/20',
        };
        return roles[role?.toUpperCase()] || 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    };

    return (
        <DashboardLayout>
            {/* Header */}
            <header className="mb-8">
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-2.5 rounded-lg bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 border border-indigo-500/20">
                        <Tag className="w-6 h-6 text-indigo-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-display font-bold text-foreground">
                            Rhetorical Role Classifier
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Automatically label sentences with legal rhetorical roles
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
                            onClick={() => handleClassify()}
                            disabled={isLoading || !documentText.trim()}
                            className="btn-primary-academia flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Tag className="w-4 h-4" />
                            Classify Roles
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
                            Classification Results
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
                        <LoadingState message="Analyzing document and classifying roles..." />
                    ) : result?.roles ? (
                        <div className="animate-fade-in space-y-4 max-h-[600px] overflow-y-auto scrollbar-academia pr-2">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 rounded-tl-lg">Sentence</th>
                                        <th className="px-4 py-3 rounded-tr-lg w-32">Role</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {result.roles.map((item, index) => (
                                        <tr key={index} className="hover:bg-muted/20 transition-colors">
                                            <td className="px-4 py-4 text-sm text-foreground/90 font-serif leading-relaxed">
                                                {item.sentence}
                                            </td>
                                            <td className="px-4 py-4 align-top">
                                                <div className="flex justify-start">
                                                  <span className={`inline-block px-3 py-1.5 text-sm font-semibold tracking-wide rounded-md border min-w-[100px] text-center ${getRoleColor(item.role)}`}>
                                                      {item.role || 'None'}
                                                  </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center h-full min-h-[300px]">
                            <FileText className="w-12 h-12 text-muted-foreground/30 mb-4" />
                            <p className="text-sm text-muted-foreground border border-dashed border-border p-6 rounded-lg w-full">
                                Upload a document or paste text, then click "Classify Roles" to see results
                            </p>
                        </div>
                    )}
                </section>
            </div>
        </DashboardLayout>
    );
}
