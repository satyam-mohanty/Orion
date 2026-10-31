'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { SourceDoc, SourceType } from '../lib/types';
import { 
  createSource, 
  deleteSource as apiDeleteSource, 
  updateSource as apiUpdateSource,
  extractWebsiteContent,
  extractYouTubeContent,
  extractFileContent,
  extractImageOcr
} from '../lib/api-client';
import { 
  Trash2, 
  Eye, 
  CheckSquare, 
  Square, 
  Plus, 
  Upload, 
  UploadCloud,
  Link as LinkIcon, 
  Youtube, 
  BookOpen, 
  Copy as CopyIcon, 
  PenTool, 
  X, 
  AlertCircle,
  AlertTriangle,
  RotateCw,
  PanelLeftClose,
  Search,
  Filter,
  FileText,
  FileCode,
  Image as ImageIcon,
  Download,
  Layers,
  Check
} from 'lucide-react';
import { NotificationBanner } from './NotificationBanner';

interface SourceManagerProps {
  sources: SourceDoc[];
  onUpdateSources: (sources: SourceDoc[]) => void;
  onViewSource: (source: SourceDoc) => void;
  activeNotebookId: string | null;
  isLoadingSources?: boolean;
  sourceError?: string | null;
  onRetryLoad?: () => void;
  onToggleCollapse?: () => void;
}

type ActiveInputMode = 'text' | 'link' | 'youtube' | 'book' | null;

export const SourceManager: React.FC<SourceManagerProps> = ({
  sources,
  onUpdateSources,
  onViewSource,
  activeNotebookId,
  isLoadingSources = false,
  sourceError = null,
  onRetryLoad,
  onToggleCollapse
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [activeInput, setActiveInput] = useState<ActiveInputMode>(null);
  const [rawTitle, setRawTitle] = useState('');
  const [rawContent, setRawContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState<string>('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  // Drag and drop state
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const dragCounter = useRef(0);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterType, setSelectedFilterType] = useState<'all' | 'pdf' | 'web' | 'youtube' | 'note' | 'book' | 'image' | 'doc'>('all');
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);
  const [confirmBatchDelete, setConfirmBatchDelete] = useState(false);

  // Dedicated file inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const bookInputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Reset deletion confirmations on notebook change or when target source removed
  useEffect(() => {
    setConfirmDeleteId(null);
    setDeletingId(null);
    setConfirmBatchDelete(false);
  }, [activeNotebookId]);

  useEffect(() => {
    if (confirmDeleteId && !sources.some(s => s.id === confirmDeleteId)) {
      setConfirmDeleteId(null);
    }
  }, [sources, confirmDeleteId]);

  // Keyboard shortcut: Escape cancels confirmations
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (confirmDeleteId) setConfirmDeleteId(null);
        if (confirmBatchDelete) setConfirmBatchDelete(false);
        if (isPopoverOpen) {
          setIsPopoverOpen(false);
          setActiveInput(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmDeleteId, confirmBatchDelete, isPopoverOpen]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsPopoverOpen(false);
        setActiveInput(null);
      }
    };
    if (isPopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPopoverOpen]);

  // Filter sources by search query and type
  const filteredSources = useMemo(() => {
    return sources.filter((s) => {
      const matchesSearch =
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.topics && s.topics.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

      if (!matchesSearch) return false;

      if (selectedFilterType === 'all') return true;
      if (selectedFilterType === 'pdf') return s.type === 'pdf';
      if (selectedFilterType === 'web') return s.type === 'url' || s.type === 'link';
      if (selectedFilterType === 'youtube') return s.type === 'youtube';
      if (selectedFilterType === 'note') return s.type === 'note' || s.type === 'txt';
      if (selectedFilterType === 'book') return s.type === 'epub';
      if (selectedFilterType === 'image') return s.type === 'image_ocr';
      if (selectedFilterType === 'doc') return s.type === 'docx' || s.type === 'md';
      return true;
    });
  }, [sources, searchQuery, selectedFilterType]);

  const selectedCount = useMemo(() => sources.filter((s) => s.isSelected).length, [sources]);

  const toggleSelectAll = async () => {
    const allSelected = sources.every((s) => s.isSelected);
    const newSelectedState = !allSelected;

    onUpdateSources(sources.map((s) => ({ ...s, isSelected: newSelectedState })));

    if (activeNotebookId) {
      for (const source of sources) {
        if (source.isSelected !== newSelectedState) {
          apiUpdateSource(activeNotebookId, source.id, { is_selected: newSelectedState }).catch((err) =>
            console.warn(`Failed to update selection for source ${source.id}:`, err)
          );
        }
      }
    }
  };

  const toggleSourceSelection = async (id: string) => {
    const target = sources.find((s) => s.id === id);
    if (!target) return;
    const newSelected = !target.isSelected;

    onUpdateSources(
      sources.map((s) => (s.id === id ? { ...s, isSelected: newSelected } : s))
    );

    if (activeNotebookId) {
      try {
        await apiUpdateSource(activeNotebookId, id, { is_selected: newSelected });
      } catch (err: any) {
        console.warn('Failed to persist selection state:', err);
      }
    }
  };

  const executeDeleteSource = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeNotebookId || deletingId === id) return;

    setDeletingId(id);
    setLocalError(null);
    try {
      await apiDeleteSource(activeNotebookId, id);
      onUpdateSources(sources.filter((s) => s.id !== id));
      setConfirmDeleteId(null);
    } catch (err: any) {
      console.error('Failed to delete source from backend:', err);
      setLocalError(err.message || 'Failed to delete source.');
    } finally {
      setDeletingId(null);
    }
  };

  // Batch delete selected sources
  const executeBatchDelete = async () => {
    if (!activeNotebookId || isBatchDeleting) return;
    const toDelete = sources.filter(s => s.isSelected);
    if (toDelete.length === 0) return;

    setIsBatchDeleting(true);
    setLocalError(null);
    try {
      for (const source of toDelete) {
        await apiDeleteSource(activeNotebookId, source.id).catch(err => console.warn(err));
      }
      onUpdateSources(sources.filter(s => !s.isSelected));
      setConfirmBatchDelete(false);
    } catch (err: any) {
      setLocalError(err.message || 'Error occurred while deleting selected sources.');
    } finally {
      setIsBatchDeleting(false);
    }
  };

  // Download a source document text
  const handleDownloadSource = (source: SourceDoc, e: React.MouseEvent) => {
    e.stopPropagation();
    const blob = new Blob([source.content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = source.title.endsWith('.md') || source.title.endsWith('.txt') 
      ? source.title 
      : `${source.title}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Process a list of files (from file dialog or drag & drop)
  const processFiles = async (files: FileList | File[], preferredType?: SourceType) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    if (!activeNotebookId) {
      setLocalError('Please create or select a notebook before adding documents.');
      return;
    }

    setIsUploading(true);
    setIsPopoverOpen(false);
    setActiveInput(null);
    setLocalError(null);
    const newSourcesList: SourceDoc[] = [];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      setUploadProgressText(`Processing ${i + 1} of ${fileArray.length}: ${file.name}...`);

      const fileExt = file.name.split('.').pop()?.toLowerCase();
      let type: SourceType = preferredType || 'txt';
      let extractedText = '';
      let extractedTitle = file.name;
      let extraMeta: Record<string, any> = {
        filename: file.name,
        file_extension: fileExt,
      };

      try {
        if (fileExt === 'pdf') {
          type = 'pdf';
          try {
            const { extractTextFromPdf } = await import('../lib/pdf-parser');
            const res = await extractTextFromPdf(file);
            extractedText = res.text;
          } catch {
            // Fallback to backend PDF parser
            const docRes = await extractFileContent(file);
            extractedText = docRes.content;
          }
        } else if (fileExt === 'docx' || fileExt === 'doc') {
          type = 'docx';
          setUploadProgressText(`Extracting Word document: ${file.name}...`);
          const res = await extractFileContent(file);
          extractedText = res.content;
          extractedTitle = res.title || file.name;
          extraMeta.topics = ['Word Document', 'DOCX'];
        } else if (fileExt === 'epub' || preferredType === 'epub') {
          type = 'epub';
          setUploadProgressText(`Extracting E-Book chapters: ${file.name}...`);
          const res = await extractFileContent(file);
          extractedText = res.content;
          extractedTitle = res.title || file.name;
          extraMeta.topics = ['E-Book', 'Play Books'];
        } else if (['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif'].includes(fileExt || '') || preferredType === 'image_ocr') {
          type = 'image_ocr';
          setUploadProgressText(`Running OCR on image ${i + 1}/${fileArray.length}: ${file.name}...`);
          try {
            const ocrRes = await extractImageOcr(file);
            extractedText = ocrRes.text;
            extraMeta.confidence = ocrRes.confidence;
            extraMeta.topics = ['Image OCR'];
          } catch (ocrErr: any) {
            console.warn('OCR error:', ocrErr);
            extractedText = `[Image Resource: ${file.name}]\nNo text layer detected via optical character recognition.`;
          }
        } else if (fileExt === 'md' || fileExt === 'markdown') {
          type = 'md';
          extractedText = await file.text();
          extraMeta.topics = ['Markdown'];
        } else if (['json', 'csv', 'tsv', 'log', 'txt'].includes(fileExt || '')) {
          type = 'txt';
          extractedText = await file.text();
          extraMeta.topics = [fileExt?.toUpperCase() || 'Text'];
        } else {
          // General text fallback
          type = 'txt';
          extractedText = await file.text();
        }

        if (!extractedText || !extractedText.trim()) {
          extractedText = `[Uploaded document: ${file.name}] Empty document.`;
        }

        const savedSource = await createSource(activeNotebookId, {
          title: extractedTitle,
          content: extractedText.trim(),
          source_type: type,
          summary: extractedText.slice(0, 160).replace(/\n+/g, ' ') + '...',
          metadata: extraMeta,
        });
        newSourcesList.push(savedSource);
      } catch (saveErr: any) {
        console.error('Failed to extract or save file:', saveErr);
        setLocalError(`Failed to import "${file.name}": ${saveErr.message || 'Extraction error'}`);
      }
    }

    if (newSourcesList.length > 0) {
      onUpdateSources([...newSourcesList, ...sources]);
    }

    setIsUploading(false);
    setUploadProgressText('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (bookInputRef.current) bookInputRef.current.value = '';
  };

  // Handle manual submissions (Copied text, YouTube URLs, Website URLs, Book text)
  const handleAddManualSource = async () => {
    if (!activeInput || !activeNotebookId) {
      if (!activeNotebookId) {
        setLocalError('Please create or select a notebook before adding sources.');
      }
      return;
    }

    setLocalError(null);
    setIsUploading(true);
    let newSourcesList: SourceDoc[] = [];

    try {
      if (activeInput === 'text') {
        if (!rawContent.trim()) {
          setIsUploading(false);
          return;
        }

        setUploadProgressText('Saving research note...');
        const titleToUse = rawTitle.trim() || rawContent.trim().split('\n')[0].slice(0, 40) || `Note ${sources.length + 1}`;
        const saved = await createSource(activeNotebookId, {
          title: titleToUse,
          content: rawContent.trim(),
          source_type: 'note',
          summary: rawContent.slice(0, 150).replace(/\n+/g, ' ') + '...',
          metadata: { topics: ['Manual Note'] },
        });
        newSourcesList.push(saved);
      } else if (activeInput === 'youtube') {
        const urls = rawContent
          .split(/[\n,]+/)
          .map((u) => u.trim())
          .filter((u) => u.length > 0);
        if (urls.length === 0) {
          setIsUploading(false);
          return;
        }

        for (let i = 0; i < urls.length; i++) {
          const url = urls[i];
          setUploadProgressText(`Extracting YouTube transcript & metadata (${i + 1}/${urls.length})...`);
          try {
            const ytData = await extractYouTubeContent(url);
            const saved = await createSource(activeNotebookId, {
              title: ytData.title || `YouTube Video`,
              content: ytData.content,
              source_type: 'youtube',
              summary: ytData.content.slice(0, 160).replace(/\n+/g, ' ') + '...',
              metadata: {
                url: ytData.url,
                channel: ytData.channel,
                video_id: ytData.video_id,
                topics: ['YouTube', 'Video'],
              },
            });
            newSourcesList.push(saved);
          } catch (ytErr: any) {
            console.error('YouTube extraction error:', ytErr);
            setLocalError(`YouTube import error: ${ytErr.message || 'Could not fetch video transcript'}`);
          }
        }
      } else if (activeInput === 'link') {
        const urls = rawContent
          .split(/[\n,]+/)
          .map((u) => u.trim())
          .filter((u) => u.length > 0);
        if (urls.length === 0) {
          setIsUploading(false);
          return;
        }

        for (let i = 0; i < urls.length; i++) {
          const url = urls[i];
          setUploadProgressText(`Scraping webpage article (${i + 1}/${urls.length})...`);
          try {
            const webData = await extractWebsiteContent(url);
            const saved = await createSource(activeNotebookId, {
              title: webData.title || `Web Resource`,
              content: webData.content,
              source_type: 'url',
              summary: webData.content.slice(0, 160).replace(/\n+/g, ' ') + '...',
              metadata: {
                url: webData.url,
                topics: ['Website', 'Article'],
              },
            });
            newSourcesList.push(saved);
          } catch (webErr: any) {
            console.error('Website scraping error:', webErr);
            setLocalError(`Website error (${url}): ${webErr.message || 'Could not scrape page content'}`);
          }
        }
      } else if (activeInput === 'book') {
        if (!rawContent.trim()) {
          setIsUploading(false);
          return;
        }

        setUploadProgressText('Importing book text...');
        const titleToUse = rawTitle.trim() || 'Play Books Excerpt';
        const saved = await createSource(activeNotebookId, {
          title: titleToUse,
          content: rawContent.trim(),
          source_type: 'epub',
          summary: rawContent.slice(0, 150).replace(/\n+/g, ' ') + '...',
          metadata: { topics: ['Play Books', 'E-Book'] },
        });
        newSourcesList.push(saved);
      }

      if (newSourcesList.length > 0) {
        onUpdateSources([...newSourcesList, ...sources]);
      }

      setRawTitle('');
      setRawContent('');
      setActiveInput(null);
      setIsPopoverOpen(false);
    } catch (err: any) {
      setLocalError(err.message || 'Failed to save source.');
    } finally {
      setIsUploading(false);
      setUploadProgressText('');
    }
  };

  const getTypeIcon = (type: SourceType) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-3.5 h-3.5 text-rose-500" />;
      case 'docx':
        return <FileText className="w-3.5 h-3.5 text-blue-500" />;
      case 'epub':
        return <BookOpen className="w-3.5 h-3.5 text-amber-500" />;
      case 'md':
        return <FileCode className="w-3.5 h-3.5 text-accent" />;
      case 'image_ocr':
        return <ImageIcon className="w-3.5 h-3.5 text-amber-500" />;
      case 'youtube':
        return <Youtube className="w-3.5 h-3.5 text-red-500" />;
      case 'url':
      case 'link':
        return <LinkIcon className="w-3.5 h-3.5 text-accent" />;
      case 'note':
        return <CopyIcon className="w-3.5 h-3.5 text-emerald-500" />;
      default:
        return <PenTool className="w-3.5 h-3.5 text-foregroundMuted" />;
    }
  };

  // Drag and Drop event handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      setIsDraggingOver(false);
      dragCounter.current = 0;
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    dragCounter.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(e.dataTransfer.files);
    }
  };

  return (
    <div 
      className="h-full flex flex-col bg-surface-panel select-none relative overflow-hidden"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Hidden File Inputs for Different Media */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => e.target.files && processFiles(e.target.files)}
        multiple
        accept=".pdf,.docx,.doc,.epub,.txt,.md,.markdown,.json,.csv,.log,.tsv,image/png,image/jpeg,image/jpg,image/webp,image/bmp"
        className="hidden"
      />
      <input
        type="file"
        ref={imageInputRef}
        onChange={(e) => e.target.files && processFiles(e.target.files, 'image_ocr')}
        multiple
        accept="image/png,image/jpeg,image/jpg,image/webp,image/bmp,image/gif"
        className="hidden"
      />
      <input
        type="file"
        ref={bookInputRef}
        onChange={(e) => e.target.files && processFiles(e.target.files, 'epub')}
        accept=".epub,.pdf,.txt,application/epub+zip"
        className="hidden"
      />

      {/* Full-panel Drag & Drop Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 bg-accent/15 backdrop-blur-xs border-2 border-dashed border-accent flex flex-col items-center justify-center p-6 text-center animate-fade-in pointer-events-none">
          <div className="p-4 rounded-2xl bg-surface-panel border border-accent/40 shadow-2xl flex flex-col items-center space-y-2 max-w-xs">
            <UploadCloud className="w-10 h-10 text-accent" />
            <h3 className="text-sm font-bold text-foreground">Drop documents here</h3>
            <p className="text-xs text-foregroundSubtle">
              PDF, Word (.docx), EPUB, Markdown, Text, or Images
            </p>
          </div>
        </div>
      )}

      {/* Sidebar Header */}
      <div className="p-4 space-y-3 border-b border-surface-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight text-inherit opacity-90 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-accent" />
              Sources
            </span>
            {sources.length > 0 && (
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-surface-hover border border-surface-border text-foregroundSubtle">
                {sources.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {sources.length > 1 && (
              <button
                onClick={toggleSelectAll}
                className="text-xs text-foregroundSubtle hover:text-foreground transition-colors"
                title={sources.every((s) => s.isSelected) ? 'Deselect all' : 'Select all'}
              >
                {sources.every((s) => s.isSelected) ? 'Deselect all' : 'Select all'}
              </button>
            )}

            <button
              onClick={() => {
                setIsPopoverOpen(!isPopoverOpen);
                setActiveInput(null);
              }}
              disabled={isUploading || !activeNotebookId}
              title={
                !activeNotebookId
                  ? 'Select a notebook first'
                  : 'Add documents, links, or media'
              }
              className="p-1.5 rounded-full bg-accent/10 hover:bg-accent/20 border border-accent/30 transition-all text-accent disabled:opacity-30 disabled:cursor-not-allowed shadow-xs"
            >
              <Plus className="w-4 h-4" />
            </button>

            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="hidden lg:flex p-1.5 rounded-lg hover:bg-surface-hover text-inherit opacity-60 hover:opacity-100 transition-colors"
                title="Collapse Sources panel"
                aria-label="Collapse Sources panel"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        {sources.length > 0 && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-foregroundMuted" />
            <input
              type="text"
              placeholder="Filter sources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-base border border-surface-border/70 rounded-lg pl-8 pr-7 py-1 text-xs focus:outline-none focus:border-accent text-foreground placeholder:text-foregroundMuted"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-surface-hover text-foregroundMuted"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Filter Pills */}
        {sources.length > 2 && (
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar text-[10px]">
            {(['all', 'pdf', 'doc', 'web', 'youtube', 'note', 'book', 'image'] as const).map((ft) => (
              <button
                key={ft}
                onClick={() => setSelectedFilterType(ft)}
                className={`px-2 py-0.5 rounded-md font-medium capitalize transition-colors shrink-0 ${
                  selectedFilterType === ft
                    ? 'bg-accent/15 text-accent border border-accent/30'
                    : 'bg-surface-hover text-foregroundSubtle hover:text-foreground border border-surface-border/50'
                }`}
              >
                {ft === 'all' ? 'All' : ft.toUpperCase()}
              </button>
            ))}
          </div>
        )}

        {/* Batch selection summary & actions */}
        {selectedCount > 0 && sources.length > 1 && (
          <div className="flex items-center justify-between text-xs px-1 text-foregroundSubtle">
            <span>{selectedCount} of {sources.length} active</span>
            {confirmBatchDelete ? (
              <div className="flex items-center gap-1.5 animate-fade-in">
                <span className="text-[11px] text-rose-500 font-medium">Delete {selectedCount}?</span>
                <button
                  onClick={executeBatchDelete}
                  disabled={isBatchDeleting}
                  className="px-2 py-0.5 rounded bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-medium"
                >
                  {isBatchDeleting ? <RotateCw className="w-2.5 h-2.5 animate-spin" /> : 'Yes'}
                </button>
                <button
                  onClick={() => setConfirmBatchDelete(false)}
                  className="px-2 py-0.5 rounded bg-surface-base hover:bg-surface-hover text-[10px]"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmBatchDelete(true)}
                className="text-[11px] text-rose-400 hover:text-rose-500 flex items-center gap-1"
                title="Delete selected sources"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete selected</span>
              </button>
            )}
          </div>
        )}

        {/* Error Notice Banner */}
        {(localError || sourceError) && (
          <NotificationBanner
            type="error"
            message={localError || sourceError || ''}
            onDismiss={localError ? () => setLocalError(null) : undefined}
            action={!localError && onRetryLoad ? { label: 'Retry', onClick: onRetryLoad } : undefined}
          />
        )}
      </div>

      {/* Add Sources Popover (All 6 Options from Screenshot) */}
      {isPopoverOpen && (
        <div
          ref={popoverRef}
          className="absolute top-14 left-4 right-4 z-50 bg-surface-panel border border-surface-borderHover shadow-2xl rounded-2xl p-2.5 animate-fade-in flex flex-col"
        >
          {!activeInput ? (
            <div className="grid grid-cols-2 gap-1.5">
              {/* 1. Upload files */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-surface-hover text-xs text-foreground font-medium transition-colors text-left group"
              >
                <Upload className="w-4 h-4 text-accent shrink-0 group-hover:scale-105 transition-transform" />
                <span>Upload files</span>
              </button>

              {/* 2. Copied text */}
              <button
                onClick={() => {
                  setActiveInput('text');
                  setRawTitle('');
                  setRawContent('');
                }}
                className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-surface-hover text-xs text-foreground font-medium transition-colors text-left group"
              >
                <CopyIcon className="w-4 h-4 text-blue-500 shrink-0 group-hover:scale-105 transition-transform" />
                <span>Copied text</span>
              </button>

              {/* 3. YouTube */}
              <button
                onClick={() => {
                  setActiveInput('youtube');
                  setRawContent('');
                }}
                className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-surface-hover text-xs text-foreground font-medium transition-colors text-left group"
              >
                <Youtube className="w-4 h-4 text-red-500 shrink-0 group-hover:scale-105 transition-transform" />
                <span>YouTube</span>
              </button>

              {/* 4. Websites */}
              <button
                onClick={() => {
                  setActiveInput('link');
                  setRawContent('');
                }}
                className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-surface-hover text-xs text-foreground font-medium transition-colors text-left group"
              >
                <LinkIcon className="w-4 h-4 text-emerald-500 shrink-0 group-hover:scale-105 transition-transform" />
                <span>Websites</span>
              </button>

              {/* 5. Images / OCR */}
              <button
                onClick={() => imageInputRef.current?.click()}
                className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-surface-hover text-xs text-foreground font-medium transition-colors text-left group"
              >
                <PenTool className="w-4 h-4 text-amber-500 shrink-0 group-hover:scale-105 transition-transform" />
                <span>Images / OCR</span>
              </button>

              {/* 6. Play Books */}
              <button
                onClick={() => {
                  setActiveInput('book');
                  setRawTitle('');
                  setRawContent('');
                }}
                className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-surface-hover text-xs text-foreground font-medium transition-colors text-left group"
                title="Import EPUB e-books or book chapters"
              >
                <BookOpen className="w-4 h-4 text-purple-400 shrink-0 group-hover:scale-105 transition-transform" />
                <span>Play Books</span>
              </button>
            </div>
          ) : (
            <div className="p-2 space-y-3 animate-fade-in text-xs">
              <div className="flex items-center justify-between pb-1 border-b border-surface-border/50">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  {activeInput === 'text' && <CopyIcon className="w-3.5 h-3.5 text-blue-500" />}
                  {activeInput === 'youtube' && <Youtube className="w-3.5 h-3.5 text-red-500" />}
                  {activeInput === 'link' && <LinkIcon className="w-3.5 h-3.5 text-emerald-500" />}
                  {activeInput === 'book' && <BookOpen className="w-3.5 h-3.5 text-purple-400" />}
                  <span>
                    {activeInput === 'text' && 'Add Copied Text / Note'}
                    {activeInput === 'youtube' && 'Import YouTube Transcript'}
                    {activeInput === 'link' && 'Scrape Website Article'}
                    {activeInput === 'book' && 'Import E-Book / Play Books'}
                  </span>
                </span>
                <button
                  onClick={() => setActiveInput(null)}
                  className="p-1 rounded hover:bg-surface-hover text-foregroundMuted hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Input for Title (for text notes & books) */}
              {(activeInput === 'text' || activeInput === 'book') && (
                <div>
                  <input
                    type="text"
                    placeholder={activeInput === 'text' ? 'Document or note title (optional)...' : 'Book title or author (optional)...'}
                    value={rawTitle}
                    onChange={(e) => setRawTitle(e.target.value)}
                    className="w-full bg-surface-base border border-surface-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-accent text-foreground"
                  />
                </div>
              )}

              {/* Quick file trigger for Play Books */}
              {activeInput === 'book' && (
                <div className="flex items-center justify-between p-2 rounded-xl bg-surface-base border border-surface-border text-foregroundSubtle">
                  <span className="text-[11px]">Have an .epub book file?</span>
                  <button
                    type="button"
                    onClick={() => bookInputRef.current?.click()}
                    className="px-2.5 py-1 rounded-lg bg-surface-panel hover:bg-surface-hover border border-surface-border text-accent font-medium text-xs transition-colors"
                  >
                    Select EPUB File
                  </button>
                </div>
              )}

              {/* Textarea for content / URLs */}
              <div>
                <textarea
                  placeholder={
                    activeInput === 'text'
                      ? 'Paste your research notes, quotes, or synthesis text here...'
                      : activeInput === 'youtube'
                      ? 'Paste YouTube URL (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...)'
                      : activeInput === 'link'
                      ? 'Paste webpage URL(s) to scrape (e.g. https://en.wikipedia.org/wiki/...)'
                      : 'Paste book chapter text, excerpts, or reading notes here...'
                  }
                  value={rawContent}
                  onChange={(e) => setRawContent(e.target.value)}
                  rows={4}
                  className="w-full bg-surface-base border border-surface-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent resize-none text-foreground"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveInput(null)}
                  className="px-3 py-1.5 rounded-lg text-foregroundMuted hover:bg-surface-hover text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddManualSource}
                  disabled={!rawContent.trim() || isUploading}
                  className="btn-primary text-xs py-1.5 px-4 shadow-xs"
                >
                  {isUploading ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Importing...</span>
                    </>
                  ) : (
                    <span>
                      {activeInput === 'youtube' ? 'Extract Transcript' : activeInput === 'link' ? 'Scrape Webpage' : 'Save to Notebook'}
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sources List / Drag Drop Trigger Area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {/* Drag & Drop Quick Target Area */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border border-dashed border-surface-border/80 hover:border-accent/60 rounded-xl p-3 text-center transition-all cursor-pointer bg-surface-card/40 hover:bg-accentSubtle group flex items-center justify-center gap-2.5"
          title="Click to browse or drag & drop files here"
        >
          <UploadCloud className="w-4 h-4 text-foregroundMuted group-hover:text-accent transition-colors" />
          <span className="text-[11px] text-foregroundSubtle group-hover:text-foreground transition-colors">
            Drop files or <span className="text-accent underline underline-offset-2">browse</span>
          </span>
        </div>

        {/* Upload & Progress Spinner */}
        {isUploading && (
          <div className="p-3 rounded-xl border border-accent/30 bg-accentSubtle text-xs text-center text-accent flex items-center justify-center gap-2 shadow-xs">
            <RotateCw className="w-3.5 h-3.5 animate-spin text-accent" />
            <span>{uploadProgressText || 'Processing and persisting document...'}</span>
          </div>
        )}

        {/* Loading Notebook Sources State */}
        {isLoadingSources && (
          <div className="p-6 text-center text-xs opacity-50 flex flex-col items-center justify-center gap-2">
            <RotateCw className="w-4 h-4 animate-spin text-accent" />
            <span>Loading notebook sources...</span>
          </div>
        )}

        {/* Empty State */}
        {!isLoadingSources && sources.length === 0 && !isUploading && (
          <div className="h-48 flex flex-col items-center justify-center p-6 text-center opacity-60">
            <Layers className="w-7 h-7 text-foregroundMuted mb-2 opacity-50" />
            <div className="text-xs font-semibold mb-1">No sources added yet</div>
            <p className="text-[11px] leading-relaxed max-w-[220px] text-foregroundMuted">
              Click + above to add PDFs, Word files, YouTube transcripts, websites, images, or notes.
            </p>
          </div>
        )}

        {/* Sources Items */}
        {!isLoadingSources &&
          filteredSources.map((source) => (
            <div
              key={source.id}
              onClick={() => toggleSourceSelection(source.id)}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                source.isSelected
                  ? 'bg-surface-card border-surface-borderHover shadow-card'
                  : 'bg-surface-base/50 border-surface-border/60 opacity-60 hover:opacity-100 hover:bg-surface-hover'
              }`}
            >
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSourceSelection(source.id);
                    }}
                    className="p-0.5 rounded text-foregroundMuted hover:text-foreground shrink-0"
                  >
                    {source.isSelected ? (
                      <CheckSquare className="w-3.5 h-3.5 text-accent" />
                    ) : (
                      <Square className="w-3.5 h-3.5" />
                    )}
                  </span>

                  <span className="shrink-0">{getTypeIcon(source.type)}</span>

                  <span className="text-xs font-semibold truncate text-foreground leading-tight">
                    {source.title}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onViewSource(source)}
                    className="p-1 rounded hover:bg-surface-hover text-foregroundMuted hover:text-foreground"
                    title="View Source Text"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => handleDownloadSource(source, e)}
                    className="p-1 rounded hover:bg-surface-hover text-foregroundMuted hover:text-foreground"
                    title="Download Source Document"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  {confirmDeleteId === source.id ? (
                    <div className="flex items-center gap-1 animate-fade-in">
                      <button
                        onClick={(e) => executeDeleteSource(source.id, e)}
                        disabled={deletingId === source.id}
                        className="px-1.5 py-0.5 rounded bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-medium"
                      >
                        {deletingId === source.id ? <RotateCw className="w-2.5 h-2.5 animate-spin" /> : 'Delete'}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-1.5 py-0.5 rounded bg-surface-panel hover:bg-surface-hover text-[10px]"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(source.id)}
                      className="p-1 rounded hover:bg-surface-hover text-foregroundMuted hover:text-rose-500"
                      title="Delete Source"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Source Snippet / Summary */}
              {source.summary && (
                <p className="text-[11px] text-foregroundMuted line-clamp-2 leading-relaxed pl-5">
                  {source.summary}
                </p>
              )}

              {/* Metadata Badges */}
              <div className="flex items-center gap-2 pl-5 pt-0.5 text-[10px] text-foregroundSubtle font-mono">
                <span>{source.wordCount} words</span>
                {source.metadata?.channel && (
                  <>
                    <span>•</span>
                    <span className="truncate max-w-[120px]">{source.metadata.channel}</span>
                  </>
                )}
                {source.metadata?.url && (
                  <>
                    <span>•</span>
                    <a
                      href={source.metadata.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="hover:text-accent underline truncate max-w-[140px]"
                    >
                      Link
                    </a>
                  </>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};
