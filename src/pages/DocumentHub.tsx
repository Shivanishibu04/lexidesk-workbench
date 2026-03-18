import { useState } from 'react';
import { Layers, CheckCircle2, AlertCircle, ArrowRight, FileText, BookOpen, Tag, AlignLeft, RotateCcw, MessageSquare } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FileInputComponent } from '@/components/ui/FileInputComponent';
import { useDocumentContext } from '@/lib/DocumentContext';
import {
    detectSentences,
    summarizeText,
    abstractiveSummarizeText,
    classifyRhetoricalRoles,
} from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function DocumentHub() {
    const {
        documentText,
        setDocumentText,
        sentenceResults,
        setSentenceResults,
        extractiveResults,
        setExtractiveResults,
        abstractiveResults,
        setAbstractiveResults,
        rhetoricalRoleResults,
        setRhetoricalRoleResults,
        resetContext,
    } = useDocumentContext();

    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState({
        sbd: sentenceResults ? 'success' : 'idle',
        extractive: extractiveResults ? 'success' : 'idle',
        abstractive: abstractiveResults ? 'success' : 'idle',
        rhetorical: rhetoricalRoleResults ? 'success' : 'idle',
    });

    const handleExtractText = async (text: string) => {
        resetContext();
        setDocumentText(text);
        setProgress({
            sbd: 'idle',
            extractive: 'idle',
            abstractive: 'idle',
            rhetorical: 'idle',
        });
        handleProcessAll(text);
    };

    const handleResetDocument = () => {
        resetContext();
        setProgress({
            sbd: 'idle',
            extractive: 'idle',
            abstractive: 'idle',
            rhetorical: 'idle',
        });
        toast.success('Document context reset');
    };

    const handleProcessAll = async (text: string = documentText) => {
        if (!text.trim()) {
            toast.error('Please enter text to process');
            return;
        }

        setIsLoading(true);
        setProgress({
            sbd: 'loading',
            extractive: 'loading',
            abstractive: 'loading',
            rhetorical: 'loading',
        });

        try {
            // 1. SBD
            let sentencesRes;
            try {
                sentencesRes = await detectSentences(text);
                setSentenceResults(sentencesRes);
                setProgress((p) => ({ ...p, sbd: 'success' }));
            } catch (err) {
                setProgress((p) => ({ ...p, sbd: 'error' }));
                console.error('SBD error', err);
            }

            // 2. Rhetorical Roles (Depends on SBD, but fallback to naive splitting if needed)
            try {
                if (sentencesRes?.sentences) {
                    const roleRes = await classifyRhetoricalRoles(sentencesRes.sentences);
                    setRhetoricalRoleResults(roleRes);
                    setProgress((p) => ({ ...p, rhetorical: 'success' }));
                } else {
                    setProgress((p) => ({ ...p, rhetorical: 'error' }));
                }
            } catch (err) {
                setProgress((p) => ({ ...p, rhetorical: 'error' }));
                console.error('Rhetorical Role error', err);
            }

            // 3. Extractive
            try {
                const extRes = await summarizeText(text, { preserve_order: true });
                setExtractiveResults(extRes);
                setProgress((p) => ({ ...p, extractive: 'success' }));
            } catch (err) {
                setProgress((p) => ({ ...p, extractive: 'error' }));
                console.error('Extractive error', err);
            }

            // 4. Abstractive
            try {
                const absRes = await abstractiveSummarizeText(text);
                setAbstractiveResults(absRes);
                setProgress((p) => ({ ...p, abstractive: 'success' }));
            } catch (err) {
                setProgress((p) => ({ ...p, abstractive: 'error' }));
                console.error('Abstractive error', err);
            }

            toast.success('Document processing finished!');
        } catch (error) {
            toast.error('Something went wrong processing the document.');
        } finally {
            setIsLoading(false);
        }
    };

    const StatusIcon = ({ status }: { status: string }) => {
        switch (status) {
            case 'success':
                return <CheckCircle2 className="w-5 h-5 text-green-500" />;
            case 'error':
                return <AlertCircle className="w-5 h-5 text-red-500" />;
            case 'loading':
                return (
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                );
            default:
                return <div className="w-5 h-5 rounded-full border-2 border-muted" />;
        }
    };

    const isCompleted = Object.values(progress).some(status => status === 'success' || status === 'error');

    const modules = [
        {
            id: 'sbd',
            title: 'View Sentence Segmentation',
            icon: <FileText className="w-5 h-5" />,
            url: '/sentence-detection',
            color: 'text-primary',
            bgHover: 'hover:bg-primary/5',
            borderHover: 'hover:border-primary/50',
        },
        {
            id: 'extractive',
            title: 'View Extractive Summary',
            icon: <BookOpen className="w-5 h-5" />,
            url: '/summarizer',
            color: 'text-forest-light',
            bgHover: 'hover:bg-forest/5',
            borderHover: 'hover:border-forest/50',
        },
        {
            id: 'abstractive',
            title: 'View Abstractive Summary',
            icon: <AlignLeft className="w-5 h-5" />,
            url: '/abstractive-summary',
            color: 'text-purple-500',
            bgHover: 'hover:bg-purple-500/5',
            borderHover: 'hover:border-purple-500/50',
        },
        {
            id: 'rhetorical',
            title: 'View Rhetorical Roles',
            icon: <Tag className="w-5 h-5" />,
            url: '/rhetorical-role',
            color: 'text-indigo-500',
            bgHover: 'hover:bg-indigo-500/5',
            borderHover: 'hover:border-indigo-500/50',
        },
        {
            id: 'chatbot',
            title: 'Chat with Document',
            icon: <MessageSquare className="w-5 h-5" />,
            url: '/chatbot',
            color: 'text-amber-500',
            bgHover: 'hover:bg-amber-500/5',
            borderHover: 'hover:border-amber-500/50',
        },
    ];

    return (
        <DashboardLayout>
            <header className="mb-8">
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-2.5 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                        <Layers className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-display font-bold text-foreground">
                            Document Hub
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Upload once, process everything
                        </p>
                    </div>
                </div>
            </header>

            <div className="grid lg:grid-cols-2 gap-8">
                <section className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-display font-semibold text-foreground">
                            1. Upload Legal Document
                        </h2>
                        {documentText && (
                            <button
                                onClick={handleResetDocument}
                                className="text-xs text-muted-foreground hover:text-red-500 transition-colors flex items-center gap-1 bg-muted/20 px-3 py-1.5 rounded-md"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Reset Document
                            </button>
                        )}
                    </div>
                    <FileInputComponent onExtractText={handleExtractText} isLoading={isLoading} value={documentText} />
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="text-lg font-display font-semibold text-foreground">
                        2. Processing Status
                    </h2>

                    <div className="card-academia p-6 space-y-4">
                        {Object.entries(progress).map(([key, status]) => (
                            <div key={key} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
                                <span className="text-sm font-medium capitalize">
                                    {key === 'sbd' ? 'Sentence Boundary Detection' : key + ' Processing'}
                                </span>
                                <StatusIcon status={status} />
                            </div>
                        ))}

                        {!isCompleted && !isLoading && (
                            <div className="text-center py-6 text-muted-foreground text-sm border border-dashed rounded-lg border-border">
                                Please upload a document to begin processing.
                            </div>
                        )}
                    </div>

                    {documentText && (
                        <div className="mt-8">
                            <h2 className="text-lg font-display font-semibold text-foreground mb-4">
                                3. Navigate to Results
                            </h2>
                            <div className="grid gap-3">
                                {modules.map((mod) => (
                                    <button
                                        key={mod.id}
                                        onClick={() => {
                                            if (mod.id === 'chatbot') {
                                                navigate(mod.url, { state: { autoUpload: true } });
                                            } else {
                                                navigate(mod.url);
                                            }
                                        }}
                                        className={`flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card transition-all ${mod.bgHover} ${mod.borderHover}`}
                                    >
                                        <div className={`flex items-center gap-3 ${mod.color}`}>
                                            {mod.icon}
                                            <span className="font-medium text-foreground">{mod.title}</span>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </DashboardLayout>
    );
}
