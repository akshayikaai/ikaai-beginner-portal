'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { useTheme } from '@/components/theme-provider';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { Sun, Moon, Laptop, User, Shield } from 'lucide-react';

export default function SettingsPage() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();

  const [displayName, setDisplayName] = React.useState(session?.user?.name || '');

  React.useEffect(() => {
    if (session?.user?.name) setDisplayName(session.user.name);
  }, [session]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Account preferences updated successfully', 'success');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-ink">Account Settings</h1>
        <p className="text-sm text-ink-muted">Manage your profile, display preferences, and theme.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-brand-500">
            <User className="h-5 w-5" />
            <CardTitle className="text-base">Profile Information</CardTitle>
          </div>
          <CardDescription>Your registered Ikaai identity and role.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider block">
                Full Name
              </label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your full name"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider block">
                Work Email
              </label>
              <Input value={session?.user?.email || ''} disabled className="opacity-60 cursor-not-allowed" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider block">
                Assigned Role
              </label>
              <Input value={session?.user?.role || 'LEARNER'} disabled className="opacity-60 cursor-not-allowed" />
            </div>

            <Button type="submit">Save changes</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-brand-500">
            <Shield className="h-5 w-5" />
            <CardTitle className="text-base">Appearance & Theme</CardTitle>
          </div>
          <CardDescription>Select light, dark, or automatic system theme.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-3 rounded-element border text-center transition-colors flex flex-col items-center gap-2 min-h-[44px] ${
                theme === 'light'
                  ? 'border-brand-500 bg-brand-50 text-brand-500 font-semibold'
                  : 'border-line bg-bg-main text-ink-muted hover:text-ink'
              }`}
            >
              <Sun className="h-5 w-5" />
              <span className="text-xs">Light</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-3 rounded-element border text-center transition-colors flex flex-col items-center gap-2 min-h-[44px] ${
                theme === 'dark'
                  ? 'border-brand-500 bg-brand-50/20 text-brand-500 font-semibold'
                  : 'border-line bg-bg-main text-ink-muted hover:text-ink'
              }`}
            >
              <Moon className="h-5 w-5" />
              <span className="text-xs">Dark</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('system')}
              className={`p-3 rounded-element border text-center transition-colors flex flex-col items-center gap-2 min-h-[44px] ${
                theme === 'system'
                  ? 'border-brand-500 bg-brand-50 text-brand-500 font-semibold'
                  : 'border-line bg-bg-main text-ink-muted hover:text-ink'
              }`}
            >
              <Laptop className="h-5 w-5" />
              <span className="text-xs">System</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
