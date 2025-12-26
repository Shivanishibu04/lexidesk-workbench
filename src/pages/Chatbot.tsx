import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Upload, Send, FileText, X, Bot, User } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { uploadDocument, sendChatMessage, ChatMessage } from '@/lib/api';
import { toast } from 'sonner';

interface Message extends ChatMessage {
  id: string;
  timestamp: Date;
  relevantPassages?: string[];
}

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; id: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Please upload a PDF file');
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadDocument(file);
      setUploadedFile({ name: result.filename, id: result.document_id });
      toast.success(`Document "${result.filename}" uploaded successfully`);
      
      // Add system message
      setMessages(prev => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          role: 'assistant',
          content: `I've processed the document "${result.filename}". You can now ask questions about its contents.`,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      toast.error('Failed to upload document');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    toast.info('Document removed');
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage(userMessage.content, uploadedFile?.id);
      
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.answer,
        timestamp: new Date(),
        relevantPassages: response.relevant_passages,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast.error('Failed to get response');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-2.5 rounded-lg bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20">
            <MessageSquare className="w-6 h-6 text-gold" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Legal Chatbot
            </h1>
            <p className="text-sm text-muted-foreground">
              RAG-powered document Q&A assistant
            </p>
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-4 gap-6 h-[calc(100vh-220px)]">
        {/* Sidebar - Document Upload */}
        <aside className="lg:col-span-1 card-academia p-4 flex flex-col">
          <h2 className="text-sm font-display font-semibold text-foreground mb-4">
            Document Context
          </h2>

          {/* Upload Zone */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="file-upload-zone mb-4 flex flex-col items-center justify-center gap-2 disabled:opacity-50"
          >
            {isUploading ? (
              <LoadingSpinner size="md" />
            ) : (
              <Upload className="w-8 h-8 text-muted-foreground" />
            )}
            <span className="text-sm text-muted-foreground">
              {isUploading ? 'Processing...' : 'Upload PDF'}
            </span>
          </button>

          {/* Uploaded File */}
          {uploadedFile && (
            <div className="p-3 bg-muted/30 rounded-lg border border-border/50 animate-fade-in">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm text-foreground truncate">
                    {uploadedFile.name}
                  </span>
                </div>
                <button
                  onClick={handleRemoveFile}
                  className="p-1 hover:bg-muted rounded transition-colors shrink-0"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
          )}

          <div className="mt-auto pt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              Upload a legal document (PDF) to enable context-aware Q&A. The chatbot will retrieve relevant passages to answer your questions.
            </p>
          </div>
        </aside>

        {/* Chat Area */}
        <section className="lg:col-span-3 card-academia flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto scrollbar-academia p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <Bot className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-display font-semibold text-foreground mb-2">
                  Start a Conversation
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Upload a legal document and ask questions about its contents, 
                  or simply ask general legal questions.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 animate-fade-in ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  
                  <div className={message.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'}>
                    <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                    
                    {/* Relevant Passages */}
                    {message.relevantPassages && message.relevantPassages.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/30">
                        <p className="text-xs text-muted-foreground mb-2 font-medium">
                          Relevant Passages:
                        </p>
                        {message.relevantPassages.map((passage, idx) => (
                          <div
                            key={idx}
                            className="p-2 bg-muted/30 rounded text-xs text-muted-foreground italic mb-1 last:mb-0"
                          >
                            "{passage}"
                          </div>
                        ))}
                      </div>
                    )}

                    <span className="block text-xs text-muted-foreground/50 mt-2">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-forest/10 border border-forest/20 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-forest-light" />
                    </div>
                  )}
                </div>
              ))
            )}
            
            {isLoading && (
              <div className="flex gap-3 animate-fade-in">
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="chat-bubble-assistant flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-border/50">
            <div className="flex gap-3">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a legal question..."
                rows={1}
                className="input-academia flex-1 resize-none text-sm"
                style={{ minHeight: '44px', maxHeight: '120px' }}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="btn-primary-academia px-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground/50 mt-2 text-center">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
