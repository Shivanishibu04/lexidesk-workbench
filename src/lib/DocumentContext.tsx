import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface DocumentState {
    documentText: string;
    hasDocument: boolean;
    sentenceResults: any | null;
    extractiveResults: any | null;
    abstractiveResults: any | null;
    rhetoricalRoleResults: any | null;

    chatbotMessages: any[];
    chatbotUploadedFile: { name: string; id: string } | null;
    chatbotHasAutoUploaded: boolean;

    setDocumentText: (text: string) => void;
    setSentenceResults: (res: any) => void;
    setExtractiveResults: (res: any) => void;
    setAbstractiveResults: (res: any) => void;
    setRhetoricalRoleResults: (res: any) => void;
    setChatbotMessages: (msgs: any[]) => void;
    setChatbotUploadedFile: (file: { name: string; id: string } | null) => void;
    setChatbotHasAutoUploaded: (val: boolean) => void;
    resetContext: () => void;
}

const DocumentContext = createContext<DocumentState | undefined>(undefined);

export function DocumentProvider({ children }: { children: ReactNode }) {
    const [documentText, setDocumentText] = useState('');
    const [sentenceResults, setSentenceResults] = useState<any | null>(null);
    const [extractiveResults, setExtractiveResults] = useState<any | null>(null);
    const [abstractiveResults, setAbstractiveResults] = useState<any | null>(null);
    const [rhetoricalRoleResults, setRhetoricalRoleResults] = useState<any | null>(null);
    const [chatbotMessages, setChatbotMessages] = useState<any[]>([]);
    const [chatbotUploadedFile, setChatbotUploadedFile] = useState<{ name: string; id: string } | null>(null);
    const [chatbotHasAutoUploaded, setChatbotHasAutoUploaded] = useState(false);

    const hasDocument = documentText.trim().length > 0;

    const resetContext = () => {
        setDocumentText('');
        setSentenceResults(null);
        setExtractiveResults(null);
        setAbstractiveResults(null);
        setRhetoricalRoleResults(null);
        setChatbotMessages([]);
        setChatbotUploadedFile(null);
        setChatbotHasAutoUploaded(false);
    };

    return (
        <DocumentContext.Provider
            value={{
                documentText,
                hasDocument,
                sentenceResults,
                extractiveResults,
                abstractiveResults,
                rhetoricalRoleResults,
                chatbotMessages,
                chatbotUploadedFile,
                chatbotHasAutoUploaded,
                setDocumentText,
                setSentenceResults,
                setExtractiveResults,
                setAbstractiveResults,
                setRhetoricalRoleResults,
                setChatbotMessages,
                setChatbotUploadedFile,
                setChatbotHasAutoUploaded,
                resetContext
            }}
        >
            {children}
        </DocumentContext.Provider>
    );
}

export function useDocumentContext() {
    const context = useContext(DocumentContext);
    if (!context) {
        throw new Error('useDocumentContext must be used within a DocumentProvider');
    }
    return context;
}
