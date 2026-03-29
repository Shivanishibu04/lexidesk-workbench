import { useState, useRef, useEffect } from 'react';
import { Upload, FileText, FileUp, Type } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

interface FileInputComponentProps {
    onExtractText: (text: string) => void;
    isLoading?: boolean;
    value?: string;
}

export function FileInputComponent({ onExtractText, isLoading, value = '' }: FileInputComponentProps) {
    const [inputText, setInputText] = useState(value);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setInputText(value);
    }, [value]);

    const handleTextSubmit = () => {
        if (!inputText.trim()) {
            toast.error('Please enter some text to analyze');
            return;
        }
        onExtractText(inputText);
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = async (file: File) => {
        if (file.type === 'text/plain') {
            const text = await file.text();
            onExtractText(text);
            setInputText(text);
            toast.success('TXT file loaded successfully');
        } else if (file.type === 'application/pdf') {
            try {
                toast.info('Extracting text from PDF...', { id: 'pdf-extract' });
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                let fullText = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 1.0 });
                    const pageHeight = viewport.height;
                    
                    const textContent = await page.getTextContent();
                    
                    // Filter out headers (top 8%) and footers (bottom 8%)
                    const validItems = textContent.items.filter((item: any) => {
                        // If no transform data, keep it to be safe
                        if (!item.transform || item.transform.length < 6) return true;
                        
                        // In standard PDF coordinates, y=0 is the bottom of the page
                        const y = item.transform[5];
                        const isHeader = y > pageHeight * 0.92;
                        const isFooter = y < pageHeight * 0.08;
                        
                        return !isHeader && !isFooter;
                    });
                    
                    // Combine chunks and add a soft break between them
                    let pageText = validItems.map((item: any) => item.str).join(' ');
                    fullText += pageText + '\n\n';
                }
                
                // Format the complete text:
                // 1. Fix hyphenated line breaks (e.g., "constitu- tion" -> "constitution")
                fullText = fullText.replace(/([a-zA-Z]+)-\s+([a-zA-Z]+)/g, "$1$2");
                // 2. Remove excessive duplicate spaces
                fullText = fullText.replace(/ {2,}/g, ' ');
                // 3. Normalize multiple whitespace and newlines but keep paragraph breaks (max 2 newlines)
                fullText = fullText.replace(/\n{3,}/g, '\n\n');
                // 4. Trim leading/trailing whitespace
                fullText = fullText.trim();
                
                onExtractText(fullText);
                setInputText(fullText);
                toast.success('PDF text extracted successfully', { id: 'pdf-extract' });
            } catch (error) {
                toast.error('Failed to extract text from PDF', { id: 'pdf-extract' });
                console.error(error);
            }
        } else {
            toast.error('Unsupported file format. Please upload TXT or PDF.');
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="card-academia p-6">
            <Tabs defaultValue="paste" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="paste" className="flex items-center gap-2">
                        <Type className="w-4 h-4" />
                        Paste Text
                    </TabsTrigger>
                    <TabsTrigger value="upload" className="flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Upload File
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="paste">
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Paste your legal text here..."
                        className="input-academia w-full h-64 resize-none font-serif text-sm leading-relaxed mb-4"
                    />
                    <button
                        onClick={handleTextSubmit}
                        disabled={isLoading || !inputText.trim()}
                        className="btn-primary-academia flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FileText className="w-4 h-4" />
                        Use Text
                    </button>
                </TabsContent>

                <TabsContent value="upload">
                    <div
                        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer flex flex-col items-center justify-center min-h-[16rem]
              ${dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={triggerFileInput}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".txt,.pdf"
                            onChange={handleChange}
                            className="hidden"
                        />
                        <FileUp className={`w-12 h-12 mb-4 ${dragActive ? 'text-primary' : 'text-muted-foreground'}`} />
                        <h3 className="text-lg font-semibold mb-2">Upload Legal Document</h3>
                        <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                            Drag and drop your PDF or TXT file here, or click to browse. Text will be automatically extracted.
                        </p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
