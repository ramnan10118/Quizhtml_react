'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/layout/Header';

export default function ModeSelectionPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        title="Quiz & Polling Platform" 
        subtitle="Choose your activity mode"
      />
      
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Choose Your Mode
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Select the type of interactive experience you want to create or join.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Quiz Mode Card */}
            <Card className="bg-white/10 backdrop-blur border-white/20 hover:bg-white/15 transition-all duration-200 hover:scale-105">
              <CardHeader className="text-center">
                <div className="text-6xl mb-4">🎯</div>
                <CardTitle className="text-white text-3xl">Quiz Mode</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-300 text-center text-lg">
                  Interactive trivia competition with real-time buzzers, scoring, and team rankings.
                </p>
                <div className="space-y-3 text-sm text-slate-400">
                  <div className="flex items-center space-x-3">
                    <span className="text-green-400">✅</span>
                    <span>13 engaging trivia questions</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-green-400">✅</span>
                    <span>Lightning-fast buzzer system</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-green-400">✅</span>
                    <span>Real-time scoring & rankings</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-green-400">✅</span>
                    <span>Interactive answer reveals</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-green-400">✅</span>
                    <span>Mobile-optimized experience</span>
                  </div>
                </div>
                <Link href="/quiz" className="block">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-3">
                    🎮 Enter Quiz Mode
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Polling Mode Card */}
            <Card className="bg-white/10 backdrop-blur border-white/20 hover:bg-white/15 transition-all duration-200 hover:scale-105">
              <CardHeader className="text-center">
                <div className="text-6xl mb-4">🗳️</div>
                <CardTitle className="text-white text-3xl">Live Polling</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-300 text-center text-lg">
                  Create instant polls with custom questions and see real-time audience responses.
                </p>
                <div className="space-y-3 text-sm text-slate-400">
                  <div className="flex items-center space-x-3">
                    <span className="text-green-400">✅</span>
                    <span>Custom question creation</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-green-400">✅</span>
                    <span>Up to 6 answer options</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-green-400">✅</span>
                    <span>Live result visualization</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-green-400">✅</span>
                    <span>Instant audience feedback</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-green-400">✅</span>
                    <span>Real-time vote tracking</span>
                  </div>
                </div>
                <Link href="/polling" className="block">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white text-lg py-3">
                    📊 Enter Polling Mode
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Features Comparison */}
          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold text-white mb-8">Perfect for Any Event</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white/5 rounded-lg p-6 backdrop-blur">
                <div className="text-3xl mb-4">🏢</div>
                <h3 className="text-lg font-semibold text-white mb-2">Corporate Events</h3>
                <p className="text-slate-400 text-sm">
                  Team building, training sessions, and company meetings
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-6 backdrop-blur">
                <div className="text-3xl mb-4">🎓</div>
                <h3 className="text-lg font-semibold text-white mb-2">Education</h3>
                <p className="text-slate-400 text-sm">
                  Classroom engagement, quizzes, and student feedback
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-6 backdrop-blur">
                <div className="text-3xl mb-4">🎉</div>
                <h3 className="text-lg font-semibold text-white mb-2">Entertainment</h3>
                <p className="text-slate-400 text-sm">
                  Parties, social events, and friendly competitions
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center py-6 text-slate-400">
        <p>&copy; 2024 Quiz & Polling Platform. Built with Next.js & Socket.io</p>
      </footer>
    </div>
  );
}