'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Button } from './Button';
import QRCode from 'qrcode';

interface SharePanelProps {
  joinPath: string;
  title: string;
  description: string;
}

export function SharePanel({ joinPath, title, description }: SharePanelProps) {
  const [activeTab, setActiveTab] = useState<'qr' | 'link'>('qr');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [joinUrl, setJoinUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const fullUrl = `${window.location.origin}${joinPath}`;
      setJoinUrl(fullUrl);

      // Generate QR Code
      QRCode.toDataURL(fullUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#ffffff',
          light: '#000000'
        }
      }).then(url => {
        setQrCodeUrl(url);
      });
    }
  }, [joinPath]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-gray-100 text-lg">{title}</CardTitle>
        <p className="text-gray-600 dark:text-gray-400 text-sm">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-dark-700 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('qr')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'qr'
                ? 'bg-white dark:bg-dark-600 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            QR Code
          </button>
          <button
            onClick={() => setActiveTab('link')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'link'
                ? 'bg-white dark:bg-dark-600 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            Link
          </button>
        </div>

        {/* QR Code Tab */}
        {activeTab === 'qr' && (
          <div className="text-center space-y-4">
            {qrCodeUrl && (
              <div className="bg-white dark:bg-gray-100 border border-gray-200 dark:border-dark-600 rounded-lg p-4 inline-block">
                <img src={qrCodeUrl} alt="QR Code" className="w-40 h-40" />
              </div>
            )}
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Participants can scan this QR code to join instantly
            </p>
          </div>
        )}

        {/* Link Tab */}
        {activeTab === 'link' && (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg p-3">
              <p className="text-gray-500 dark:text-gray-400 text-xs mb-2">Join Link:</p>
              <code className="text-gray-800 dark:text-gray-200 text-sm break-all font-mono">{joinUrl}</code>
            </div>
            <Button
              onClick={copyToClipboard}
              variant="outline"
              className="w-full"
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
            <p className="text-gray-600 dark:text-gray-400 text-sm text-center">
              Share this link with participants to let them join
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}