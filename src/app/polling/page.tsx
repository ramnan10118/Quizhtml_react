'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/layout/Header';

export default function PollingSelectionPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        title="Live Polling Mode" 
        subtitle="Choose your role in the polling session"
      >
        <Link href="/mode">
          <Button variant="outline" size="sm">
            ← Back to Mode Selection
          </Button>
        </Link>
      </Header>
      
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              🗳️ Live Polling
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Create instant polls with custom questions and see real-time audience responses. Choose your role to get started!
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Host Card */}
            <Card className="bg-white/10 backdrop-blur border-white/20 hover:bg-white/15 transition-all duration-200 hover:scale-105">
              <CardHeader className="text-center">
                <div className="text-5xl mb-4">👨‍💼</div>
                <CardTitle className="text-white text-2xl">Host Polling Session</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-300 text-center">
                  Create and manage live polls with custom questions and real-time result visualization.
                </p>
                <div className="space-y-2 text-sm text-slate-400">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400">✅</span>
                    <span>Create unlimited custom polls</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400">✅</span>
                    <span>Add up to 6 answer options</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400">✅</span>
                    <span>View live voting results</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400">✅</span>
                    <span>Control poll visibility & timing</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400">✅</span>
                    <span>See participant names & votes</span>
                  </div>
                </div>
                <Link href="/polling/host" className="block">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                    📊 Start Hosting Polls
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Participant Card */}
            <Card className="bg-white/10 backdrop-blur border-white/20 hover:bg-white/15 transition-all duration-200 hover:scale-105">
              <CardHeader className="text-center">
                <div className="text-5xl mb-4">🙋‍♀️</div>
                <CardTitle className="text-white text-2xl">Join as Voter</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-300 text-center">
                  Participate in live polls by voting on questions and see how your responses compare to others.
                </p>
                <div className="space-y-2 text-sm text-slate-400">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400">✅</span>
                    <span>Vote on live poll questions</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400">✅</span>
                    <span>Mobile-optimized interface</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400">✅</span>
                    <span>Instant feedback on submission</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400">✅</span>
                    <span>See live results (when enabled)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400">✅</span>
                    <span>Simple one-tap voting</span>
                  </div>
                </div>
                <Link href="/polling/join" className="block">
                  <Button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white">
                    🗳️ Join Polling Session
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Polling Features */}
          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold text-white mb-8">Perfect for Interactive Engagement</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white/5 rounded-lg p-6 backdrop-blur">
                <div className="text-3xl mb-4">⚡</div>
                <h3 className="text-lg font-semibold text-white mb-2">Instant Results</h3>
                <p className="text-slate-400 text-sm">
                  See voting results update in real-time as participants submit their responses
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-6 backdrop-blur">
                <div className="text-3xl mb-4">🎯</div>
                <h3 className="text-lg font-semibold text-white mb-2">Custom Questions</h3>
                <p className="text-slate-400 text-sm">
                  Create any question with multiple choice answers tailored to your needs
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-6 backdrop-blur">
                <div className="text-3xl mb-4">📊</div>
                <h3 className="text-lg font-semibold text-white mb-2">Visual Analytics</h3>
                <p className="text-slate-400 text-sm">
                  Beautiful charts and percentages to analyze audience responses
                </p>
              </div>
            </div>
          </div>

          {/* Use Cases */}
          <div className="mt-12 grid md:grid-cols-2 gap-6">
            <div className="bg-white/5 rounded-lg p-6 backdrop-blur">
              <h3 className="text-lg font-semibold text-white mb-3">💼 Business Use Cases</h3>
              <ul className="text-slate-400 text-sm space-y-1">
                <li>• Team feedback and opinions</li>
                <li>• Meeting engagement & decisions</li>
                <li>• Training session assessments</li>
                <li>• Product feedback collection</li>
              </ul>
            </div>
            <div className="bg-white/5 rounded-lg p-6 backdrop-blur">
              <h3 className="text-lg font-semibold text-white mb-3">🎓 Educational Use Cases</h3>
              <ul className="text-slate-400 text-sm space-y-1">
                <li>• Student opinion polling</li>
                <li>• Quick comprehension checks</li>
                <li>• Class preference voting</li>
                <li>• Interactive discussions</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}