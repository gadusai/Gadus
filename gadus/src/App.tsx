import { useEffect, useRef, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bot,
  Camera,
  Check,
  ChevronDown,
  ChevronRight,
  Code2,
  ChartNoAxesCombined,
  Clock3,
  Command,
  Copy,
  Download,
  ExternalLink,
  FileText,
  FileUp,
  Film,
  Globe2,
  ImagePlus,
  Image as ImageIcon,
  Layers3,
  LayoutDashboard,
  LockKeyhole,
  Megaphone,
  Menu,
  Mic,
  MicOff,
  Microscope,
  MessageSquare,
  Paperclip,
  PanelLeftClose,
  PanelLeftOpen,
  PenLine,
  Play,
  Plus,
  RefreshCcw,
  Save,
  Search,
  Send,
  Share2,
  Settings,
  Sparkles,
  Star,
  Sun,
  Target,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  UserRound,
  Video,
  X,
  WandSparkles,
  Zap,
} from 'lucide-react';
import {
  getListGadusConversationsQueryKey,
  getListGadusMessagesQueryKey,
  useCreateGadusConversation,
  useCreateGadusMessage,
  useGetGadusSummary,
  useListGadusConversations,
  useListGadusMessages,
  useListGadusModes,
  useListGadusPrompts,
  useListGadusStudioAssets,
} from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();

type View = 'dashboard' | 'chat' | 'prompts' | 'studio' | 'image-studio' | 'video-studio' | 'analytics' | 'profile' | 'settings';

const navItems: { id: View; label: string; icon: typeof LayoutDashboard; meta?: string }[] = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'chat', label: 'Conversations', icon: MessageSquare },
  { id: 'prompts', label: 'Prompt library', icon: Sparkles },
  { id: 'studio', label: 'Studio', icon: Layers3, meta: 'New' },
  { id: 'image-studio', label: 'Image Studio', icon: ImageIcon },
  { id: 'video-studio', label: 'Video Studio', icon: Film },
  { id: 'analytics', label: 'Your rhythm', icon: BarChart3 },
];

const fallbackModes = [
  { id: 'focus', name: 'Focus', description: 'Clear, direct thinking', icon: '◎', accent: '#4bf2a8' },
  { id: 'research', name: 'Research', description: 'Explore with receipts', icon: '⌕', accent: '#80b9ff' },
  { id: 'create', name: 'Create', description: 'Turn sparks into work', icon: '✦', accent: '#e8bb78' },
];

const modeIcons = {
  sparkles: Sparkles,
  microscope: Microscope,
  'pen-line': PenLine,
  megaphone: Megaphone,
  send: Send,
  'wand-sparkles': WandSparkles,
  'share-2': Share2,
  'chart-no-axes-combined': ChartNoAxesCombined,
  'code-2': Code2,
  'bar-chart-3': BarChart3,
  sun: Sun,
} as const;

function Mark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3" data-testid="brand-gadus">
      <div className={`mark-glow pulse-mark relative flex shrink-0 items-center justify-center rounded-full bg-[#82f6c0] ${compact ? 'h-8 w-8' : 'h-9 w-9'}`}>
        <span className="absolute h-4 w-4 rounded-full border-[1.5px] border-[#082218]" />
        <span className="absolute h-1.5 w-1.5 rounded-full bg-[#082218]" />
      </div>
      {!compact && <div><div className="font-display text-[19px] font-semibold tracking-[-.04em]">Gadus</div><div className="flex items-center gap-1 font-mono-app text-[8px] uppercase tracking-[.16em] text-emerald-200/45"><span>Private intelligence</span><span title="Ultra fast responses powered by Groq" aria-label="Ultra fast responses powered by Groq" className="text-emerald-300"><Zap size={11} /></span></div></div>}
    </div>
  );
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-emerald-50/[.06] ${className}`} />;
}

function DataState({ loading, error, empty, children, retry }: { loading?: boolean; error?: boolean; empty?: boolean; children: ReactNode; retry?: () => void }) {
  if (loading) return <div className="space-y-3">{[1, 2, 3].map((n) => <Skeleton key={n} className="h-16 w-full" />)}</div>;
  if (error) return <div className="rounded-2xl border border-rose-300/15 bg-rose-400/[.05] p-6 text-sm text-rose-100"><div className="mb-2 font-semibold">This view is taking a beat.</div><p className="mb-4 text-rose-100/60">Gadus could not reach your workspace data.</p>{retry && <button onClick={retry} className="rounded-lg border border-rose-200/20 px-3 py-2 text-xs font-semibold hover:bg-rose-100/10" data-testid="button-retry">Try again</button>}</div>;
  if (empty) return <div className="rounded-2xl border border-dashed border-emerald-100/15 bg-emerald-50/[.02] p-10 text-center"><div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-300/10 text-emerald-200"><Sparkles size={18} /></div><div className="font-semibold">A quiet space, ready for a thought.</div><p className="mt-2 text-sm text-emerald-100/45">Start a conversation and make this place yours.</p></div>;
  return children;
}

function Sidebar({ view, setView, collapsed, setCollapsed, mobileOpen, setMobileOpen, summary, onNew }: { view: View; setView: (v: View) => void; collapsed: boolean; setCollapsed: (v: boolean) => void; mobileOpen: boolean; setMobileOpen: (v: boolean) => void; summary?: { userName?: string }; onNew: () => void }) {
  return (
    <>
      {mobileOpen && <button aria-label="Close menu" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-30 bg-black/60 md:hidden" data-testid="button-close-menu" />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-emerald-100/[.09] bg-[#0b110f]/95 px-4 py-5 backdrop-blur-xl transition-transform duration-300 md:translate-x-0 ${collapsed ? 'md:w-[76px]' : ''} ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className={`mb-8 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}><Mark compact={collapsed} />{!collapsed && <button onClick={() => setCollapsed(true)} className="rounded-lg p-2 text-emerald-100/35 hover:bg-emerald-100/10 hover:text-emerald-100" data-testid="button-collapse-sidebar"><PanelLeftClose size={16} /></button>}</div>
        <button onClick={onNew} className={`mb-7 flex h-11 items-center gap-3 rounded-xl bg-emerald-300 px-3.5 text-sm font-bold text-[#092118] shadow-[0_10px_24px_rgba(54,230,153,.13)] transition hover:bg-emerald-200 active:scale-[.98] ${collapsed ? 'justify-center px-0' : ''}`} data-testid="button-new-conversation"><Plus size={17} />{!collapsed && <span>New conversation</span>}</button>
        <div className="mb-3 px-2 font-mono-app text-[9px] uppercase tracking-[.22em] text-emerald-100/30">{!collapsed && 'Workspace'}</div>
        <nav className="space-y-1">
          {navItems.map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => { setView(item.id); setMobileOpen(false); }} className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold transition ${view === item.id ? 'bg-emerald-300/[.11] text-emerald-100' : 'text-emerald-100/48 hover:bg-emerald-100/[.06] hover:text-emerald-50'} ${collapsed ? 'justify-center px-0' : ''}`} data-testid={`nav-${item.id}`}><Icon size={17} strokeWidth={view === item.id ? 2.2 : 1.7} /><span className={collapsed ? 'hidden' : 'flex-1'}>{item.label}</span>{!collapsed && item.meta && <span className="rounded-full bg-emerald-300/15 px-1.5 py-0.5 font-mono-app text-[8px] uppercase text-emerald-200">{item.meta}</span>}</button>; })}
        </nav>
        <div className="my-6 h-px bg-emerald-100/[.08]" />
        <div className="mb-3 px-2 font-mono-app text-[9px] uppercase tracking-[.22em] text-emerald-100/30">{!collapsed && 'Account'}</div>
        <button onClick={() => { setView('profile'); setMobileOpen(false); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold ${view === 'profile' ? 'bg-emerald-300/[.11] text-emerald-100' : 'text-emerald-100/48 hover:bg-emerald-100/[.06] hover:text-emerald-50'} ${collapsed ? 'justify-center px-0' : ''}`} data-testid="nav-profile"><UserRound size={17} /><span className={collapsed ? 'hidden' : ''}>Profile</span></button>
        <button onClick={() => { setView('settings'); setMobileOpen(false); }} className={`mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold ${view === 'settings' ? 'bg-emerald-300/[.11] text-emerald-100' : 'text-emerald-100/48 hover:bg-emerald-100/[.06] hover:text-emerald-50'} ${collapsed ? 'justify-center px-0' : ''}`} data-testid="nav-settings"><Settings size={17} /><span className={collapsed ? 'hidden' : ''}>Settings</span></button>
        <div className="mt-auto rounded-2xl border border-emerald-100/[.09] bg-emerald-200/[.035] p-3.5">
          {!collapsed ? <><div className="mb-2 flex items-center justify-between"><span className="font-mono-app text-[9px] uppercase tracking-[.18em] text-emerald-100/35">Today’s signal</span><span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_#56e6a6]" /></div><p className="text-[12px] leading-5 text-emerald-100/60">{summary?.userName ? `Good to have you here, ${summary.userName}.` : 'Your private thinking space is ready.'}</p></> : <div className="flex justify-center"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /></div>}
        </div>
      </aside>
      {collapsed && <button onClick={() => setCollapsed(false)} className="fixed left-[88px] top-6 z-30 hidden rounded-lg border border-emerald-100/10 bg-[#101a16] p-2 text-emerald-100/50 hover:text-emerald-100 md:block" data-testid="button-expand-sidebar"><PanelLeftOpen size={16} /></button>}
    </>
  );
}

function Topbar({ onMenu, view, onSearch }: { onMenu: () => void; view: View; onSearch: () => void }) {
  const label = navItems.find((item) => item.id === view)?.label ?? (view === 'profile' ? 'Profile' : 'Settings');
  return <header className="flex h-[72px] items-center justify-between border-b border-emerald-100/[.08] px-5 md:px-10"><div className="flex items-center gap-3"><button onClick={onMenu} className="rounded-lg p-2 text-emerald-100/55 hover:bg-emerald-100/10 md:hidden" data-testid="button-open-menu"><Menu size={19} /></button><span className="font-mono-app text-[10px] uppercase tracking-[.2em] text-emerald-100/35">{label}</span></div><div className="flex items-center gap-2"><button onClick={onSearch} className="hidden items-center gap-3 rounded-lg border border-emerald-100/10 bg-emerald-100/[.035] px-3 py-2 text-[11px] text-emerald-100/35 transition hover:border-emerald-200/20 hover:text-emerald-100/60 sm:flex" data-testid="button-search"><Search size={14} /><span>Search your workspace</span><kbd className="ml-2 rounded border border-emerald-100/10 px-1.5 py-0.5 font-mono-app text-[9px]">⌘ K</kbd></button><button onClick={onSearch} className="rounded-lg p-2 text-emerald-100/50 hover:bg-emerald-100/10 sm:hidden" data-testid="button-search-mobile"><Search size={18} /></button><div className="ml-2 flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200/20 bg-emerald-300/10 font-mono-app text-[10px] text-emerald-200">AL</div></div></header>;
}

type StreamDetail = {
  conversationId: number;
  type: 'started' | 'searching' | 'sources' | 'token' | 'done' | 'error' | 'stopped';
  content?: string;
  message?: string;
  sources?: Array<{ title: string; url: string }>;
};

const streamEvents = new EventTarget();
const activeStreams = new Map<number, AbortController>();
const streamedText = new Map<number, string>();
const noticeEvents = new EventTarget();

type NoticeDetail = { message: string; tone?: 'success' | 'error' | 'info' };

function notify(message: string, tone: NoticeDetail['tone'] = 'info') {
  noticeEvents.dispatchEvent(new CustomEvent<NoticeDetail>('gadus-notice', { detail: { message, tone } }));
}

async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { message?: string };
    throw new Error(body.message || 'Gadus could not complete that action.');
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function downloadText(filename: string, content: string, type = 'text/plain') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function emitStream(detail: StreamDetail) {
  streamEvents.dispatchEvent(new CustomEvent<StreamDetail>('gadus-stream', { detail }));
}

async function streamConversation(conversationId: number, modeId: string) {
  const controller = new AbortController();
  activeStreams.set(conversationId, controller);
  streamedText.set(conversationId, '');
  emitStream({ conversationId, type: 'started' });

  try {
    const response = await fetch('/api/gadus/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, modeId }),
      signal: controller.signal,
    });

    if (!response.ok || !response.body) {
      emitStream({
        conversationId,
        type: 'error',
        message: 'Gadus is having a quick rest, please try your message again.',
      });
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finished = false;

    const processBlock = (block: string) => {
      const data = block.split('\n').find((line) => line.startsWith('data: '))?.slice(6);
      if (!data) return;
      try {
        const payload = JSON.parse(data) as { content?: string; message?: string; sources?: Array<{ title: string; url: string }> };
        if (block.includes('event: searching')) emitStream({ conversationId, type: 'searching' });
        if (block.includes('event: sources')) emitStream({ conversationId, type: 'sources', sources: payload.sources ?? [] });
        if (payload.content) {
          const content = `${streamedText.get(conversationId) ?? ''}${payload.content}`;
          streamedText.set(conversationId, content);
          emitStream({ conversationId, type: 'token', content: payload.content });
        }
        if (payload.message) {
          emitStream({ conversationId, type: 'error', message: payload.message });
        }
        if (block.includes('event: done')) {
          finished = true;
          emitStream({ conversationId, type: 'done' });
        }
        if (block.includes('event: error')) {
          emitStream({ conversationId, type: 'error', message: payload.message });
        }
      } catch {
        emitStream({
          conversationId,
          type: 'error',
          message: 'Gadus is having a quick rest, please try your message again.',
        });
      }
    };

    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
      const blocks = buffer.split('\n\n');
      buffer = blocks.pop() ?? '';
      blocks.forEach(processBlock);
      if (done) break;
    }
    if (buffer.trim()) processBlock(buffer);
    if (!finished && !controller.signal.aborted) {
      emitStream({
        conversationId,
        type: 'error',
        message: 'Gadus is having a quick rest, please try your message again.',
      });
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      emitStream({ conversationId, type: 'stopped' });
    } else {
      emitStream({
        conversationId,
        type: 'error',
        message: 'Gadus is having a quick rest, please try your message again.',
      });
    }
  } finally {
    activeStreams.delete(conversationId);
    if (controller.signal.aborted) streamedText.delete(conversationId);
  }
}

function stopConversationStream(conversationId: number) {
  activeStreams.get(conversationId)?.abort();
}

function Composer({ mode, modeOptions = [], onModeChange, onSent, selectedConversationId, setSelectedConversationId, setView }: { mode?: { id: string; name: string; accent: string }; modeOptions?: Array<{ id: string; name: string; accent: string }>; onModeChange?: (mode: { id: string; name: string; accent: string }) => void; onSent: (text: string) => void; selectedConversationId?: number; setSelectedConversationId: (id: number) => void; setView: (v: View) => void }) {
  const [text, setText] = useState('');
  const [isStreaming, setIsStreaming] = useState(() => Boolean(selectedConversationId && activeStreams.has(selectedConversationId)));
  const [recording, setRecording] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const createConversation = useCreateGadusConversation();
  const createMessage = useCreateGadusMessage();
  const qc = useQueryClient();
  useEffect(() => {
    const onStream = (event: Event) => {
      const detail = (event as CustomEvent<StreamDetail>).detail;
      if (!selectedConversationId || detail.conversationId !== selectedConversationId) return;
      setIsStreaming(detail.type === 'started' || detail.type === 'token');
    };
    streamEvents.addEventListener('gadus-stream', onStream);
    return () => streamEvents.removeEventListener('gadus-stream', onStream);
  }, [selectedConversationId]);
  useEffect(() => {
    if (!cameraOpen) return;
    let stream: MediaStream | undefined;
    void navigator.mediaDevices?.getUserMedia({ video: true }).then((nextStream) => {
      stream = nextStream;
      if (videoRef.current) videoRef.current.srcObject = nextStream;
    }).catch(() => {
      notify('Camera access was not available in this browser.', 'error');
      setCameraOpen(false);
    });
    return () => stream?.getTracks().forEach((track) => track.stop());
  }, [cameraOpen]);
  const submit = () => {
    const content = text.trim();
    if (isStreaming && selectedConversationId) {
      stopConversationStream(selectedConversationId);
      return;
    }
    if (!content || createConversation.isPending || createMessage.isPending) return;
    const startResponse = (conversationId: number) => {
      setSelectedConversationId(conversationId);
      setText('');
      onSent(content);
      setView('chat');
      void streamConversation(conversationId, mode?.id ?? 'general');
    };
    if (selectedConversationId) {
      createMessage.mutate({ conversationId: selectedConversationId, data: { role: 'user', content } }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getListGadusMessagesQueryKey(selectedConversationId) }); qc.invalidateQueries({ queryKey: getListGadusConversationsQueryKey() }); startResponse(selectedConversationId); } });
    } else {
      createConversation.mutate({ data: { modeId: mode?.id ?? 'general', title: content.slice(0, 52) } }, { onSuccess: (conversation) => { createMessage.mutate({ conversationId: conversation.id, data: { role: 'user', content } }, { onSuccess: () => startResponse(conversation.id) }); } });
    }
  };
  const toggleVoice = () => {
    const speechWindow = window as Window & { SpeechRecognition?: new () => any; webkitSpeechRecognition?: new () => any };
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      notify('Voice input is not supported in this browser.', 'error');
      return;
    }
    if (recording) {
      setRecording(false);
      return;
    }
    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event: any) => setText((current) => `${current}${current ? ' ' : ''}${event.results[0][0].transcript}`);
    recognition.onerror = () => notify('Gadus could not hear that recording.', 'error');
    recognition.onend = () => setRecording(false);
    recognition.start();
    setRecording(true);
  };
  const cycleMode = () => {
    if (!modeOptions.length || !onModeChange) {
      notify('Choose a mode from the sidebar to start a focused thread.');
      return;
    }
    const next = modeOptions[(modeOptions.findIndex((item) => item.id === mode?.id) + 1) % modeOptions.length];
    onModeChange(next);
  };
  return <><div className="glass rounded-2xl p-2 transition focus-within:border-emerald-300/35 focus-within:shadow-[0_0_0_3px_rgba(67,233,159,.05)]"><textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(); }} placeholder={isStreaming ? 'Gadus is thinking…' : 'What are you thinking about?'} disabled={isStreaming} className="min-h-[78px] w-full resize-none bg-transparent px-3 py-2 text-[14px] leading-6 text-emerald-50 outline-none placeholder:text-emerald-100/30 disabled:opacity-60" data-testid="input-composer" /><div className="flex items-center justify-between px-2 pb-1"><div className="flex items-center gap-1"><input ref={fileInputRef} type="file" className="hidden" accept="image/*,.pdf,.txt,.csv,.doc,.docx" onChange={(event) => { const file = event.target.files?.[0]; if (file) { setText((current) => `${current}${current ? '\n' : ''}[Attached file: ${file.name}]`); notify(`${file.name} attached.`, 'success'); } event.target.value = ''; }} /><button onClick={() => fileInputRef.current?.click()} className="rounded-lg p-2 text-emerald-100/35 hover:bg-emerald-100/10 hover:text-emerald-100" title="Attach a file" data-testid="button-attach"><Paperclip size={16} /></button><button onClick={() => setCameraOpen(true)} className="rounded-lg p-2 text-emerald-100/35 hover:bg-emerald-100/10 hover:text-emerald-100" title="Open camera" data-testid="button-camera"><Camera size={16} /></button><button onClick={toggleVoice} className={`rounded-lg p-2 ${recording ? 'bg-rose-400/15 text-rose-200' : 'text-emerald-100/35 hover:bg-emerald-100/10 hover:text-emerald-100'}`} title={recording ? 'Stop recording' : 'Voice input'} data-testid="button-microphone">{recording ? <MicOff size={16} /> : <Mic size={16} />}</button><button onClick={() => setView('prompts')} className="rounded-lg p-2 text-emerald-100/35 hover:bg-emerald-100/10 hover:text-emerald-100" title="Browse prompts" data-testid="button-browse-prompts"><Sparkles size={16} /></button><span className="ml-1 hidden font-mono-app text-[9px] text-emerald-100/25 sm:block">⌘ ↵ to send</span></div><div className="flex items-center gap-2"><button onClick={cycleMode} className="flex items-center gap-2 rounded-lg border border-emerald-100/10 px-2.5 py-1.5 text-[11px] text-emerald-100/55 hover:bg-emerald-100/10" data-testid="button-mode-picker"><span className="h-1.5 w-1.5 rounded-full" style={{ background: mode?.accent ?? '#4bf2a8' }} />{mode?.name ?? 'Focus'}<ChevronDown size={13} /></button><button onClick={submit} disabled={(!text.trim() && !isStreaming) || createConversation.isPending || createMessage.isPending} className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-300 text-[#072018] transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-30" data-testid="button-send-message">{isStreaming ? <X size={15} /> : <Send size={15} />}</button></div></div></div>{cameraOpen && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4" onClick={() => setCameraOpen(false)}><div className="glass w-full max-w-lg rounded-2xl p-4" onClick={(event) => event.stopPropagation()}><div className="mb-3 flex items-center justify-between"><h2 className="font-display text-xl">Camera capture</h2><button onClick={() => setCameraOpen(false)} className="rounded-lg p-2 text-emerald-100/55 hover:bg-emerald-100/10" data-testid="button-close-camera"><X size={16} /></button></div><video ref={videoRef} autoPlay muted playsInline className="aspect-video w-full rounded-xl bg-black object-cover" /><button onClick={() => { setText((current) => `${current}${current ? '\n' : ''}[Camera capture ready]`); setCameraOpen(false); notify('Camera capture is ready to add to your message.', 'success'); }} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-300 px-4 py-3 text-sm font-bold text-[#072018] hover:bg-emerald-200" data-testid="button-confirm-camera"><Camera size={16} /> Use camera capture</button></div></div>}</>;
}

function HomeView({ summary, summaryLoading, summaryError, refetchSummary, modes, modesLoading, conversations, conversationsLoading, conversationsError, refetchConversations, prompts, studioAssets, selectedConversationId, setSelectedConversationId, setView, onNew }: any) {
  const [composerModeId, setComposerModeId] = useState<string>();
  const mode = modes?.find((item: any) => item.id === composerModeId) ?? modes?.[0] ?? fallbackModes[0];
  const firstName = summary?.userName?.split(' ')[0] ?? 'there';
  return <div className="mx-auto max-w-[1280px] px-5 pb-16 pt-8 md:px-10 md:pt-12">
    <div className="mb-9 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div className="appear"><div className="mb-3 flex items-center gap-2 font-mono-app text-[10px] uppercase tracking-[.2em] text-emerald-300/70"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />Personal command center</div><h1 className="font-display text-[clamp(2.2rem,5vw,4.5rem)] font-medium leading-[.98] tracking-[-.065em] text-emerald-50">Good morning,<br /><span className="text-emerald-300">{firstName}.</span></h1><p className="mt-4 max-w-md text-sm leading-6 text-emerald-100/48">Your AI. Amplified. Pick up a thread, shape an idea, or make a little room for better thinking.</p></div><div className="flex items-center gap-2 text-right font-mono-app text-[10px] uppercase tracking-[.16em] text-emerald-100/30"><Clock3 size={14} /> <span>Tuesday · 09:42</span></div></div>
     <div className="grid gap-5 lg:grid-cols-[1.45fr_.75fr]">
       <section className="appear-2 glass rounded-[24px] p-4 md:p-6"><div className="mb-5 flex items-center justify-between"><div><div className="font-mono-app text-[9px] uppercase tracking-[.22em] text-emerald-100/35">Start here</div><h2 className="mt-1 font-display text-xl tracking-[-.03em]">Make something of the moment.</h2></div><span className="rounded-full border border-emerald-300/20 bg-emerald-300/[.07] px-2 py-1 font-mono-app text-[9px] text-emerald-200">READY</span></div><Composer mode={mode} modeOptions={modes ?? fallbackModes} onModeChange={(next) => setComposerModeId(next.id)} onSent={() => {}} selectedConversationId={selectedConversationId} setSelectedConversationId={setSelectedConversationId} setView={setView} /><div className="mt-5 flex flex-wrap gap-2">{(prompts?.slice?.(0, 3) ?? [{ id: 1, title: 'Untangle a messy idea', prompt: 'Help me think this through', tag: 'Thinking' }, { id: 2, title: 'Make a plan', prompt: 'Turn this into a clear plan', tag: 'Planning' }, { id: 3, title: 'Find the angle', prompt: 'Help me find the most interesting angle', tag: 'Create' }]).map((prompt: any) => <button key={prompt.id} onClick={() => { setView('prompts'); notify('Prompt library opened — choose a prompt to continue.'); }} className="group rounded-xl border border-emerald-100/[.09] bg-emerald-50/[.025] px-3 py-2 text-left transition hover:border-emerald-300/25 hover:bg-emerald-300/[.06]" data-testid={`quick-prompt-${prompt.id}`}><div className="mb-1 font-mono-app text-[9px] uppercase tracking-[.12em] text-emerald-300/65">{prompt.tag}</div><div className="text-[11px] text-emerald-100/65 group-hover:text-emerald-50">{prompt.title}</div></button>)}</div></section>
      <section className="appear-3 relative overflow-hidden rounded-[24px] border border-emerald-300/15 bg-[#10251d] p-6"><div className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-emerald-300/[.1] blur-3xl" /><div className="relative"><div className="mb-10 flex items-center justify-between"><div className="font-mono-app text-[9px] uppercase tracking-[.22em] text-emerald-100/40">A note from Gadus</div><Bot size={17} className="text-emerald-300/70" /></div><p className="font-display text-[22px] leading-[1.2] tracking-[-.04em] text-emerald-50">{summary?.tip ?? 'The best work usually begins before you know what you are trying to say.'}</p><div className="mt-8 flex items-center gap-2 text-[11px] text-emerald-100/45"><span className="h-5 w-5 rounded-full border border-emerald-300/30 bg-emerald-300/10" /> A small nudge for today</div></div></section>
    </div>
    <div className="mt-5 grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
       <section className="appear-3 glass rounded-[22px] p-5"><div className="mb-5 flex items-center justify-between"><div><div className="font-mono-app text-[9px] uppercase tracking-[.2em] text-emerald-100/35">Your modes</div><h2 className="mt-1 font-display text-lg">How do you want to think?</h2></div><button onClick={() => setView('settings')} className="text-emerald-100/35 hover:text-emerald-100" data-testid="button-mode-settings"><Settings size={15} /></button></div><DataState loading={modesLoading} error={false} empty={!modes?.length}><div className="space-y-2">{(modes?.length ? modes : fallbackModes).slice(0, 3).map((item: any, index: number) => { const ModeIcon = modeIcons[item.icon as keyof typeof modeIcons] ?? Sparkles; const accent = item.accent ?? fallbackModes[index]?.accent; return <button key={item.id} onClick={() => setView('chat')} className="group flex w-full items-center gap-3 rounded-xl border border-transparent px-2 py-2 text-left transition hover:border-emerald-100/10 hover:bg-emerald-50/[.035]" data-testid={`mode-card-${item.id}`}><div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${accent}16`, color: accent }}><ModeIcon size={16} /></div><div className="min-w-0 flex-1"><div className="text-[13px] font-semibold">{item.name}</div><div className="truncate text-[11px] text-emerald-100/40">{item.description}</div></div><ArrowUpRight size={15} className="text-emerald-100/20 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-emerald-200" /></button>; })}</div></DataState></section>
      <section className="appear-4 glass rounded-[22px] p-5"><div className="mb-5 flex items-center justify-between"><div><div className="font-mono-app text-[9px] uppercase tracking-[.2em] text-emerald-100/35">Recent threads</div><h2 className="mt-1 font-display text-lg">Where you left off</h2></div><button onClick={() => setView('chat')} className="text-[11px] font-semibold text-emerald-300 hover:text-emerald-100" data-testid="button-view-all-conversations">View all</button></div><DataState loading={conversationsLoading} error={conversationsError} retry={refetchConversations} empty={!conversations?.length}><div className="space-y-1">{conversations?.slice(0, 4).map((conversation: any) => <button key={conversation.id} onClick={() => { setSelectedConversationId(conversation.id); setView('chat'); }} className="group flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition hover:bg-emerald-50/[.04]" data-testid={`conversation-row-${conversation.id}`}><div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-100/10 bg-emerald-300/[.06] text-emerald-200"><MessageSquare size={14} /></div><div className="min-w-0 flex-1"><div className="truncate text-[12px] font-semibold text-emerald-50/85">{conversation.title}</div><div className="mt-0.5 truncate text-[11px] text-emerald-100/35">{conversation.preview}</div></div><div className="hidden text-right sm:block"><div className="font-mono-app text-[9px] text-emerald-100/25">{conversation.messageCount} msgs</div><Star size={12} className={`mt-1 ml-auto ${conversation.starred ? 'fill-emerald-300 text-emerald-300' : 'text-emerald-100/20'}`} /></div></button>)}</div></DataState></section>
    </div>
    <StatsStrip summary={summary} loading={summaryLoading} />
  </div>;
}

function StatsStrip({ summary, loading }: { summary?: any; loading?: boolean }) {
  const stats = [{ label: 'Conversations', value: summary?.conversations ?? 0, icon: MessageSquare }, { label: 'Messages', value: summary?.messages ?? 0, icon: Zap }, { label: 'Images made', value: summary?.images ?? 0, icon: ImageIcon }, { label: 'Files held', value: summary?.files ?? 0, icon: FileText }];
  return <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-emerald-100/[.09] bg-emerald-100/[.09] md:grid-cols-4">{stats.map((stat) => { const Icon = stat.icon; return <div key={stat.label} className="bg-[#0e1714]/90 p-4"><Icon size={15} className="mb-3 text-emerald-300/65" />{loading ? <Skeleton className="h-6 w-12" /> : <div className="font-display text-2xl tracking-[-.04em]">{stat.value}</div>}<div className="mt-1 font-mono-app text-[9px] uppercase tracking-[.13em] text-emerald-100/32">{stat.label}</div></div>; })}</div>;
}

function ChatView({ conversations, conversationsLoading, conversationsError, refetchConversations, selectedConversationId, setSelectedConversationId, modes, setView }: any) {
  const active = conversations?.find((item: any) => item.id === selectedConversationId) ?? conversations?.[0];
  const activeId = active?.id ?? 0;
  const messagesQuery = useListGadusMessages(activeId, { query: { enabled: Boolean(activeId), queryKey: getListGadusMessagesQueryKey(activeId) } });
  const [isStreaming, setIsStreaming] = useState(() => Boolean(activeId && activeStreams.has(activeId)));
  const [streamingText, setStreamingText] = useState(() => streamedText.get(activeId) ?? '');
  const [streamingError, setStreamingError] = useState('');
  const [composerModeId, setComposerModeId] = useState<string>();
  const [webSearching, setWebSearching] = useState(false);
  const [sources, setSources] = useState<Array<{ title: string; url: string }>>([]);
  useEffect(() => { if (!selectedConversationId && active?.id) setSelectedConversationId(active.id); }, [active?.id, selectedConversationId, setSelectedConversationId]);
  useEffect(() => {
    setIsStreaming(Boolean(activeId && activeStreams.has(activeId)));
    setStreamingText(streamedText.get(activeId) ?? '');
    setStreamingError('');
    setWebSearching(false);
    setSources([]);
  }, [activeId]);
  useEffect(() => {
    const onStream = (event: Event) => {
      const detail = (event as CustomEvent<StreamDetail>).detail;
      if (detail.conversationId !== activeId) return;
      if (detail.type === 'started') {
        setIsStreaming(true);
        setStreamingError('');
        setWebSearching(false);
        setSources([]);
      } else if (detail.type === 'searching') {
        setIsStreaming(true);
        setWebSearching(true);
      } else if (detail.type === 'sources') {
        setWebSearching(false);
        setSources(detail.sources ?? []);
      } else if (detail.type === 'token') {
        setIsStreaming(true);
        setWebSearching(false);
        setStreamingText(streamedText.get(activeId) ?? '');
      } else if (detail.type === 'done') {
        setIsStreaming(false);
        setStreamingText('');
        void messagesQuery.refetch();
        void queryClient.invalidateQueries({ queryKey: getListGadusConversationsQueryKey() });
      } else if (detail.type === 'error') {
        setIsStreaming(false);
        setStreamingText('');
        setStreamingError(detail.message ?? 'Gadus is having a quick rest, please try your message again.');
      } else {
        setIsStreaming(false);
      }
    };
    streamEvents.addEventListener('gadus-stream', onStream);
    return () => streamEvents.removeEventListener('gadus-stream', onStream);
  }, [activeId, messagesQuery.refetch]);
  const activeMode = modes?.find((item: any) => item.id === active?.modeId) ?? modes?.[0] ?? fallbackModes[0];
  const selectedMode = modes?.find((item: any) => item.id === composerModeId) ?? activeMode;
  const clearChat = async () => {
    if (!activeId || !window.confirm('Clear every message in this conversation?')) return;
    try {
      await apiJson(`/api/gadus/conversations/${activeId}/messages`, { method: 'DELETE' });
      await messagesQuery.refetch();
      notify('Conversation cleared.', 'success');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Conversation could not be cleared.', 'error');
    }
  };
  const downloadConversation = () => {
    const rows = (messagesQuery.data ?? []).map((message: any) => `${message.role.toUpperCase()}\n${message.content}`).join('\n\n');
    downloadText(`${active?.title ?? 'gadus-conversation'}.txt`, rows);
    notify('Conversation downloaded.', 'success');
  };
  const copyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      notify('Copied to clipboard.', 'success');
    } catch {
      notify('Clipboard access was blocked by the browser.', 'error');
    }
  };
  const regenerate = () => {
    if (!activeId || isStreaming) return;
    void streamConversation(activeId, selectedMode?.id ?? 'general');
    notify('Regenerating the latest response.');
  };
  return <div className="mx-auto flex h-[calc(100dvh-72px)] max-w-[1280px] flex-col px-5 pb-5 pt-6 md:px-10"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><div className="font-mono-app text-[9px] uppercase tracking-[.2em] text-emerald-300/65">Conversation room</div><h1 className="mt-1 font-display text-2xl tracking-[-.04em]">{active?.title ?? 'A fresh thread'}</h1></div><div className="flex items-center gap-2"><button onClick={downloadConversation} className="rounded-lg border border-emerald-100/10 p-2 text-emerald-100/55 hover:bg-emerald-100/[.06] hover:text-emerald-50" title="Download conversation" data-testid="button-download-conversation"><Download size={15} /></button><button onClick={clearChat} className="rounded-lg border border-emerald-100/10 p-2 text-emerald-100/55 hover:bg-rose-400/10 hover:text-rose-200" title="Clear chat" data-testid="button-clear-chat"><Trash2 size={15} /></button><button onClick={() => setView('dashboard')} className="rounded-lg border border-emerald-100/10 px-3 py-2 text-[11px] text-emerald-100/55 hover:bg-emerald-100/[.06]" data-testid="button-back-overview">Back to overview</button></div></div><div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[250px_1fr]"><section className="hidden min-h-0 overflow-auto rounded-2xl border border-emerald-100/[.09] bg-emerald-50/[.02] p-3 lg:block"><div className="mb-3 flex items-center justify-between px-2"><span className="font-mono-app text-[9px] uppercase tracking-[.18em] text-emerald-100/35">Threads</span><button className="text-emerald-300" onClick={() => setView('dashboard')} data-testid="button-new-thread"><Plus size={14} /></button></div><DataState loading={conversationsLoading} error={conversationsError} retry={refetchConversations} empty={!conversations?.length}><div className="space-y-1">{conversations?.map((item: any) => <button key={item.id} onClick={() => setSelectedConversationId(item.id)} className={`w-full rounded-xl p-3 text-left ${item.id === activeId ? 'bg-emerald-300/10 text-emerald-50' : 'text-emerald-100/50 hover:bg-emerald-50/[.04]'}`} data-testid={`chat-thread-${item.id}`}><div className="truncate text-[12px] font-semibold">{item.title}</div><div className="mt-1 truncate text-[10px] text-emerald-100/30">{item.preview}</div></button>)}</div></DataState></section><section className="glass flex min-h-0 flex-col rounded-2xl"><div className="flex-1 overflow-y-auto p-5 md:p-8"><DataState loading={messagesQuery.isLoading} error={messagesQuery.isError} retry={() => messagesQuery.refetch()} empty={!messagesQuery.data?.length && !streamingText && !streamingError}><div className="mx-auto max-w-2xl space-y-6">{webSearching && <div className="flex items-center gap-2 rounded-xl border border-emerald-300/15 bg-emerald-300/[.05] px-4 py-3 text-xs text-emerald-200" data-testid="browsing-indicator"><Globe2 size={14} className="animate-pulse" /> Gadus is searching the web…</div>}{messagesQuery.data?.map((message: any) => <div key={message.id} className={`group flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`} data-testid={`message-${message.id}`}><div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'bg-emerald-300 text-[#082218]' : 'border border-emerald-100/10 bg-emerald-50/[.04] text-emerald-100/80'}`}>{message.content}<div className={`mt-3 flex gap-1 ${message.role === 'user' ? 'justify-end' : ''}`}><button onClick={() => copyMessage(message.content)} className="rounded-md p-1.5 opacity-50 hover:bg-emerald-100/10 hover:opacity-100" title="Copy response" data-testid={`button-copy-message-${message.id}`}><Copy size={13} /></button>{message.role === 'assistant' && <><button onClick={() => notify('Thanks — feedback saved.', 'success')} className="rounded-md p-1.5 opacity-50 hover:bg-emerald-100/10 hover:opacity-100" title="Helpful" data-testid={`button-thumbs-up-${message.id}`}><ThumbsUp size={13} /></button><button onClick={() => notify('Thanks — feedback saved.', 'success')} className="rounded-md p-1.5 opacity-50 hover:bg-emerald-100/10 hover:opacity-100" title="Not helpful" data-testid={`button-thumbs-down-${message.id}`}><ThumbsDown size={13} /></button><button onClick={regenerate} className="rounded-md p-1.5 opacity-50 hover:bg-emerald-100/10 hover:opacity-100" title="Regenerate response" data-testid={`button-regenerate-${message.id}`}><RefreshCcw size={13} /></button></>}</div></div></div>)}{isStreaming && <div className="flex gap-3" data-testid="streaming-response"><div className="max-w-[88%] rounded-2xl border border-emerald-100/10 bg-emerald-50/[.04] px-4 py-3 text-sm leading-6 text-emerald-100/80">{streamingText || <span className="inline-flex items-center gap-1 text-emerald-200/60">Gadus is thinking<span className="thinking-dots">...</span></span>}{streamingText && <span className="ml-1 inline-block h-4 w-px animate-pulse bg-emerald-300" />}</div></div>}{streamingError && <div className="flex gap-3" data-testid="streaming-error"><div className="max-w-[88%] rounded-2xl border border-amber-200/15 bg-amber-100/[.04] px-4 py-3 text-sm leading-6 text-amber-100/75">{streamingError}</div></div>}{sources.length > 0 && <div className="rounded-xl border border-emerald-100/10 bg-emerald-50/[.025] p-4" data-testid="web-sources"><div className="mb-2 font-mono-app text-[9px] uppercase tracking-[.18em] text-emerald-300/70">Sources</div><div className="space-y-2">{sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-emerald-100/60 hover:text-emerald-200"><ExternalLink size={12} />{source.title}</a>)}</div></div>}</div></DataState></div><div className="border-t border-emerald-100/[.08] p-3 md:p-4"><Composer mode={selectedMode} modeOptions={modes ?? fallbackModes} onModeChange={(next) => setComposerModeId(next.id)} onSent={() => {}} selectedConversationId={activeId || undefined} setSelectedConversationId={setSelectedConversationId} setView={setView} /></div></section></div></div>;
}

const imageStyleOptions = [
  ['photorealistic', 'Photorealistic'],
  ['cinematic', 'Cinematic Film'],
  ['anime', 'Anime'],
  ['watercolor', 'Watercolor'],
  ['3d-render', '3D Render'],
  ['cyberpunk', 'Cyberpunk'],
] as const;

function ImageStudioView({ assets, loading, error, refetch }: any) {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<string>('photorealistic');
  const [images, setImages] = useState<Array<{ url: string; seed: number }>>([]);
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const createImages = async () => {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    try {
      const result = await apiJson<{ images: Array<{ url: string; seed: number }>; enhancedPrompt: string }>('/api/gadus/images/generate', {
        method: 'POST',
        body: JSON.stringify({ prompt, style }),
      });
      setImages(result.images);
      setEnhancedPrompt(result.enhancedPrompt);
      await Promise.all(result.images.map((image, index) => apiJson('/api/gadus/studio/assets', {
        method: 'POST',
        body: JSON.stringify({ kind: 'image', title: `Gadus image ${index + 1}`, prompt: result.enhancedPrompt, url: image.url }),
      })));
      await refetch?.();
      notify('Four image variations are ready.', 'success');
    } catch (actionError) {
      notify(actionError instanceof Error ? actionError.message : 'Image generation could not start.', 'error');
    } finally {
      setGenerating(false);
    }
  };
  const toggleFavorite = async (asset: any) => {
    try {
      await apiJson(`/api/gadus/studio/assets/${asset.id}`, { method: 'PATCH', body: JSON.stringify({ favorite: !asset.favorite }) });
      await refetch?.();
    } catch (actionError) {
      notify(actionError instanceof Error ? actionError.message : 'Favorite could not be updated.', 'error');
    }
  };
  return <div className="mx-auto max-w-[1200px] px-5 pb-16 pt-8 md:px-10 md:pt-12"><div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><div className="mb-3 font-mono-app text-[10px] uppercase tracking-[.2em] text-emerald-300/70">Image studio</div><h1 className="font-display text-4xl tracking-[-.06em] md:text-5xl">Turn a thought<br /><span className="text-emerald-300">into four directions.</span></h1></div><div className="flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/[.05] px-3 py-2 font-mono-app text-[9px] uppercase tracking-[.14em] text-emerald-200"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_#82f6c0]" /> Image engine online</div></div><section className="glass rounded-2xl p-4 md:p-6"><textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Describe an image to create…" className="min-h-24 w-full resize-y rounded-xl border border-emerald-100/10 bg-black/10 p-4 text-sm outline-none focus:border-emerald-300/40" data-testid="input-image-prompt" /><div className="mt-4 flex flex-wrap gap-2">{imageStyleOptions.map(([id, label]) => <button key={id} onClick={() => setStyle(id)} className={`rounded-full border px-3 py-2 text-[11px] transition ${style === id ? 'border-emerald-300/50 bg-emerald-300/15 text-emerald-100' : 'border-emerald-100/10 text-emerald-100/50 hover:border-emerald-300/30'}`} data-testid={`image-style-${id}`}>{label}</button>)}</div><div className="mt-4 flex justify-end"><button onClick={createImages} disabled={!prompt.trim() || generating} className="flex items-center gap-2 rounded-xl bg-emerald-300 px-4 py-3 text-sm font-bold text-[#072018] transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-40" data-testid="button-generate-image">{generating ? <span className="animate-pulse">Creating four directions…</span> : <><ImagePlus size={16} /> Generate images</>}</button></div></section>{enhancedPrompt && <p className="mt-4 rounded-xl border border-emerald-100/10 bg-emerald-50/[.03] p-4 text-xs leading-5 text-emerald-100/50"><span className="font-semibold text-emerald-200">Enhanced prompt used:</span> {enhancedPrompt}</p>}{images.length > 0 && <div className="mt-5 grid gap-4 sm:grid-cols-2">{images.map((image) => <article key={image.seed} className="group overflow-hidden rounded-2xl border border-emerald-100/10 bg-emerald-50/[.03]"><img src={image.url} alt={enhancedPrompt} className="aspect-square w-full object-cover transition duration-500 group-hover:scale-[1.02]" /><div className="flex items-center justify-between p-3"><span className="font-mono-app text-[9px] text-emerald-100/30">Seed {image.seed}</span><a href={image.url} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-emerald-100/55 hover:bg-emerald-100/10 hover:text-emerald-50" title="Open image" data-testid={`button-open-image-${image.seed}`}><ExternalLink size={15} /></a></div></article>)}</div>}<div className="mt-10 flex items-center justify-between"><div><div className="font-mono-app text-[9px] uppercase tracking-[.2em] text-emerald-100/35">Saved image work</div><h2 className="mt-1 font-display text-2xl">Your visual archive</h2></div><span className="text-xs text-emerald-100/35">{assets?.filter((asset: any) => asset.kind === 'image').length ?? 0} images</span></div><DataState loading={loading} error={error} retry={refetch} empty={!assets?.some((asset: any) => asset.kind === 'image')}><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{assets?.filter((asset: any) => asset.kind === 'image').map((asset: any) => <article key={asset.id} className="group overflow-hidden rounded-2xl border border-emerald-100/10 bg-emerald-50/[.03]"><img src={asset.url} alt={asset.title} className="aspect-square w-full object-cover" /><div className="flex items-center justify-between p-3"><button onClick={() => toggleFavorite(asset)} className={`rounded-lg p-2 hover:bg-emerald-100/10 ${asset.favorite ? 'text-emerald-300' : 'text-emerald-100/30'}`} title="Favorite image" data-testid={`button-favorite-image-${asset.id}`}><Star size={15} className={asset.favorite ? 'fill-current' : ''} /></button><a href={asset.url} download={`${asset.title}.png`} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-emerald-100/45 hover:bg-emerald-100/10" title="Download image" data-testid={`button-download-image-${asset.id}`}><Download size={15} /></a></div></article>)}</div></DataState></div>;
}

const videoStyles = [
  ['cinematic', 'Cinematic'],
  ['animation', 'Animation'],
  ['slow-motion', 'Slow Motion'],
  ['documentary', 'Documentary'],
  ['music-video', 'Music Video'],
  ['dreamy', 'Dreamy'],
] as const;

function VideoStudioView({ assets, loading, error, refetch }: any) {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('cinematic');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [videoUrl, setVideoUrl] = useState('');
  const [generating, setGenerating] = useState(false);
  const generateVideo = async () => {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    try {
      const result = await apiJson<{ url: string }>('/api/gadus/videos/generate', { method: 'POST', body: JSON.stringify({ prompt: `${prompt}, ${style} professional production`, aspectRatio }) });
      setVideoUrl(result.url);
      await apiJson('/api/gadus/studio/assets', { method: 'POST', body: JSON.stringify({ kind: 'video', title: 'Gadus video', prompt, url: result.url }) });
      await refetch?.();
      notify('Your video is ready.', 'success');
    } catch (actionError) {
      notify(actionError instanceof Error ? actionError.message : 'Video generation could not start.', 'error');
    } finally {
      setGenerating(false);
    }
  };
  return <div className="mx-auto max-w-[1200px] px-5 pb-16 pt-8 md:px-10 md:pt-12"><div className="mb-8"><div className="mb-3 font-mono-app text-[10px] uppercase tracking-[.2em] text-emerald-300/70">Video studio</div><h1 className="font-display text-4xl tracking-[-.06em] md:text-5xl">Direct the next<br /><span className="text-emerald-300">moving idea.</span></h1></div><section className="glass rounded-2xl p-4 md:p-6"><textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Describe the scene, movement, and mood…" className="min-h-24 w-full resize-y rounded-xl border border-emerald-100/10 bg-black/10 p-4 text-sm outline-none focus:border-emerald-300/40" data-testid="input-video-prompt" /><div className="mt-4 flex flex-wrap gap-2">{videoStyles.map(([id, label]) => <button key={id} onClick={() => setStyle(id)} className={`rounded-full border px-3 py-2 text-[11px] ${style === id ? 'border-emerald-300/50 bg-emerald-300/15 text-emerald-100' : 'border-emerald-100/10 text-emerald-100/50 hover:border-emerald-300/30'}`} data-testid={`video-style-${id}`}>{label}</button>)}</div><div className="mt-4 flex flex-wrap gap-2">{(['16:9', '9:16', '1:1'] as const).map((ratio) => <button key={ratio} onClick={() => setAspectRatio(ratio)} className={`rounded-lg border px-3 py-2 text-[11px] ${aspectRatio === ratio ? 'border-emerald-300/50 bg-emerald-300/15 text-emerald-100' : 'border-emerald-100/10 text-emerald-100/50 hover:border-emerald-300/30'}`} data-testid={`video-ratio-${ratio.replace(':', '-')}`}>{ratio}</button>)}</div><button onClick={generateVideo} disabled={!prompt.trim() || generating} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-300 px-4 py-3 text-sm font-bold text-[#072018] hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-40" data-testid="button-generate-video">{generating ? 'Gadus is directing your video…' : <><Video size={16} /> Generate video</>}</button></section>{videoUrl && <div className="mt-5 overflow-hidden rounded-2xl border border-emerald-100/10 bg-black"><video src={videoUrl} controls autoPlay muted loop playsInline className="max-h-[620px] w-full" data-testid="generated-video" /><div className="flex justify-end p-3"><a href={videoUrl} download="gadus-video.mp4" target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg border border-emerald-100/10 px-3 py-2 text-xs text-emerald-100/60 hover:bg-emerald-100/10" data-testid="button-download-video"><Download size={14} /> Download</a></div></div>}<div className="mt-10"><div className="mb-4 font-mono-app text-[9px] uppercase tracking-[.2em] text-emerald-100/35">Saved videos</div><DataState loading={loading} error={error} retry={refetch} empty={!assets?.some((asset: any) => asset.kind === 'video')}><div className="grid gap-4 md:grid-cols-2">{assets?.filter((asset: any) => asset.kind === 'video').map((asset: any) => <article key={asset.id} className="overflow-hidden rounded-2xl border border-emerald-100/10 bg-emerald-50/[.03]"><video src={asset.url} controls muted playsInline className="aspect-video w-full bg-black object-cover" /><div className="flex items-center justify-between p-3"><span className="truncate text-xs text-emerald-100/55">{asset.title}</span><a href={asset.url} download={`${asset.title}.mp4`} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-emerald-100/45 hover:bg-emerald-100/10" title="Download video" data-testid={`button-download-saved-video-${asset.id}`}><Download size={15} /></a></div></article>)}</div></DataState></div></div>;
}

function PromptView({ prompts, loading, error, refetch, setView }: any) {
  const [query, setQuery] = useState('');
  const filtered = (prompts ?? []).filter((p: any) => `${p.title} ${p.category} ${p.prompt}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="mx-auto max-w-[1200px] px-5 pb-16 pt-8 md:px-10 md:pt-12"><div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><div className="mb-3 font-mono-app text-[10px] uppercase tracking-[.2em] text-emerald-300/70">The prompt library</div><h1 className="font-display text-4xl tracking-[-.06em] md:text-5xl">Good questions,<br /><span className="text-emerald-300">on demand.</span></h1></div><div className="relative"><Search size={15} className="absolute left-3 top-3 text-emerald-100/30" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search prompts" className="h-10 w-full rounded-xl border border-emerald-100/10 bg-emerald-50/[.04] pl-9 pr-3 text-sm outline-none focus:border-emerald-300/40 md:w-64" data-testid="input-search-prompts" /></div></div><DataState loading={loading} error={error} retry={refetch} empty={!filtered.length}><div className="grid gap-3 md:grid-cols-2">{filtered.map((prompt: any) => <article key={prompt.id} className="group glass rounded-2xl p-5 transition hover:-translate-y-0.5 hover:border-emerald-300/25" data-testid={`prompt-card-${prompt.id}`}><div className="mb-8 flex items-center justify-between"><span className="rounded-full border border-emerald-300/15 bg-emerald-300/[.07] px-2.5 py-1 font-mono-app text-[9px] uppercase tracking-[.13em] text-emerald-200/70">{prompt.tag || prompt.category}</span><button onClick={() => navigator.clipboard?.writeText(prompt.prompt)} className="rounded-lg p-2 text-emerald-100/25 hover:bg-emerald-100/10 hover:text-emerald-100" title="Copy prompt" data-testid={`button-copy-prompt-${prompt.id}`}><Copy size={15} /></button></div><h2 className="font-display text-xl tracking-[-.03em]">{prompt.title}</h2><p className="mt-2 text-sm leading-6 text-emerald-100/48">{prompt.prompt}</p><button onClick={() => setView('dashboard')} className="mt-5 flex items-center gap-2 text-[11px] font-bold text-emerald-300 opacity-0 transition group-hover:opacity-100" data-testid={`button-use-prompt-${prompt.id}`}>Use this prompt <ArrowUpRight size={14} /></button></article>)}</div></DataState></div>;
}

function StudioView({ assets, loading, error, refetch }: any) {
  const [kind, setKind] = useState<'all' | 'image' | 'video'>('all');
  const shown = assets?.filter((asset: any) => kind === 'all' || asset.kind === kind) ?? [];
  const toggleFavorite = async (asset: any) => {
    try {
      await apiJson(`/api/gadus/studio/assets/${asset.id}`, { method: 'PATCH', body: JSON.stringify({ favorite: !asset.favorite }) });
      await refetch?.();
      notify(asset.favorite ? 'Removed from favorites.' : 'Added to favorites.', 'success');
    } catch (actionError) {
      notify(actionError instanceof Error ? actionError.message : 'Favorite could not be updated.', 'error');
    }
  };
  const deleteAsset = async (asset: any) => {
    if (!window.confirm(`Delete ${asset.title}?`)) return;
    try {
      await apiJson(`/api/gadus/studio/assets/${asset.id}`, { method: 'DELETE' });
      await refetch?.();
      notify('Asset deleted.', 'success');
    } catch (actionError) {
      notify(actionError instanceof Error ? actionError.message : 'Asset could not be deleted.', 'error');
    }
  };
  return <div className="mx-auto max-w-[1200px] px-5 pb-16 pt-8 md:px-10 md:pt-12"><div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><div className="mb-3 font-mono-app text-[10px] uppercase tracking-[.2em] text-emerald-300/70">Gadus studio</div><h1 className="font-display text-4xl tracking-[-.06em] md:text-5xl">Make the invisible<br /><span className="text-emerald-300">visible.</span></h1></div><div className="flex rounded-xl border border-emerald-100/10 bg-emerald-50/[.025] p-1">{(['all', 'image', 'video'] as const).map((item) => <button key={item} onClick={() => setKind(item)} className={`rounded-lg px-3 py-2 font-mono-app text-[9px] uppercase tracking-[.16em] ${kind === item ? 'bg-emerald-300 text-[#082218]' : 'text-emerald-100/45 hover:text-emerald-100'}`} data-testid={`studio-filter-${item}`}>{item}</button>)}</div></div><DataState loading={loading} error={error} retry={refetch} empty={!shown.length}><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{shown.map((asset: any) => <article key={asset.id} className="group overflow-hidden rounded-2xl border border-emerald-100/10 bg-emerald-50/[.03]" data-testid={`studio-asset-${asset.id}`}><div className="relative flex aspect-[1.22] items-center justify-center overflow-hidden bg-[#11231c]">{asset.kind === 'image' && asset.url ? <img src={asset.url} alt={asset.title} className="h-full w-full object-cover opacity-85 transition duration-500 group-hover:scale-105" /> : <div className="flex flex-col items-center gap-3 text-emerald-300/60"><div className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-300/20 bg-emerald-300/10">{asset.kind === 'video' ? <Film size={20} /> : <ImageIcon size={20} />}</div>{asset.kind === 'video' && <div className="flex items-center gap-1 font-mono-app text-[9px] uppercase tracking-[.14em]"><Play size={10} /> Preview</div>}</div>}</div><div className="p-4"><div className="flex items-start justify-between gap-3"><div><h2 className="text-[13px] font-semibold">{asset.title}</h2><p className="mt-1 line-clamp-2 text-[11px] leading-5 text-emerald-100/40">{asset.prompt}</p></div><div className="flex items-center gap-1"><button onClick={() => toggleFavorite(asset)} className="rounded-lg p-1.5 text-emerald-100/45 hover:bg-emerald-100/10 hover:text-emerald-300" title="Favorite asset" data-testid={`button-favorite-asset-${asset.id}`}><Star size={14} className={asset.favorite ? 'fill-emerald-300 text-emerald-300' : ''} /></button><button onClick={() => deleteAsset(asset)} className="rounded-lg p-1.5 text-emerald-100/45 hover:bg-rose-400/10 hover:text-rose-200" title="Delete asset" data-testid={`button-delete-asset-${asset.id}`}><Trash2 size={14} /></button></div></div></div></article>)}</div></DataState></div>;
}

function AnalyticsView({ summary }: { summary?: any }) {
  const goals = summary?.goals ?? [{ label: 'Make space to think', progress: 3, target: 5 }, { label: 'Ship something small', progress: 2, target: 4 }, { label: 'Ask better questions', progress: 7, target: 10 }];
  return <div className="mx-auto max-w-[1100px] px-5 pb-16 pt-8 md:px-10 md:pt-12"><div className="mb-10"><div className="mb-3 font-mono-app text-[10px] uppercase tracking-[.2em] text-emerald-300/70">Your rhythm</div><h1 className="font-display text-4xl tracking-[-.06em] md:text-5xl">A little signal<br /><span className="text-emerald-300">goes a long way.</span></h1></div><div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]"><section className="glass rounded-2xl p-6"><div className="mb-7 flex items-center justify-between"><div><h2 className="font-display text-xl">Workspace pulse</h2><p className="mt-1 text-xs text-emerald-100/40">The last 30 days</p></div><BarChart3 size={18} className="text-emerald-300" /></div><div className="flex h-44 items-end gap-2 border-b border-emerald-100/10 pb-0">{[25, 43, 32, 61, 48, 77, 53, 68, 45, 84, 63, 91, 72, 86, 67, 74].map((height, i) => <div key={i} className="group relative flex-1"><div className="absolute bottom-0 w-full rounded-t-sm bg-emerald-300/20 transition-all group-hover:bg-emerald-300/65" style={{ height: `${height}%` }} /><span className="absolute -bottom-6 left-1/2 -translate-x-1/2 font-mono-app text-[8px] text-emerald-100/20">{i % 4 === 0 ? `W${i / 4 + 1}` : ''}</span></div>)}</div><div className="mt-9 grid grid-cols-3 gap-3"><div><div className="font-display text-2xl">{summary?.mostUsedMode ?? 'Focus'}</div><div className="font-mono-app text-[9px] uppercase text-emerald-100/30">Most used mode</div></div><div><div className="font-display text-2xl">{summary?.messages ?? 0}</div><div className="font-mono-app text-[9px] uppercase text-emerald-100/30">Messages</div></div><div><div className="font-display text-2xl text-emerald-300">+18%</div><div className="font-mono-app text-[9px] uppercase text-emerald-100/30">Week over week</div></div></div></section><section className="rounded-2xl border border-emerald-300/15 bg-[#10251d] p-6"><div className="mb-7 flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-300/10 text-emerald-300"><Target size={17} /></div><div><h2 className="font-display text-xl">Small intentions</h2><p className="text-xs text-emerald-100/40">Progress, not pressure.</p></div></div><div className="space-y-6">{goals.map((goal: any, i: number) => <div key={goal.label ?? i}><div className="mb-2 flex justify-between text-[12px]"><span className="text-emerald-100/75">{goal.label}</span><span className="font-mono-app text-[10px] text-emerald-300">{goal.progress}/{goal.target}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-emerald-950"><div className="h-full rounded-full bg-emerald-300" style={{ width: `${Math.min((goal.progress / goal.target) * 100, 100)}%` }} /></div></div>)}</div></section></div></div>;
}

function ProfileView({ summary }: { summary?: any }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(summary?.userName ?? 'Alex');
  const saveProfile = () => {
    setEditing(false);
    notify('Profile saved.', 'success');
  };
  return <div className="mx-auto max-w-[920px] px-5 pb-16 pt-8 md:px-10 md:pt-12"><div className="mb-10"><div className="mb-3 font-mono-app text-[10px] uppercase tracking-[.2em] text-emerald-300/70">Your profile</div><h1 className="font-display text-4xl tracking-[-.06em]">The person<br /><span className="text-emerald-300">behind the prompts.</span></h1></div><section className="glass rounded-2xl p-6 md:p-8"><div className="flex flex-col gap-6 sm:flex-row sm:items-center"><div className="mark-glow flex h-20 w-20 items-center justify-center rounded-full bg-emerald-300/10 font-display text-2xl text-emerald-200">{name.slice(0, 2).toUpperCase()}</div><div className="flex-1"><div className="font-mono-app text-[9px] uppercase tracking-[.2em] text-emerald-100/35">Member since the beginning</div>{editing ? <input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-lg border border-emerald-100/10 bg-black/10 px-3 py-2 font-display text-2xl outline-none focus:border-emerald-300/40" data-testid="input-profile-name" /> : <h2 className="mt-2 font-display text-3xl">{name}</h2>}<p className="mt-1 text-sm text-emerald-100/45">Thinking in public is overrated. This is your private room.</p></div>{editing ? <button onClick={saveProfile} className="rounded-xl bg-emerald-300 px-4 py-2 text-[11px] font-bold text-[#072018] hover:bg-emerald-200" data-testid="button-save-profile"><Save size={14} className="mr-1 inline" />Save</button> : <button onClick={() => setEditing(true)} className="rounded-xl border border-emerald-100/10 px-4 py-2 text-[11px] font-semibold text-emerald-100/60 hover:bg-emerald-100/[.06]" data-testid="button-edit-profile">Edit profile</button>}</div><div className="mt-9 grid gap-3 border-t border-emerald-100/10 pt-6 sm:grid-cols-3"><div><div className="font-display text-2xl">{summary?.conversations ?? 0}</div><div className="font-mono-app text-[9px] uppercase text-emerald-100/30">Threads started</div></div><div><div className="font-display text-2xl">{summary?.images ?? 0}</div><div className="font-mono-app text-[9px] uppercase text-emerald-100/30">Ideas visualized</div></div><div><div className="font-display text-2xl">{summary?.files ?? 0}</div><div className="font-mono-app text-[9px] uppercase text-emerald-100/30">Files in orbit</div></div></div></section></div>;
}

function SettingsView() {
  const [privateMode, setPrivateMode] = useState(true);
  const [sound, setSound] = useState(false);
  const [personality, setPersonality] = useState('Quietly ambitious');
  const personalities = ['Quietly ambitious', 'Warm and direct', 'Deeply analytical'];
  const saveSettings = () => {
    window.localStorage.setItem('gadus-settings', JSON.stringify({ privateMode, sound, personality }));
    notify('Settings saved.', 'success');
  };
  const exportData = () => {
    downloadText('gadus-settings.json', JSON.stringify({ privateMode, sound, personality }, null, 2), 'application/json');
    notify('Settings exported.', 'success');
  };
  return <div className="mx-auto max-w-[820px] px-5 pb-16 pt-8 md:px-10 md:pt-12"><div className="mb-10"><div className="mb-3 font-mono-app text-[10px] uppercase tracking-[.2em] text-emerald-300/70">Workspace settings</div><h1 className="font-display text-4xl tracking-[-.06em]">Make Gadus<br /><span className="text-emerald-300">feel like yours.</span></h1></div><div className="space-y-3"><SettingRow title="Private by default" description="Your conversations stay in your workspace." checked={privateMode} onChange={() => setPrivateMode(!privateMode)} testId="toggle-private-mode" /><SettingRow title="Gentle sound cues" description="A subtle note when Gadus finishes thinking." checked={sound} onChange={() => setSound(!sound)} testId="toggle-sound" /><div className="glass rounded-2xl p-5"><div className="flex items-center justify-between"><div><div className="text-sm font-semibold">Assistant personality</div><div className="mt-1 text-xs text-emerald-100/40">How Gadus should show up in your work.</div></div><button onClick={() => setPersonality(personalities[(personalities.indexOf(personality) + 1) % personalities.length])} className="flex items-center gap-2 rounded-xl border border-emerald-100/10 px-3 py-2 text-xs text-emerald-100/60 hover:bg-emerald-100/[.06]" data-testid="button-personality">{personality} <ChevronDown size={14} /></button></div></div><div className="glass rounded-2xl p-5"><div className="mb-4 text-sm font-semibold">Keyboard shortcuts</div><div className="space-y-3 text-xs text-emerald-100/45"><div className="flex justify-between"><span>New conversation</span><kbd className="font-mono-app text-[10px] text-emerald-100/60">⌘ N</kbd></div><div className="flex justify-between"><span>Search workspace</span><kbd className="font-mono-app text-[10px] text-emerald-100/60">⌘ K</kbd></div><div className="flex justify-between"><span>Send message</span><kbd className="font-mono-app text-[10px] text-emerald-100/60">⌘ ↵</kbd></div></div></div><div className="flex flex-wrap justify-end gap-2 pt-3"><button onClick={exportData} className="rounded-xl border border-emerald-100/10 px-4 py-2 text-xs text-emerald-100/60 hover:bg-emerald-100/[.06]" data-testid="button-export-data"><Download size={14} className="mr-1 inline" />Export data</button><button onClick={saveSettings} className="rounded-xl bg-emerald-300 px-4 py-2 text-xs font-bold text-[#072018] hover:bg-emerald-200" data-testid="button-save-settings"><Save size={14} className="mr-1 inline" />Save settings</button></div></div></div>;
}

function Landing({ onStart }: { onStart: () => void }) {
  const featureCards = [
    { icon: Sparkles, label: '12 AI modes', copy: 'Switch from sharp strategy to expansive creative thinking without changing tools.' },
    { icon: ImageIcon, label: 'Make the invisible visible', copy: 'Turn the first spark into polished prompts, images, and visual directions.' },
    { icon: Globe2, label: 'Stay close to the moment', copy: 'A workspace designed for live context, clear thinking, and better decisions.' },
  ];
  return <div className="gadus-app min-h-[100dvh] overflow-hidden text-emerald-50">
    <div className="pointer-events-none fixed inset-0 opacity-40" style={{ backgroundImage: 'linear-gradient(rgba(130,246,192,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(130,246,192,.045) 1px, transparent 1px)', backgroundSize: '72px 72px', maskImage: 'linear-gradient(to bottom, black, transparent 72%)' }} />
    <header className="relative z-10 mx-auto flex max-w-[1240px] items-center justify-between px-5 py-6 md:px-10 md:py-8">
      <Mark />
      <button onClick={onStart} className="hidden items-center gap-2 rounded-full border border-emerald-100/15 px-4 py-2 text-xs font-semibold text-emerald-100/70 transition hover:border-emerald-300/40 hover:text-emerald-50 sm:flex">Enter workspace <ArrowUpRight size={14} /></button>
    </header>
    <main className="relative z-10 mx-auto max-w-[1240px] px-5 md:px-10">
      <section className="flex min-h-[640px] flex-col items-center justify-center pb-20 pt-16 text-center md:pb-28 md:pt-20">
        <div className="appear mb-8 flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/[.05] px-3 py-1.5 font-mono-app text-[9px] uppercase tracking-[.2em] text-emerald-200/70"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_#82f6c0]" /> Private intelligence, amplified</div>
        <div className="mark-glow pulse-mark mb-9 flex h-16 w-16 items-center justify-center rounded-full bg-[#82f6c0]"><span className="absolute h-7 w-7 rounded-full border-2 border-[#082218]" /><span className="h-2.5 w-2.5 rounded-full bg-[#082218]" /></div>
        <h1 className="appear-2 max-w-4xl font-display text-[clamp(3.4rem,10vw,8.5rem)] font-medium leading-[.88] tracking-[-.09em]">Your AI.<br /><span className="text-emerald-300">Amplified.</span></h1>
        <p className="appear-3 mt-8 max-w-xl text-base leading-7 text-emerald-100/50 md:text-lg">A private thinking space for the work you care about. Research deeper, create faster, and turn scattered thoughts into something real.</p>
        <button onClick={onStart} className="appear-4 group mt-10 flex min-h-14 items-center gap-3 rounded-2xl bg-emerald-300 px-6 text-sm font-bold text-[#062117] shadow-[0_12px_40px_rgba(54,230,153,.2)] transition hover:-translate-y-1 hover:bg-emerald-200 hover:shadow-[0_16px_50px_rgba(54,230,153,.28)]">Get started <ArrowRight size={17} className="transition group-hover:translate-x-1" /></button>
        <div className="mt-6 flex items-center gap-2 font-mono-app text-[9px] uppercase tracking-[.17em] text-emerald-100/30"><LockKeyhole size={12} /> Your space stays yours</div>
      </section>
      <section className="grid gap-3 border-y border-emerald-100/[.09] py-5 md:grid-cols-3">
        {featureCards.map(({ icon: Icon, label, copy }) => <div key={label} className="rounded-2xl p-5 transition hover:bg-emerald-50/[.035]"><Icon size={18} className="mb-7 text-emerald-300" /><h2 className="font-display text-xl tracking-[-.03em]">{label}</h2><p className="mt-2 text-sm leading-6 text-emerald-100/42">{copy}</p></div>)}
      </section>
      <section className="grid gap-10 py-24 md:grid-cols-[.7fr_1.3fr] md:py-32">
        <div><div className="mb-4 font-mono-app text-[10px] uppercase tracking-[.2em] text-emerald-300/70">How Gadus works</div><h2 className="max-w-sm font-display text-4xl leading-[.96] tracking-[-.06em] md:text-5xl">More signal.<br /><span className="text-emerald-300">Less friction.</span></h2></div>
        <div className="space-y-3">{[['01', 'Choose your mode', 'Meet the version of Gadus your moment needs.'], ['02', 'Ask anything', 'Bring the half-formed thought, the hard problem, or the blank page.'], ['03', 'Get brilliant results', 'Leave with something clearer, sharper, and ready for what is next.']].map(([number, title, copy]) => <div key={number} className="glass flex gap-5 rounded-2xl p-5 md:p-6"><span className="font-mono-app text-[10px] text-emerald-300/70">{number}</span><div><h3 className="font-display text-xl">{title}</h3><p className="mt-1 text-sm leading-6 text-emerald-100/42">{copy}</p></div></div>)}</div>
      </section>
    </main>
    <footer className="relative z-10 border-t border-emerald-100/[.09] px-5 py-7 md:px-10"><div className="mx-auto flex max-w-[1240px] items-center justify-between"><Mark compact /><span className="font-mono-app text-[9px] uppercase tracking-[.18em] text-emerald-100/30">Powered by Gadus</span></div></footer>
  </div>;
}

function SettingRow({ title, description, checked, onChange, testId }: { title: string; description: string; checked: boolean; onChange: () => void; testId: string }) {
  return <div className="glass flex items-center justify-between rounded-2xl p-5"><div><div className="text-sm font-semibold">{title}</div><div className="mt-1 text-xs text-emerald-100/40">{description}</div></div><button role="switch" aria-checked={checked} onClick={onChange} className={`relative h-6 w-11 rounded-full transition ${checked ? 'bg-emerald-300' : 'bg-emerald-100/15'}`} data-testid={testId}><span className={`absolute top-1 h-4 w-4 rounded-full transition ${checked ? 'left-6 bg-[#082218]' : 'left-1 bg-emerald-100/50'}`} />{checked && <Check size={10} className="absolute left-7 top-[7px] text-emerald-300" />}</button></div>;
}

function Workspace() {
  const [view, setView] = useState<View>('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<number>();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notice, setNotice] = useState<NoticeDetail>();
  const summaryQuery = useGetGadusSummary();
  const modesQuery = useListGadusModes();
  const conversationsQuery = useListGadusConversations();
  const promptsQuery = useListGadusPrompts();
  const studioQuery = useListGadusStudioAssets();
  useEffect(() => {
    const onNotice = (event: Event) => {
      const detail = (event as CustomEvent<NoticeDetail>).detail;
      setNotice(detail);
      window.setTimeout(() => setNotice(undefined), 3600);
    };
    noticeEvents.addEventListener('gadus-notice', onNotice);
    return () => noticeEvents.removeEventListener('gadus-notice', onNotice);
  }, []);
  const modes = modesQuery.data;
  const conversations = conversationsQuery.data;
  const goNew = () => { setSelectedConversationId(undefined); setView('dashboard'); setMobileOpen(false); };
  return <div className="gadus-app min-h-[100dvh] text-emerald-50"><Sidebar view={view} setView={setView} collapsed={collapsed} setCollapsed={setCollapsed} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} summary={summaryQuery.data} onNew={goNew} /><main className={`min-h-[100dvh] transition-[padding] duration-300 ${collapsed ? 'md:pl-[76px]' : 'md:pl-[248px]'}`}><Topbar onMenu={() => setMobileOpen(true)} view={view} onSearch={() => setSearchOpen(true)} />{view === 'dashboard' && <HomeView summary={summaryQuery.data} summaryLoading={summaryQuery.isLoading} summaryError={summaryQuery.isError} refetchSummary={() => summaryQuery.refetch()} modes={modes} modesLoading={modesQuery.isLoading} conversations={conversations} conversationsLoading={conversationsQuery.isLoading} conversationsError={conversationsQuery.isError} refetchConversations={() => conversationsQuery.refetch()} prompts={promptsQuery.data} studioAssets={studioQuery.data} selectedConversationId={selectedConversationId} setSelectedConversationId={setSelectedConversationId} setView={setView} onNew={goNew} />}{view === 'chat' && <ChatView conversations={conversations} conversationsLoading={conversationsQuery.isLoading} conversationsError={conversationsQuery.isError} refetchConversations={() => conversationsQuery.refetch()} selectedConversationId={selectedConversationId} setSelectedConversationId={setSelectedConversationId} modes={modes} setView={setView} />}{view === 'prompts' && <PromptView prompts={promptsQuery.data} loading={promptsQuery.isLoading} error={promptsQuery.isError} refetch={() => promptsQuery.refetch()} setView={setView} />}{view === 'studio' && <StudioView assets={studioQuery.data} loading={studioQuery.isLoading} error={studioQuery.isError} refetch={() => studioQuery.refetch()} />}{view === 'image-studio' && <ImageStudioView assets={studioQuery.data} loading={studioQuery.isLoading} error={studioQuery.isError} refetch={() => studioQuery.refetch()} />}{view === 'video-studio' && <VideoStudioView assets={studioQuery.data} loading={studioQuery.isLoading} error={studioQuery.isError} refetch={() => studioQuery.refetch()} />}{view === 'analytics' && <AnalyticsView summary={summaryQuery.data} />}{view === 'profile' && <ProfileView summary={summaryQuery.data} />}{view === 'settings' && <SettingsView />}</main>{searchOpen && <SearchOverlay close={() => setSearchOpen(false)} setView={setView} />}{notice && <div className={`fixed bottom-5 right-5 z-[80] flex max-w-sm items-center gap-3 rounded-xl border px-4 py-3 text-xs shadow-2xl backdrop-blur-xl ${notice.tone === 'error' ? 'border-rose-300/30 bg-rose-950/90 text-rose-100' : notice.tone === 'success' ? 'border-emerald-300/30 bg-emerald-950/90 text-emerald-100' : 'border-emerald-100/15 bg-[#10251d]/95 text-emerald-100'}`} role="status"><Check size={15} />{notice.message}<button onClick={() => setNotice(undefined)} className="rounded p-1 opacity-60 hover:opacity-100" aria-label="Dismiss notification"><X size={13} /></button></div>}</div>;
}

function SearchOverlay({ close, setView }: { close: () => void; setView: (v: View) => void }) {
  const [value, setValue] = useState('');
  return <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/65 px-4 pt-[15vh]" onClick={close}><div className="glass w-full max-w-xl rounded-2xl p-3" onClick={(e) => e.stopPropagation()}><div className="flex items-center gap-3 border-b border-emerald-100/10 px-3 pb-3"><Search size={17} className="text-emerald-300" /><input autoFocus value={value} onChange={(e) => setValue(e.target.value)} placeholder="Search your workspace..." className="flex-1 bg-transparent text-sm outline-none placeholder:text-emerald-100/30" data-testid="input-workspace-search" /><button onClick={close} className="text-emerald-100/35 hover:text-emerald-100" data-testid="button-close-search"><X size={16} /></button></div><div className="space-y-1 p-2"><button onClick={() => { setView('chat'); close(); }} className="flex w-full items-center gap-3 rounded-xl p-3 text-left text-sm text-emerald-100/65 hover:bg-emerald-100/[.06]" data-testid="search-result-conversations"><MessageSquare size={15} /> Browse conversations <span className="ml-auto font-mono-app text-[9px] text-emerald-100/25">Navigate</span></button><button onClick={() => { setView('prompts'); close(); }} className="flex w-full items-center gap-3 rounded-xl p-3 text-left text-sm text-emerald-100/65 hover:bg-emerald-100/[.06]" data-testid="search-result-prompts"><Sparkles size={15} /> Explore prompt library <span className="ml-auto font-mono-app text-[9px] text-emerald-100/25">Navigate</span></button>{value && <div className="px-3 py-3 text-xs text-emerald-100/35">Search is ready for your next thread.</div>}</div></div></div>;
}

function Router() {
  return <ErrorBoundary><Switch><Route path="/" component={Product} /><Route component={NotFound} /></Switch></ErrorBoundary>;
}

function Product() {
  const [started, setStarted] = useState(() => window.localStorage.getItem('gadus-entered') === 'true');
  const enter = () => {
    window.localStorage.setItem('gadus-entered', 'true');
    setStarted(true);
  };
  return started ? <Workspace /> : <Landing onStart={enter} />;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;