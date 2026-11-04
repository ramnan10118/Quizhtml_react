'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, ArrowLeftRight, Check, CheckCircle2, GripVertical, ListChecks, Pencil, Plus, Rocket, Save, Sparkles, Trash2, Wand2, X } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell'
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input, Textarea, NativeSelect, Label, Badge,
  SegmentedControl, EmptyState, Spinner, LoadingScreen, Alert, AlertDescription,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui'
import { AnswerOption } from '@/components/quiz/AnswerOption';
import { QuizQuestion, QuizSettings } from '@/types/quiz';
import { quizDrafts, liveQuizzes } from '@/lib/drafts';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { cn, getOptionLabel } from '@/lib/utils';

const MODE_LABELS: Record<'buzzer' | 'basic' | 'scheduled', string> = {
  buzzer: 'Buzzer',
  basic: 'Self-paced',
  scheduled: 'Scheduled reveal',
};

function QuizSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, session } = useAuth();
  const authHeaders = (): Record<string, string> => ({
    'Content-Type': 'application/json',
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
  });

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentDraft, setCurrentDraft] = useState<string | null>(null);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('ai');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Quiz mode state
  const [selectedMode, setSelectedMode] = useState<'buzzer' | 'basic' | 'scheduled'>('buzzer');
  const [modeSettings, setModeSettings] = useState<QuizSettings | null>(null);

  // Save draft modal state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [saving, setSaving] = useState(false);

  // AI Generation State
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);

  // Manual Entry State
  const [manualQuestion, setManualQuestion] = useState<QuizQuestion>({
    text: '',
    options: ['', '', '', ''],
    correct: 0
  });
  const [isEnhancingManual, setIsEnhancingManual] = useState(false);
  const [enhancementPreview, setEnhancementPreview] = useState<{
    original: QuizQuestion;
    enhanced: QuizQuestion;
  } | null>(null);

  // Question Management State
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [reorderingIndex, setReorderingIndex] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const topicSuggestions = [
    'History', 'Science', 'Technology', 'Geography', 'Literature',
    'Movies & Entertainment', 'Sports', 'Art & Culture', 'Music', 'General Knowledge'
  ];

  // Load questions from sessionStorage, draft, or start fresh
  useEffect(() => {
    const loadData = async () => {
      const draftId = searchParams.get('draft');

      // Load selected mode and settings from sessionStorage
      try {
        const savedMode = sessionStorage.getItem('selectedQuizMode');
        const savedSettings = sessionStorage.getItem('selectedQuizSettings');

        if (savedMode) {
          setSelectedMode(savedMode as 'buzzer' | 'basic' | 'scheduled');
        }

        if (savedSettings) {
          setModeSettings(JSON.parse(savedSettings));
        }
      } catch (error) {
        console.error('Error loading mode from sessionStorage:', error);
      }

      // First try to load from sessionStorage (for refresh persistence)
      try {
        const savedQuestions = sessionStorage.getItem('currentQuestions');
        if (savedQuestions) {
          const parsed = JSON.parse(savedQuestions);
          if (parsed && parsed.length > 0) {
            console.log('📚 Loading saved questions:', parsed.length);
            setQuestions(parsed);
            setIsLoaded(true);
            return;
          }
        }
      } catch (error) {
        console.error('Error loading from sessionStorage:', error);
      }

      if (draftId && user) {
        // Load from draft if no saved questions
        setLoadingDraft(true);
        try {
          const draft = await quizDrafts.getById(draftId);
          if (draft && draft.questions) {
            setQuestions(draft.questions);
            setCurrentDraft(draftId);
          } else {
            setErrorMessage('Draft not found');
          }
        } catch (error) {
          setErrorMessage('Failed to load draft');
          console.error('Draft loading error:', error);
        } finally {
          setLoadingDraft(false);
        }
      } else {
        // Start with empty questions for new quiz
        setQuestions([]);
      }

      setIsLoaded(true);
    };

    loadData();
  }, [searchParams, user]);

  // Save questions to sessionStorage whenever they change
  useEffect(() => {
    if (isLoaded && questions.length > 0) {
      try {
        sessionStorage.setItem('currentQuestions', JSON.stringify(questions));
      } catch (error) {
        console.error('Error saving to sessionStorage:', error);
      }
    }
  }, [questions, isLoaded]);

  const handleAIGenerate = async () => {
    if (!topic.trim()) {
      setErrorMessage('Please enter a topic for your questions');
      return;
    }

    setIsGenerating(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ topic: topic.trim(), difficulty, questionCount })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to generate questions`);
      }

      const data = await response.json();

      if (data.success && data.questions) {
        setQuestions([...data.questions, ...questions]);
        setTopic('');
        setActiveTab('manual'); // Switch to show added questions
      } else {
        throw new Error('Invalid response from question generator');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to generate questions');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEnhanceManualQuestion = async () => {
    if (!manualQuestion.text.trim() || !manualQuestion.options.every(opt => opt.trim())) {
      setErrorMessage('Please fill in all question fields before enhancing');
      return;
    }

    setIsEnhancingManual(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/enhance-question', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          question: manualQuestion,
          enhancementType: 'clarity'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to enhance question');
      }

      const data = await response.json();
      if (data.success && data.enhancedQuestion) {
        setEnhancementPreview({
          original: { ...manualQuestion },
          enhanced: data.enhancedQuestion
        });
      } else {
        throw new Error('Invalid response from enhancement service');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to enhance question');
    } finally {
      setIsEnhancingManual(false);
    }
  };

  const handleAcceptEnhancement = () => {
    if (enhancementPreview) {
      setManualQuestion(enhancementPreview.enhanced);
    }
    setEnhancementPreview(null);
  };

  const handleAcceptAndAddQuestion = () => {
    if (enhancementPreview) {
      setQuestions([{ ...enhancementPreview.enhanced }, ...questions]);
      setManualQuestion({ text: '', options: ['', '', '', ''], correct: 0 });
    }
    setEnhancementPreview(null);
  };

  const handleRejectEnhancement = () => {
    setEnhancementPreview(null);
  };

  const handleAddManualQuestion = () => {
    if (!manualQuestion.text.trim() || !manualQuestion.options.every(opt => opt.trim())) {
      setErrorMessage('Please fill in all question fields');
      return;
    }

    setQuestions([{ ...manualQuestion }, ...questions]);
    setManualQuestion({ text: '', options: ['', '', '', ''], correct: 0 });
    setErrorMessage('');
  };

  const handleDeleteQuestion = (index: number) => {
    if (confirm('Are you sure you want to delete this question?')) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const handleEditQuestion = (index: number, updatedQuestion: QuizQuestion) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = updatedQuestion;
    setQuestions(updatedQuestions);
    setEditingIndex(null);
  };

  const handleDeleteAllQuestions = () => {
    if (confirm('Are you sure you want to delete all questions? This action cannot be undone.')) {
      setQuestions([]);
      setEditingIndex(null);
      setReorderingIndex(null);
    }
  };

  const handleStartReordering = (index: number) => {
    if (isAnimating) return; // Prevent reordering during animation

    if (reorderingIndex === null) {
      setReorderingIndex(index);
    } else if (reorderingIndex === index) {
      // Cancel reordering if clicking the same number
      setReorderingIndex(null);
    } else {
      // Start animation
      setIsAnimating(true);

      // Add a brief delay to show the animation effect
      setTimeout(() => {
        // Move question from reorderingIndex to index position
        const newQuestions = [...questions];
        const [questionToMove] = newQuestions.splice(reorderingIndex, 1);
        newQuestions.splice(index, 0, questionToMove);
        setQuestions(newQuestions);
        setReorderingIndex(null);

        // End animation after the move
        setTimeout(() => {
          setIsAnimating(false);
        }, 100);
      }, 150);
    }
  };

  const handleLaunchQuiz = async () => {
    if (questions.length === 0) {
      setErrorMessage('Please add some questions before launching the quiz.');
      return;
    }

    setErrorMessage('');

    try {
      if (selectedMode === 'scheduled') {
        // Scheduled mode: Create live quiz in database
        const liveQuiz = await liveQuizzes.launch({
          title: currentDraft ? 'Live Quiz' : 'Custom Live Quiz',
          questions: questions,
          settings: modeSettings || {
            timeLimit: undefined,
            allowRetakes: false,
            showCorrectAnswers: true,
            passingScore: undefined
          }
        });

        // Navigate to host page with live quiz ID
        router.push(`/quiz/host?live=${liveQuiz.id}`);
      } else {
        // Buzzer and Basic modes: Use sessionStorage
        sessionStorage.setItem('customQuestions', JSON.stringify(questions));
        sessionStorage.setItem('selectedQuizMode', selectedMode);
        sessionStorage.setItem('selectedQuizSettings', JSON.stringify(modeSettings || {
          mode: selectedMode,
          showCorrectAnswers: true
        }));

        // Navigate to host page
        router.push('/quiz/host');
      }
    } catch (error) {
      setErrorMessage(`Failed to launch ${selectedMode} quiz. Please try again.`);
      console.error(`Launch ${selectedMode} quiz error:`, error);
    }
  };

  const handleSaveDraft = async () => {
    if (!draftName.trim()) {
      setErrorMessage('Please enter a name for your draft');
      return;
    }

    if (questions.length === 0) {
      setErrorMessage('Add at least one question before saving');
      return;
    }

    setSaving(true);
    setErrorMessage('');

    try {
      await quizDrafts.save({
        title: draftName.trim(),
        questions: questions
      });

      setShowSaveModal(false);
      setDraftName('');
      setErrorMessage('Draft saved successfully!');
    } catch {
      setErrorMessage('Failed to save draft. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenSaveModal = () => {
    if (questions.length === 0) {
      setErrorMessage('Add at least one question before saving');
      return;
    }
    setErrorMessage('');
    setShowSaveModal(true);
  };

  const isValidQuiz = questions.length >= 3 && questions.every(q =>
    q.text.trim() !== '' && q.options.every(opt => opt.trim() !== '')
  );

  // ---- Presentation-only helpers ----
  const closeSaveModal = () => {
    setShowSaveModal(false);
    setDraftName('');
    setErrorMessage('');
  };
  const isSuccessMessage = errorMessage.includes('successfully');
  const manualReady = Boolean(manualQuestion.text.trim()) && manualQuestion.options.every(opt => opt.trim());

  return (
    <ProtectedRoute>
      <AppShell
        backHref="/dashboard"
        backLabel="Quiz"
        eyebrow={currentDraft ? 'Edit draft' : 'New quiz'}
        title={loadingDraft ? 'Loading draft…' : currentDraft ? 'Edit quiz draft' : 'Build your quiz'}
        subtitle="Generate questions with AI or write them by hand, then launch."
        headingActions={
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 shadow-card">
            <span className="eyebrow">Mode</span>
            <Badge variant="default">{MODE_LABELS[selectedMode]}</Badge>
            <Link href="/quiz" className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground focus-ring rounded">
              <ArrowLeftRight className="h-3.5 w-3.5" /> Change
            </Link>
          </div>
        }
        mainClassName="pb-28"
      >
        {errorMessage && (
          <Alert variant={isSuccessMessage ? 'success' : 'destructive'} className="mb-5 animate-fade-up">
            {isSuccessMessage ? <CheckCircle2 /> : <AlertTriangle />}
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Panel - Creation Methods */}
          <div className="space-y-4 lg:col-span-5 xl:col-span-4">
            <SegmentedControl<'ai' | 'manual'>
              value={activeTab}
              onChange={setActiveTab}
              aria-label="Question source"
              options={[
                { value: 'ai', label: 'Generate with AI', icon: <Sparkles /> },
                { value: 'manual', label: 'Write manually', icon: <Pencil /> },
              ]}
            />

            {/* AI Generation Panel */}
            {activeTab === 'ai' && (
              <Card className="animate-fade-in">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" /> AI question generator
                  </CardTitle>
                  <CardDescription>Describe a topic and we will draft multiple-choice questions for you.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="ai-topic">Topic or subject</Label>
                    <Input
                      id="ai-topic"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g. World War II, JavaScript, Biology"
                      disabled={isGenerating}
                    />
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {topicSuggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => setTopic(suggestion)}
                          disabled={isGenerating}
                          className={cn(
                            'h-8 rounded-full border px-3 text-xs font-medium transition-colors focus-ring',
                            topic === suggestion
                              ? 'border-primary bg-primary/10 text-foreground'
                              : 'border-border bg-surface-raised text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground'
                          )}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="ai-difficulty">Difficulty</Label>
                      <NativeSelect
                        id="ai-difficulty"
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value as 'Easy' | 'Medium' | 'Hard')}
                        disabled={isGenerating}
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </NativeSelect>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ai-count">
                        Questions <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-xs text-foreground tabular">{questionCount}</span>
                      </Label>
                      <input
                        id="ai-count"
                        type="range"
                        min="1"
                        max="20"
                        value={questionCount}
                        onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                        disabled={isGenerating}
                        className="mt-3"
                      />
                      <div className="flex justify-between text-[11px] text-muted-foreground tabular">
                        <span>1</span>
                        <span>20</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleAIGenerate}
                    disabled={isGenerating || !topic.trim()}
                    className="w-full"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Spinner size="sm" /> Generating…
                      </>
                    ) : (
                      <>
                        <Wand2 /> Generate {questionCount} question{questionCount === 1 ? '' : 's'}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Manual Entry Panel */}
            {activeTab === 'manual' && (
              <Card className="animate-fade-in">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Pencil className="h-4 w-4 text-primary" /> Write a question
                  </CardTitle>
                  <CardDescription>Four options; pick the correct one with the radio button.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="manual-question">Question</Label>
                    <Textarea
                      id="manual-question"
                      value={manualQuestion.text}
                      onChange={(e) => setManualQuestion({ ...manualQuestion, text: e.target.value })}
                      placeholder="Enter your question..."
                      rows={3}
                    />
                  </div>

                  <fieldset className="space-y-2">
                    <legend className="text-sm font-medium leading-none">Answer options</legend>
                    <div className="space-y-2 pt-1">
                      {manualQuestion.options.map((option, index) => {
                        const isCorrect = manualQuestion.correct === index
                        return (
                          <div
                            key={index}
                            className={cn(
                              'flex items-center gap-2 rounded-lg border p-1.5 pl-3 transition-colors',
                              isCorrect ? 'border-success/50 bg-success/5' : 'border-transparent'
                            )}
                          >
                            <input
                              type="radio"
                              name="correct-manual"
                              aria-label={`Mark option ${getOptionLabel(index)} as correct`}
                              checked={isCorrect}
                              onChange={() => setManualQuestion({ ...manualQuestion, correct: index })}
                            />
                            <span className={cn('w-5 text-sm font-bold', isCorrect ? 'text-success' : 'text-muted-foreground')}>
                              {getOptionLabel(index)}
                            </span>
                            <Input
                              value={option}
                              onChange={(e) => {
                                const updatedOptions = [...manualQuestion.options];
                                updatedOptions[index] = e.target.value;
                                setManualQuestion({ ...manualQuestion, options: updatedOptions });
                              }}
                              placeholder={`Option ${getOptionLabel(index)}`}
                              className="h-10 flex-1"
                              aria-label={`Option ${getOptionLabel(index)}`}
                            />
                          </div>
                        )
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      The highlighted row is the correct answer.
                    </p>
                  </fieldset>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button
                      onClick={handleEnhanceManualQuestion}
                      disabled={!manualQuestion.text.trim() || !manualQuestion.options.every(opt => opt.trim()) || isEnhancingManual}
                      variant="outline"
                    >
                      {isEnhancingManual ? <Spinner size="sm" /> : <Sparkles />}
                      {isEnhancingManual ? 'Enhancing…' : 'Enhance'}
                    </Button>
                    <Button
                      onClick={handleAddManualQuestion}
                      disabled={!manualQuestion.text.trim() || !manualQuestion.options.every(opt => opt.trim())}
                    >
                      <Plus /> Add question
                    </Button>
                  </div>
                  {!manualReady && (
                    <p className="text-xs text-muted-foreground">Fill in the question and all four options to enable these actions.</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Panel - Question Management */}
          <div className="lg:col-span-7 xl:col-span-8">
            <Card>
              <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 pb-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ListChecks className="h-4 w-4 text-primary" /> Questions
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground tabular">{questions.length}</span>
                  </CardTitle>
                  <CardDescription>
                    {reorderingIndex !== null
                      ? 'Reordering: click another number to move the selected question there.'
                      : 'Click a number to reorder. Newest questions appear first.'}
                  </CardDescription>
                </div>
                {questions.length > 0 && (
                  <Button onClick={handleDeleteAllQuestions} variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                    <Trash2 /> Clear all
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {questions.length === 0 ? (
                  <EmptyState
                    icon={<ListChecks />}
                    title="No questions yet"
                    description="Generate a set with AI or write your first question in the panel on the left. You need at least three to launch."
                  />
                ) : (
                  <div className="space-y-3">
                    {questions.map((question, index) => (
                      <div
                        key={`question-${question.text.slice(0, 20)}-${index}`}
                        className={`transform transition-all duration-500 ease-in-out ${
                          isAnimating && reorderingIndex === index
                            ? 'scale-105 opacity-75'
                            : ''
                        }`}
                        style={{
                          transitionProperty: 'transform, opacity, scale',
                        }}
                      >
                        <QuestionItem
                          question={question}
                          index={index}
                          isEditing={editingIndex === index}
                          isReordering={reorderingIndex !== null}
                          reorderingIndex={reorderingIndex}
                          isAnimating={isAnimating}
                          onEdit={(updatedQuestion) => handleEditQuestion(index, updatedQuestion)}
                          onDelete={() => handleDeleteQuestion(index)}
                          onStartEdit={() => setEditingIndex(index)}
                          onCancelEdit={() => setEditingIndex(null)}
                          onStartReordering={handleStartReordering}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sticky action bar */}
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground tabular">
                {questions.length} question{questions.length !== 1 ? 's' : ''}
                <span className="font-medium text-muted-foreground"> · {MODE_LABELS[selectedMode]}</span>
              </p>
              <p className={cn('truncate text-xs', isValidQuiz ? 'text-success' : 'text-muted-foreground')}>
                {isValidQuiz ? (
                  <span className="inline-flex items-center gap-1"><Check className="h-3.5 w-3.5" /> Ready to launch</span>
                ) : (
                  'Need at least 3 complete questions to launch'
                )}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {user && (
                <Button onClick={handleOpenSaveModal} disabled={questions.length === 0} variant="outline">
                  <Save /> <span className="hidden sm:inline">Save draft</span>
                </Button>
              )}
              <Button onClick={handleLaunchQuiz} disabled={!isValidQuiz} size="lg">
                <Rocket /> Launch quiz
              </Button>
            </div>
          </div>
        </div>
      </AppShell>

      {/* Enhancement Preview Modal */}
      <Dialog open={Boolean(enhancementPreview)} onOpenChange={(open) => { if (!open) handleRejectEnhancement(); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          {enhancementPreview && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> Enhancement preview
                </DialogTitle>
                <DialogDescription>Review the AI-enhanced version and choose how to proceed.</DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-border bg-surface-raised p-4">
                  <p className="eyebrow mb-3">Original</p>
                  <h4 className="mb-3 text-sm font-semibold text-foreground">{enhancementPreview.original.text}</h4>
                  <div className="space-y-2">
                    {enhancementPreview.original.options.map((option, i) => (
                      <AnswerOption
                        key={i}
                        label={getOptionLabel(i)}
                        text={option}
                        state={enhancementPreview.original.correct === i ? 'correct' : 'default'}
                      />
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-primary/40 bg-primary/5 p-4">
                  <p className="eyebrow mb-3 text-primary">Enhanced</p>
                  <h4 className="mb-3 text-sm font-semibold text-foreground">{enhancementPreview.enhanced.text}</h4>
                  <div className="space-y-2">
                    {enhancementPreview.enhanced.options.map((option, i) => (
                      <AnswerOption
                        key={i}
                        label={getOptionLabel(i)}
                        text={option}
                        state={enhancementPreview.enhanced.correct === i ? 'correct' : 'default'}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:justify-between">
                <Button onClick={handleRejectEnhancement} variant="ghost">
                  <X /> Reject changes
                </Button>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button onClick={handleAcceptEnhancement} variant="outline">
                    <Check /> Accept changes
                  </Button>
                  <Button onClick={handleAcceptAndAddQuestion}>
                    <Plus /> Accept &amp; add to questions
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Save Draft Modal */}
      <Dialog open={showSaveModal} onOpenChange={(open) => { if (!open) closeSaveModal(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save quiz as draft</DialogTitle>
            <DialogDescription>Give the draft a name so you can find it on your dashboard.</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="draftName">Draft name</Label>
            <Input
              id="draftName"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="e.g. Friday trivia, round 1"
              disabled={saving}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSaveDraft();
                }
              }}
            />
          </div>

          <DialogFooter>
            <Button onClick={closeSaveModal} variant="outline" disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSaveDraft} disabled={saving || !draftName.trim()}>
              {saving ? <Spinner size="sm" /> : <Save />}
              {saving ? 'Saving…' : 'Save draft'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
}

// Question Item Component
interface QuestionItemProps {
  question: QuizQuestion;
  index: number;
  isEditing: boolean;
  isReordering: boolean;
  reorderingIndex: number | null;
  isAnimating: boolean;
  onEdit: (question: QuizQuestion) => void;
  onDelete: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onStartReordering: (index: number) => void;
}

function QuestionItem({
  question,
  index,
  isEditing,
  isReordering,
  reorderingIndex,
  isAnimating,
  onEdit,
  onDelete,
  onStartEdit,
  onCancelEdit,
  onStartReordering,
}: QuestionItemProps) {
  const [editedQuestion, setEditedQuestion] = useState<QuizQuestion>(question);

  React.useEffect(() => {
    setEditedQuestion(question);
  }, [question]);

  const handleSave = () => {
    if (editedQuestion.text.trim() && editedQuestion.options.every(opt => opt.trim())) {
      onEdit(editedQuestion);
    }
  };

  const reorderButtonClass = cn(
    'flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg border font-display text-sm font-bold tabular transition-[background-color,border-color,color,transform,box-shadow] duration-150 focus-ring',
    isAnimating
      ? 'cursor-not-allowed border-border bg-muted text-muted-foreground'
      : reorderingIndex === index
      ? 'scale-110 border-primary bg-primary text-primary-foreground shadow-glow'
      : isReordering
      ? 'cursor-pointer border-success bg-success/15 text-success hover:bg-success hover:text-success-foreground'
      : 'cursor-pointer border-border bg-surface-raised text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground'
  );

  const reorderTitle = isAnimating
    ? 'Reordering in progress...'
    : reorderingIndex === index
    ? 'Click another number to move here, or click again to cancel'
    : isReordering
    ? 'Click to move the selected question here'
    : 'Click to reorder this question';

  if (isEditing) {
    return (
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => onStartReordering(index)}
          className={cn(reorderButtonClass, 'mt-3')}
          title={reorderTitle}
          aria-label={`Question ${index + 1}, reorder`}
          disabled={!isReordering && reorderingIndex === null}
        >
          {index + 1}
        </button>
        <Card className="flex-1 border-primary/50 shadow-glow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Edit question {index + 1}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`edit-q-${index}`}>Question</Label>
              <Input
                id={`edit-q-${index}`}
                value={editedQuestion.text}
                onChange={(e) => setEditedQuestion({ ...editedQuestion, text: e.target.value })}
                placeholder="Enter your question..."
              />
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium leading-none">Answer options</legend>
              <div className="space-y-2 pt-1">
                {editedQuestion.options.map((option, optionIndex) => {
                  const isCorrect = editedQuestion.correct === optionIndex
                  return (
                    <div
                      key={optionIndex}
                      className={cn(
                        'flex items-center gap-2 rounded-lg border p-1.5 pl-3 transition-colors',
                        isCorrect ? 'border-success/50 bg-success/5' : 'border-transparent'
                      )}
                    >
                      <input
                        type="radio"
                        name={`correct-${index}`}
                        aria-label={`Mark option ${getOptionLabel(optionIndex)} as correct`}
                        checked={isCorrect}
                        onChange={() => setEditedQuestion({ ...editedQuestion, correct: optionIndex })}
                      />
                      <span className={cn('w-5 text-sm font-bold', isCorrect ? 'text-success' : 'text-muted-foreground')}>
                        {getOptionLabel(optionIndex)}
                      </span>
                      <Input
                        value={option}
                        onChange={(e) => {
                          const updatedOptions = [...editedQuestion.options];
                          updatedOptions[optionIndex] = e.target.value;
                          setEditedQuestion({ ...editedQuestion, options: updatedOptions });
                        }}
                        placeholder={`Option ${getOptionLabel(optionIndex)}`}
                        className="h-10 flex-1"
                        aria-label={`Option ${getOptionLabel(optionIndex)}`}
                      />
                    </div>
                  )
                })}
              </div>
            </fieldset>

            <div className="flex justify-end gap-2">
              <Button onClick={onCancelEdit} variant="ghost">Cancel</Button>
              <Button
                onClick={handleSave}
                disabled={!editedQuestion.text.trim() || !editedQuestion.options.every(opt => opt.trim())}
              >
                <Check /> Save question
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      {/* Clickable number for reordering */}
      <button
        type="button"
        onClick={() => onStartReordering(index)}
        disabled={isAnimating}
        className={cn(reorderButtonClass, 'mt-3')}
        title={reorderTitle}
        aria-label={`Question ${index + 1}, reorder`}
        aria-pressed={reorderingIndex === index}
      >
        {index + 1}
      </button>

      {/* Question card */}
      <Card
        className={cn(
          'min-w-0 flex-1 transition-[border-color,box-shadow] duration-150',
          reorderingIndex === index ? 'border-primary shadow-glow' : isReordering ? 'border-dashed' : 'hover:border-muted-foreground/40'
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="min-w-0 flex-1 text-sm font-semibold leading-snug text-foreground sm:text-[15px]">
              {question.text}
            </h3>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                onClick={onStartEdit}
                variant="ghost"
                size="icon-sm"
                aria-label="Edit question"
                disabled={isReordering || isAnimating}
              >
                <Pencil />
              </Button>
              <Button
                onClick={onDelete}
                variant="ghost"
                size="icon-sm"
                aria-label="Delete question"
                className="text-muted-foreground hover:text-destructive"
                disabled={isReordering || isAnimating}
              >
                <Trash2 />
              </Button>
              <span className="ml-1 hidden text-muted-foreground/50 sm:inline" aria-hidden="true">
                <GripVertical className="h-4 w-4" />
              </span>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {question.options.map((option, optionIndex) => (
              <AnswerOption
                key={optionIndex}
                label={getOptionLabel(optionIndex)}
                text={option}
                state={question.correct === optionIndex ? 'correct' : 'default'}
                className="min-h-10 py-2"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function QuizSetupPage() {
  return (
    <Suspense fallback={<LoadingScreen label="Loading quiz setup..." />}>
      <QuizSetupContent />
    </Suspense>
  );
}
