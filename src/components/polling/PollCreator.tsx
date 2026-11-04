import * as React from 'react'
import { Lightbulb, Plus, Rocket, Save, Vote, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input, Label, Spinner, cn } from '@/components/ui'
import { PollCreateData } from '@/types/polling'

const { useState, useEffect } = React

interface PollCreatorProps {
  onCreatePoll: (data: PollCreateData) => void;
  isCreating?: boolean;
  className?: string;
  initialData?: PollCreateData | null;
  onDataChange?: (data: PollCreateData) => void;
  onSaveDraft?: () => void;
  showSaveDraft?: boolean;
}

export function PollCreator({
  onCreatePoll,
  isCreating = false,
  className,
  initialData = null,
  onDataChange,
  onSaveDraft,
  showSaveDraft = false
}: PollCreatorProps) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [errors, setErrors] = useState<{ question?: string; options?: string }>({});

  // Load initial data
  useEffect(() => {
    if (initialData && initialData.question && Array.isArray(initialData.options)) {
      setQuestion(initialData.question);
      setOptions(initialData.options.length >= 2 ? initialData.options : [...initialData.options, '', ''].slice(0, 6));

      // Notify parent of loaded data
      if (onDataChange && typeof onDataChange === 'function') {
        try {
          onDataChange(initialData);
        } catch (error) {
          console.error('Error calling onDataChange:', error);
        }
      }
    }
  }, [initialData, onDataChange]);

  // Notify parent of data changes when user saves or launches
  const getCurrentPollData = (): PollCreateData => {
    const validOptions = options.filter(opt => opt.trim());
    return {
      question: question.trim(),
      options: validOptions
    };
  };

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
      try {
        const pollData = getCurrentPollData();

        // Notify parent of current data
        if (onDataChange && typeof onDataChange === 'function') {
          onDataChange(pollData);
        }

        // Create the poll
        if (onCreatePoll && typeof onCreatePoll === 'function') {
          onCreatePoll(pollData);
        }

        // Reset form
        setQuestion('');
        setOptions(['', '']);
        setErrors({});
      } catch (error) {
        console.error('Error creating poll:', error);
      }
    }
  };

  const canAddOption = options.length < 6;
  const canRemoveOption = options.length > 2;
  const hasValidData = question.trim() && options.filter(opt => opt.trim()).length >= 2;

  const launchLabel = isCreating ? 'Connecting…' : 'Launch poll';

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Vote className="h-4 w-4 text-primary" /> New poll
        </CardTitle>
        <CardDescription>One question, two to six options. Launch when you are ready.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Question Input */}
        <div className="space-y-2">
          <Label htmlFor="poll-question">Poll question</Label>
          <Input
            id="poll-question"
            type="text"
            placeholder="What's your question?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className={cn('h-12 text-lg', errors.question && 'border-destructive focus-visible:ring-destructive/35')}
            disabled={isCreating}
            aria-invalid={Boolean(errors.question)}
          />
          {errors.question && (
            <p className="text-sm text-destructive">{errors.question}</p>
          )}
        </div>

        {/* Options */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Answer options <span className="font-normal text-muted-foreground">(2–6)</span></Label>
            <Button onClick={addOption} disabled={!canAddOption || isCreating} size="sm" variant="outline">
              <Plus /> Add option
            </Button>
          </div>

          <div className="space-y-2">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted font-display text-sm font-bold text-muted-foreground">
                  {String.fromCharCode(65 + index)}
                </span>
                <Input
                  type="text"
                  placeholder={`Option ${String.fromCharCode(65 + index)}`}
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  className="h-10 flex-1"
                  disabled={isCreating}
                  aria-label={`Option ${String.fromCharCode(65 + index)}`}
                />
                {canRemoveOption && (
                  <Button
                    onClick={() => removeOption(index)}
                    disabled={isCreating}
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Remove option ${String.fromCharCode(65 + index)}`}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {errors.options && (
            <p className="text-sm text-destructive">{errors.options}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 border-t border-border pt-5">
          {showSaveDraft && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                onClick={() => {
                  try {
                    if (onDataChange && typeof onDataChange === 'function') {
                      onDataChange(getCurrentPollData());
                    }
                    if (onSaveDraft && typeof onSaveDraft === 'function') {
                      onSaveDraft();
                    }
                  } catch (error) {
                    console.error('Error in save draft:', error);
                  }
                }}
                disabled={!hasValidData || isCreating}
                variant="outline"
                size="lg"
                className="flex-1"
              >
                <Save /> Save as draft
              </Button>
              <Button
                onClick={handleCreatePoll}
                disabled={!hasValidData || isCreating}
                size="lg"
                className="flex-1"
              >
                {isCreating ? <Spinner size="sm" /> : <Rocket />}
                {launchLabel}
              </Button>
            </div>
          )}
          {!showSaveDraft && (
            <Button
              onClick={handleCreatePoll}
              disabled={!hasValidData || isCreating}
              className="w-full"
              size="lg"
            >
              {isCreating ? <Spinner size="sm" /> : <Rocket />}
              {launchLabel}
            </Button>
          )}
        </div>

        {/* Helper Text */}
        <div className="flex gap-3 rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="mb-1 font-medium text-foreground">Tips for great polls</p>
            <ul className="list-disc space-y-0.5 pl-4">
              <li>Keep questions clear and concise</li>
              <li>Ensure options are mutually exclusive</li>
              <li>Use 3–4 options for best engagement</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
