'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/layout/Header';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        title="Quiz Buzzer" 
        subtitle="Real-time Quiz Competition Platform"
      />
      
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              🎯 Quiz Buzzer
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Join the ultimate quiz competition! Test your knowledge with friends and compete in real-time.
            </p>
          </div>

          <div className="flex justify-center">
            <Link href="/mode" className="block">
              <Card className="bg-white/10 backdrop-blur border-white/20 hover:bg-white/15 transition-all duration-200 hover:scale-105 max-w-md">
                <CardHeader className="text-center">
                  <div className="text-6xl mb-4">🚀</div>
                  <CardTitle className="text-white text-3xl">Get Started</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-slate-300 text-center text-lg">
                    Choose between Quiz Competition or Live Polling to create engaging interactive experiences.
                  </p>
                  <div className="space-y-3 text-sm text-slate-400">
                    <div className="flex items-center space-x-3">
                      <span className="text-green-400">🎯</span>
                      <span>Interactive Quiz Competitions</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-green-400">🗳️</span>
                      <span>Live Audience Polling</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-green-400">📱</span>
                      <span>Mobile-Optimized Experience</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-green-400">⚡</span>
                      <span>Real-Time Interactions</span>
                    </div>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg py-3">
                    Choose Your Mode
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Features Section */}
          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold text-white mb-8">Why Choose Quiz Buzzer?</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white/5 rounded-lg p-6 backdrop-blur">
                <div className="text-3xl mb-4">⚡</div>
                <h3 className="text-lg font-semibold text-white mb-2">Real-time Competition</h3>
                <p className="text-slate-400 text-sm">
                  Lightning-fast buzzer system with millisecond precision timing
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-6 backdrop-blur">
                <div className="text-3xl mb-4">📱</div>
                <h3 className="text-lg font-semibold text-white mb-2">Mobile Optimized</h3>
                <p className="text-slate-400 text-sm">
                  Perfect experience on smartphones with touch feedback
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-6 backdrop-blur">
                <div className="text-3xl mb-4">🎉</div>
                <h3 className="text-lg font-semibold text-white mb-2">Interactive Fun</h3>
                <p className="text-slate-400 text-sm">
                  Confetti celebrations and smooth animations for winners
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center py-6 text-slate-400">
        <p>&copy; 2024 Quiz Buzzer. Built with Next.js & Socket.io</p>
      </footer>
    </div>
  );
}