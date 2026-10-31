'use client';

import * as React from 'react';
import {
  MessageSquare,
  Send,
  Hash,
  User,
  Users,
  Shield,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';

interface Channel {
  id: string;
  name: string;
  type: 'cohort' | 'dm';
  description?: string;
  colorTag?: string;
}

interface MessageItem {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  createdAt: string | Date;
  isSelf: boolean;
}

interface ChatViewProps {
  currentUserId: string;
  currentUserName: string;
  currentUserRole: string;
  channels: Channel[];
  initialMessages: Record<string, MessageItem[]>;
}

export function ChatView({
  currentUserId,
  currentUserName,
  currentUserRole,
  channels,
  initialMessages,
}: ChatViewProps) {
  const { showToast } = useToast();

  const [activeChannelId, setActiveChannelId] = React.useState<string>(
    channels[0]?.id || 'cohort:prog-research'
  );
  const [messagesByChannel, setMessagesByChannel] =
    React.useState<Record<string, MessageItem[]>>(initialMessages);
  const [inputText, setInputText] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);

  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);

  const activeChannel = channels.find((c) => c.id === activeChannelId) || channels[0];
  const currentMessages = messagesByChannel[activeChannelId] || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [activeChannelId, messagesByChannel]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const textToSend = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      const resp = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: activeChannelId,
          content: textToSend,
        }),
      });

      const data = await resp.json();
      if (resp.ok) {
        const msg: MessageItem = {
          id: data.message.id,
          channelId: activeChannelId,
          senderId: currentUserId,
          senderName: currentUserName,
          senderRole: currentUserRole,
          content: textToSend,
          createdAt: new Date().toISOString(),
          isSelf: true,
        };

        setMessagesByChannel((prev) => ({
          ...prev,
          [activeChannelId]: [...(prev[activeChannelId] || []), msg],
        }));
      } else {
        showToast(data.error || 'Failed to send message', 'error');
      }
    } catch {
      showToast('Network error sending message', 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="default">Cohort Communications</Badge>
          <span className="text-xs text-ink-muted">Real-time Mentorship & Discussions</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-ink tracking-tight">
          Messages & Channels
        </h1>
      </div>

      {/* Main Chat Grid (Sidebar Channels + Messages Thread) */}
      <div className="grid grid-cols-1 md:grid-cols-12 rounded-card border border-line bg-bg-card overflow-hidden h-[620px] shadow-sm">
        {/* Left Channel Sidebar */}
        <div className="md:col-span-4 border-r border-line bg-bg-main flex flex-col h-full">
          <div className="p-3.5 border-b border-line bg-white/40 dark:bg-bg-card/40">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Channels & Conversations
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted px-2.5 pt-2 block">
              Cohort Channels
            </span>
            {channels
              .filter((c) => c.type === 'cohort')
              .map((chan) => (
                <button
                  key={chan.id}
                  onClick={() => setActiveChannelId(chan.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-element text-left transition-colors min-h-[44px] ${
                    activeChannelId === chan.id
                      ? 'bg-brand-500 text-white font-semibold'
                      : 'text-ink hover:bg-brand-50/40'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Hash className="h-4 w-4 flex-none opacity-80" />
                    <span className="text-xs truncate">{chan.name}</span>
                  </div>
                  {chan.colorTag && (
                    <span
                      className="h-2 w-2 rounded-full flex-none"
                      style={{ backgroundColor: chan.colorTag }}
                    />
                  )}
                </button>
              ))}

            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted px-2.5 pt-4 block">
              Direct Mentorship
            </span>
            {channels
              .filter((c) => c.type === 'dm')
              .map((chan) => (
                <button
                  key={chan.id}
                  onClick={() => setActiveChannelId(chan.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-element text-left transition-colors min-h-[44px] ${
                    activeChannelId === chan.id
                      ? 'bg-brand-500 text-white font-semibold'
                      : 'text-ink hover:bg-brand-50/40'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <User className="h-4 w-4 flex-none opacity-80" />
                    <span className="text-xs truncate">{chan.name}</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20">Instructor</span>
                </button>
              ))}
          </div>
        </div>

        {/* Right Chat Thread */}
        <div className="md:col-span-8 flex flex-col h-full bg-bg-card">
          {/* Channel Header Bar */}
          <div className="p-3.5 border-b border-line flex items-center justify-between bg-white/30 dark:bg-bg-card/40">
            <div className="flex items-center gap-2">
              {activeChannel?.type === 'cohort' ? (
                <Hash className="h-4 w-4 text-brand-500" />
              ) : (
                <User className="h-4 w-4 text-brand-500" />
              )}
              <div>
                <h3 className="text-sm font-heading font-bold text-ink">
                  {activeChannel?.name}
                </h3>
                <p className="text-[11px] text-ink-muted">
                  {activeChannel?.description || 'Active programme discussion thread'}
                </p>
              </div>
            </div>

            <Badge variant="outline" className="text-[10px]">
              End-to-End Logged
            </Badge>
          </div>

          {/* Messages History List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {currentMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.isSelf ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-ink-muted">
                  <span className="font-semibold text-ink">{msg.senderName}</span>
                  <span>•</span>
                  <span>{msg.senderRole}</span>
                  <span>•</span>
                  <span>
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div
                  className={`max-w-[80%] p-3 rounded-card text-xs leading-relaxed ${
                    msg.isSelf
                      ? 'bg-brand-500 text-white rounded-tr-none shadow-sm'
                      : 'bg-bg-main border border-line text-ink rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {currentMessages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-ink-muted space-y-2">
                <MessageSquare className="h-8 w-8 text-brand-500 opacity-60" />
                <p className="text-xs">No messages yet in this conversation.</p>
                <p className="text-[11px] text-ink-muted">Start the discussion below!</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 border-t border-line bg-bg-main flex items-center gap-2"
          >
            <Input
              placeholder={`Message ${activeChannel?.name}...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="text-xs min-h-[44px]"
            />
            <Button
              type="submit"
              disabled={!inputText.trim() || isSending}
              className="gap-1.5 flex-none min-h-[44px] px-4"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Send</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
