'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Megaphone,
  Plus,
  Send,
  AlertTriangle,
  Info,
  Calendar,
  User,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface AnnouncementItem {
  id: string;
  programmeId?: string | null;
  title: string;
  content: string;
  priority: 'NORMAL' | 'IMPORTANT' | 'URGENT';
  authorId: string;
  authorName: string;
  authorRole: string;
  createdAt: string | Date;
}

interface AnnouncementsViewProps {
  userRole: 'LEARNER' | 'INSTRUCTOR' | 'ADMIN';
  announcements: AnnouncementItem[];
  programmes: { id: string; title: string; colorTag: string }[];
}

export function AnnouncementsView({
  userRole,
  announcements: initialAnnouncements,
  programmes,
}: AnnouncementsViewProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [announcements, setAnnouncements] = React.useState<AnnouncementItem[]>(initialAnnouncements);
  const [selectedFilter, setSelectedFilter] = React.useState<string>('ALL');

  // New Announcement Modal state
  const [modalOpen, setModalOpen] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');
  const [priority, setPriority] = React.useState<'NORMAL' | 'IMPORTANT' | 'URGENT'>('NORMAL');
  const [programmeId, setProgrammeId] = React.useState<string>('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const filteredAnnouncements = announcements.filter((a) => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'GLOBAL') return !a.programmeId;
    return a.programmeId === selectedFilter;
  });

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      showToast('Please provide both title and content', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const resp = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          priority,
          programmeId: programmeId || null,
        }),
      });

      const data = await resp.json();
      if (resp.ok) {
        setAnnouncements((prev) => [data.announcement, ...prev]);
        setModalOpen(false);
        setTitle('');
        setContent('');
        showToast('Announcement published to cohort feed', 'success');
        router.refresh();
      } else {
        showToast(data.error || 'Failed to publish announcement', 'error');
      }
    } catch {
      showToast('Network error publishing announcement', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="default">Advisories & Notices</Badge>
            <span className="text-xs text-ink-muted">Official Field Communications</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-ink tracking-tight">
            Announcements
          </h1>
          <p className="text-sm text-ink-muted">
            Important updates, schedule notifications, and field advisories from leadership.
          </p>
        </div>

        {(userRole === 'INSTRUCTOR' || userRole === 'ADMIN') && (
          <Button onClick={() => setModalOpen(true)} className="gap-2 self-start sm:self-auto">
            <Plus className="h-4 w-4" />
            Publish Announcement
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line pb-2">
        <button
          onClick={() => setSelectedFilter('ALL')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-element transition-colors ${
            selectedFilter === 'ALL'
              ? 'bg-brand-500 text-white'
              : 'text-ink-muted hover:text-ink hover:bg-brand-50/40'
          }`}
        >
          All ({announcements.length})
        </button>

        <button
          onClick={() => setSelectedFilter('GLOBAL')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-element transition-colors ${
            selectedFilter === 'GLOBAL'
              ? 'bg-brand-500 text-white'
              : 'text-ink-muted hover:text-ink hover:bg-brand-50/40'
          }`}
        >
          Institutional Notices
        </button>

        {programmes.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedFilter(p.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-element transition-colors flex items-center gap-1.5 ${
              selectedFilter === p.id
                ? 'bg-brand-500 text-white'
                : 'text-ink-muted hover:text-ink hover:bg-brand-50/40'
            }`}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.colorTag }} />
            {p.title}
          </button>
        ))}
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements.map((ann) => {
          const prog = programmes.find((p) => p.id === ann.programmeId);

          return (
            <Card key={ann.id} className="hover:border-brand-500/40 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {/* Priority Badge */}
                    {ann.priority === 'URGENT' && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-danger/15 text-danger border border-danger/30 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> URGENT
                      </span>
                    )}
                    {ann.priority === 'IMPORTANT' && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-warning/15 text-warning border border-warning/30 flex items-center gap-1">
                        <Info className="h-3 w-3" /> IMPORTANT
                      </span>
                    )}
                    {ann.priority === 'NORMAL' && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-brand-50 text-brand-500 border border-brand-500/20">
                        NOTICE
                      </span>
                    )}

                    {/* Department Tag */}
                    {prog ? (
                      <Badge dotColor={prog.colorTag}>{prog.title}</Badge>
                    ) : (
                      <Badge variant="outline">Institutional</Badge>
                    )}
                  </div>

                  <span className="text-xs text-ink-muted flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(ann.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <CardTitle className="text-lg pt-1 text-ink">{ann.title}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                <p className="text-sm text-ink-muted leading-relaxed whitespace-pre-wrap">
                  {ann.content}
                </p>

                <div className="pt-2 border-t border-line/60 flex items-center gap-1.5 text-xs text-ink-muted font-medium">
                  <User className="h-3.5 w-3.5 text-brand-500" />
                  <span>
                    Published by <b>{ann.authorName}</b> ({ann.authorRole})
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredAnnouncements.length === 0 && (
          <div className="p-8 text-center text-sm text-ink-muted rounded-element border border-dashed border-line">
            No announcements found in this category.
          </div>
        )}
      </div>

      {/* New Announcement Dialog Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Publish New Announcement</DialogTitle>
            <DialogDescription>
              Broadcast advisory notices and field schedule updates to cohorts.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateAnnouncement} className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-ink block">
                Announcement Title
              </label>
              <Input
                placeholder="e.g. Baseline Evaluation Schedule Release"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-ink block">
                  Priority Level
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full p-2.5 rounded-element border border-line bg-bg-main text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="NORMAL">Normal Notice</option>
                  <option value="IMPORTANT">Important</option>
                  <option value="URGENT">Urgent Action Required</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-ink block">
                  Target Programme
                </label>
                <select
                  value={programmeId}
                  onChange={(e) => setProgrammeId(e.target.value)}
                  className="w-full p-2.5 rounded-element border border-line bg-bg-main text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">All Cohorts (Global)</option>
                  {programmes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-ink block">
                Announcement Message
              </label>
              <Textarea
                rows={5}
                placeholder="Provide detailed instructions, drive links, or field deployment requirements..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-line">
              <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Publishing...' : 'Publish to Feed'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
