'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, BarChart3, LogOut, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { BrandMark } from '@/components/layout/BrandMark';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Auto redirect based on authentication status
  React.useEffect(() => {
    if (user) {
      router.push('/dashboard');
    } else {
      router.push('/mode');
    }
  }, [router, user]);

  const features = [
    {
      icon: <Zap />,
      title: 'Buzzer rounds',
      body: 'Phones become buzzers. First tap wins the floor, scores update live, confetti included.',
    },
    {
      icon: <BarChart3 />,
      title: 'Live polls',
      body: 'Ask the room, watch the bars move, and reveal results on your cue.',
    },
    {
      icon: <Sparkles />,
      title: 'AI question drafts',
      body: 'Type a topic, get a round of multiple-choice questions you can edit and reorder.',
    },
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

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="max-w-3xl animate-fade-up">
            <p className="eyebrow mb-4">Live quizzes · buzzers · polls</p>
            <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
              Run the room like a <span className="text-primary">game show</span>.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              Build a quiz in minutes, put a buzzer on every phone, and keep the scores, reveals and polls on one screen. Made for classrooms, team events and trivia nights.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button onClick={() => router.push('/mode')} size="xl">
                Get started <ArrowRight />
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link href="/quiz/join">I have a join code</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border bg-surface/60 py-16 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 max-w-2xl">
            <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              Everything you need to engage your audience
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              Create, run and analyze sessions without juggling three tools.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="rounded-xl border border-border bg-card p-6 shadow-card animate-fade-up"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary [&_svg]:size-5">
                  {f.icon}
                </span>
                <h3 className="font-display text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-primary/30 bg-primary/10 p-8 sm:flex-row sm:items-center sm:p-10">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Ready to get started?</h2>
              <p className="mt-2 text-base text-muted-foreground">Join educators and event organizers hosting live sessions with Audience Voice.</p>
            </div>
            <Button onClick={() => router.push('/mode')} size="xl" className="shrink-0">
              Get started <ArrowRight />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
