'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/layout/Header';

export default function QuizSelectionPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        title="Quiz Mode" 
        subtitle="Choose your role in the quiz competition"
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
              🎯 Quiz Competition
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Interactive trivia with real-time buzzers and live scoring. Choose your role to get started!
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Host Card */}
            <Card className="bg-white/10 backdrop-blur border-white/20 hover:bg-white/15 transition-all duration-200 hover:scale-105">
              <CardHeader className="text-center">
                <div className="text-5xl mb-4">🎮</div>
                <CardTitle className="text-white text-2xl">Host a Quiz</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-300 text-center">
                  Control the quiz, manage questions, and track team scores in real-time.
                </p>
                <div className="space-y-2 text-sm text-slate-400">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400">✅</span>
                    <span>Manage 13 trivia questions</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400">✅</span>
                    <span>Control question flow</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400">✅</span>
                    <span>Award points to teams</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400">✅</span>
                    <span>View live buzz rankings</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400">✅</span>
                    <span>Reveal correct answers</span>
                  </div>
                </div>
                <Link href="/quiz/host" className="block">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    🎯 Start Hosting Quiz
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Participant Card */}
            <Card className="bg-white/10 backdrop-blur border-white/20 hover:bg-white/15 transition-all duration-200 hover:scale-105">
              <CardHeader className="text-center">
                <div className="text-5xl mb-4">🚨</div>
                <CardTitle className="text-white text-2xl">Join as Player</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-300 text-center">
                  Buzz in to answer questions and compete with other teams for the top score.
                </p>
                <div className="space-y-2 text-sm text-slate-400">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400">✅</span>
                    <span>Mobile-optimized buzzer</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400">✅</span>
                    <span>Haptic feedback on mobile</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400">✅</span>
                    <span>Real-time question sync</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400">✅</span>
                    <span>Celebration animations</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400">✅</span>
                    <span>Live scoring updates</span>
                  </div>
                </div>
                <Link href="/quiz/join" className="block">
                  <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                    🚨 Join Quiz Competition
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Quiz Info */}
          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold text-white mb-8">About This Quiz</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white/5 rounded-lg p-6 backdrop-blur">
                <div className="text-3xl mb-4">📚</div>
                <h3 className="text-lg font-semibold text-white mb-2">Varied Topics</h3>
                <p className="text-slate-400 text-sm">
                  Pop culture, movies, music, and company-specific questions
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-6 backdrop-blur">
                <div className="text-3xl mb-4">⚡</div>
                <h3 className="text-lg font-semibold text-white mb-2">Fast-Paced</h3>
                <p className="text-slate-400 text-sm">
                  Quick buzzer responses with millisecond timing precision
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-6 backdrop-blur">
                <div className="text-3xl mb-4">🏆</div>
                <h3 className="text-lg font-semibold text-white mb-2">Competitive</h3>
                <p className="text-slate-400 text-sm">
                  Real-time scoring and rankings to crown the ultimate winner
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}