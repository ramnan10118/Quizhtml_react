'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Briefcase, GraduationCap, LogOut, PartyPopper, Vote, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { BrandMark } from '@/components/layout/BrandMark';
import { useAuth } from '@/contexts/AuthContext';

export default function ModeSelectionPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  // Redirect authenticated users to dashboard
  React.useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const modes = [
    {
      icon: <Zap />,
      title: 'Interactive quizzes',
      description: 'Engage your audience with buzzer rounds, self-paced quizzes and scheduled reveals.',
      features: [
        'Buzzer mode with real-time competition',
        'Self-paced mode for individual answers',
        'Scheduled mode with controlled reveals',
        'AI-generated questions on any topic',
      ],
      joinHref: '/quiz/join',
      joinLabel: 'Join a quiz',
    },
    {
      icon: <Vote />,
      title: 'Live polling',
      description: 'Capture opinions in seconds and show the results as they come in.',
      features: [
        'Custom question creation',
        'Up to 6 answer options',
        'Live result visualization',
        'Real-time vote tracking',
      ],
      joinHref: '/polling/join',
      joinLabel: 'Join a poll',
    },
  ];

  const useCases = [
    { icon: <Briefcase />, title: 'Corporate', body: 'Team building and training' },
    { icon: <GraduationCap />, title: 'Education', body: 'Classroom engagement' },
    { icon: <PartyPopper />, title: 'Entertainment', body: 'Parties and events' },
  ];

  return (
    <div className="app-bg min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <BrandMark />
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="hidden max-w-[200px] truncate text-sm text-muted-foreground sm:inline">
                  {user.user_metadata?.full_name || user.email}
                </span>
                <Button onClick={handleSignOut} variant="ghost" size="sm">
                  <LogOut /> Sign out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/auth/login">Sign in</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/auth/signup">Sign up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-20">
        <div className="mb-12 max-w-2xl animate-fade-up">
          <p className="eyebrow mb-3">Two ways to run a session</p>
          <h1 className="font-display text-3xl font-bold text-foreground sm:text-5xl">
            Quizzes for competition. Polls for opinions.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Hosting needs an account. Joining never does: participants just open a link on their phone.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {modes.map((mode, i) => (
            <article
              key={mode.title}
              className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-card animate-fade-up sm:p-7"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary [&_svg]:size-6">
                {mode.icon}
              </span>
              <h2 className="font-display text-xl font-semibold text-foreground">{mode.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{mode.description}</p>
              <ul className="mt-5 space-y-2.5">
                {mode.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-foreground/90">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="mt-7 flex flex-col gap-2 border-t border-border pt-5 sm:flex-row">
                <Button asChild className="flex-1">
                  <Link href={user ? '/dashboard' : '/auth/login'}>
                    Host a session <ArrowRight />
                  </Link>
                </Button>
                <Button variant="outline" asChild className="flex-1">
                  <Link href={mode.joinHref}>{mode.joinLabel}</Link>
                </Button>
              </div>
            </article>
          ))}
        </div>

        {/* Use Cases */}
        <section className="mt-20">
          <h2 className="eyebrow mb-6 text-center">Perfect for any event</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {useCases.map((u) => (
              <div key={u.title} className="flex items-center gap-4 rounded-xl border border-border bg-card/60 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground [&_svg]:size-5">
                  {u.icon}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{u.title}</h3>
                  <p className="text-xs text-muted-foreground">{u.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
