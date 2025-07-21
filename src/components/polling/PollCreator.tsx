import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PollCreateData } from '@/types/polling';
import { cn } from '@/lib/utils';

interface PollCreatorProps {
  onCreatePoll: (data: PollCreateData) => void;
  isCreating?: boolean;
  className?: string;
}

export function PollCreator({ onCreatePoll, isCreating = false, className }: PollCreatorProps) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [errors, setErrors] = useState<{ question?: string; options?: string }>({});

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const validatePoll = (): boolean => {
    const newErrors: { question?: string; options?: string } = {};

    if (!question.trim()) {
      newErrors.question = 'Question is required';
    }

    const validOptions = options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      newErrors.options = 'At least 2 options are required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreatePoll = () => {
    if (validatePoll()) {
      const validOptions = options.filter(opt => opt.trim());
      onCreatePoll({
        question: question.trim(),
        options: validOptions
      });
      
      // Reset form
      setQuestion('');
      setOptions(['', '']);
      setErrors({});
    }
  };

  const canAddOption = options.length < 6;
  const canRemoveOption = options.length > 2;
  const hasValidData = question.trim() && options.filter(opt => opt.trim()).length >= 2;

  return (
    <Card className={cn('w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-dark-800 dark:to-dark-700', className)}>
      <CardHeader>
        <CardTitle className="text-slate-700 dark:text-gray-100 flex items-center space-x-2">
          <span>🗳️</span>
          <span>Create New Poll</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Question Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
            Poll Question *
          </label>
          <Input
            type="text"
            placeholder="What's your question?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className={cn(
              'text-lg py-3',
              errors.question && 'border-red-500 focus:ring-red-500'
            )}
            disabled={isCreating}
          />
          {errors.question && (
            <p className="text-sm text-red-600 dark:text-red-400">{errors.question}</p>
          )}
        </div>

        {/* Options */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
              Answer Options * (2-6 options)
            </label>
            <Button
              onClick={addOption}
              disabled={!canAddOption || isCreating}
              size="sm"
              variant="outline"
            >
              + Add Option
            </Button>
          </div>

          <div className="space-y-3">
            {options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 dark:bg-dark-600 text-slate-700 dark:text-gray-200 font-semibold text-sm">
                  {String.fromCharCode(65 + index)}
                </div>
                <Input
                  type="text"
                  placeholder={`Option ${String.fromCharCode(65 + index)}`}
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  className="flex-1"
                  disabled={isCreating}
                />
                {canRemoveOption && (
                  <Button
                    onClick={() => removeOption(index)}
                    disabled={isCreating}
                    size="sm"
                    variant="destructive"
                  >
                    ×
                  </Button>
                )}
              </div>
            ))}
          </div>

          {errors.options && (
            <p className="text-sm text-red-600 dark:text-red-400">{errors.options}</p>
          )}
        </div>

        {/* Create Button */}
        <div className="pt-4">
          <Button
            onClick={handleCreatePoll}
            disabled={!hasValidData || isCreating}
            className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600"
            size="lg"
          >
            {isCreating ? (
              <span className="flex items-center space-x-2">
                <span className="animate-spin">🔄</span>
                <span>Creating Poll...</span>
              </span>
            ) : (
              '🚀 Launch Poll'
            )}
          </Button>
        </div>

        {/* Helper Text */}
        <div className="text-xs text-slate-500 dark:text-gray-400 bg-slate-100 dark:bg-dark-800 rounded-lg p-3">
          <p className="font-medium mb-1">💡 Tips for great polls:</p>
          <ul className="space-y-1">
            <li>• Keep questions clear and concise</li>
            <li>• Ensure options are mutually exclusive</li>
            <li>• Use 3-4 options for best engagement</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}