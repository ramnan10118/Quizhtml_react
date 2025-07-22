'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { QuizQuestion } from '@/types/quiz';

const DEFAULT_QUESTIONS: QuizQuestion[] = [];

export default function QuizSetupPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('ai');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
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

  // Load questions from localStorage on component mount
  useEffect(() => {
    const savedQuestions = localStorage.getItem('quiz-setup-questions');
    if (savedQuestions) {
      try {
        const parsedQuestions = JSON.parse(savedQuestions);
        setQuestions(parsedQuestions);
      } catch (error) {
        console.error('Failed to parse saved questions:', error);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save questions to localStorage whenever questions change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('quiz-setup-questions', JSON.stringify(questions));
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
      localStorage.removeItem('quiz-setup-questions');
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

  const handleLaunchQuiz = () => {
    sessionStorage.setItem('customQuestions', JSON.stringify(questions));
    router.push('/quiz/host');
  };

  const isValidQuiz = questions.length >= 3 && questions.every(q => 
    q.text.trim() !== '' && q.options.every(opt => opt.trim() !== '')
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 dark">
      <Header 
        title="Create Quiz" 
        subtitle={`${questions.length} question${questions.length !== 1 ? 's' : ''} ready`}
      />
      
      <main className="max-w-6xl mx-auto p-6">
        {/* Header Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-gray-900 dark:text-gray-100 mb-2">Questionnaire Creator</CardTitle>
                <p className="text-gray-600 dark:text-gray-400">
                  Create questions using AI generation or manual entry. Enhance and manage your questions.
                </p>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <Button 
                  onClick={handleLaunchQuiz}
                  disabled={!isValidQuiz}
                  className="bg-green-600 hover:bg-green-700"
                >
                  🚀 Launch Quiz
                </Button>
                {!isValidQuiz && (
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                    Need at least 3 complete questions
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {errorMessage && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            errorMessage.includes('successfully') 
              ? 'bg-green-100 border border-green-300 text-green-700'
              : 'bg-red-100 border border-red-300 text-red-700'
          }`}>
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Creation Methods */}
          <div className="lg:col-span-1 space-y-6">
            {/* Tab Navigation */}
            <div className="flex bg-gray-100 dark:bg-dark-700 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('ai')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'ai'
                    ? 'bg-white dark:bg-dark-600 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                🤖 AI Generation
              </button>
              <button
                onClick={() => setActiveTab('manual')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'manual'
                    ? 'bg-white dark:bg-dark-600 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                📝 Manual Entry
              </button>
            </div>

            {/* AI Generation Panel */}
            {activeTab === 'ai' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg dark:text-gray-100">AI Question Generator</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Generate questions automatically using AI
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Topic or Subject
                    </label>
                    <Input
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g., World War II, JavaScript, Biology"
                      disabled={isGenerating}
                    />
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Quick suggestions:</p>
                      <div className="flex flex-wrap gap-1">
                        {topicSuggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            onClick={() => setTopic(suggestion)}
                            className="px-2 py-1 text-xs bg-gray-100 dark:bg-dark-600 hover:bg-gray-200 dark:hover:bg-dark-500 rounded text-gray-700 dark:text-gray-300"
                            disabled={isGenerating}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Difficulty Level
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as 'Easy' | 'Medium' | 'Hard')}
                      className="w-full p-2 pr-8 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100"
                      disabled={isGenerating}
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Number of Questions ({questionCount})
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={questionCount}
                      onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                      className="w-full"
                      disabled={isGenerating}
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>1</span>
                      <span>20</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleAIGenerate}
                    disabled={isGenerating || !topic.trim()}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <span className="flex items-center space-x-2">
                        <span className="animate-spin">🔄</span>
                        <span>Generating...</span>
                      </span>
                    ) : (
                      `Generate ${questionCount} Questions`
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Manual Entry Panel */}
            {activeTab === 'manual' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg dark:text-gray-100">Manual Question Entry</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Create custom questions manually
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Question Text
                    </label>
                    <textarea
                      value={manualQuestion.text}
                      onChange={(e) => setManualQuestion({ ...manualQuestion, text: e.target.value })}
                      placeholder="Enter your question..."
                      className="w-full p-3 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 resize-none"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Answer Options
                    </label>
                    <div className="space-y-2">
                      {manualQuestion.options.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="correct-manual"
                            checked={manualQuestion.correct === index}
                            onChange={() => setManualQuestion({ ...manualQuestion, correct: index })}
                            className="text-green-600"
                          />
                          <span className="w-6 text-sm font-medium text-gray-600 dark:text-gray-400">
                            {String.fromCharCode(65 + index)}:
                          </span>
                          <Input
                            value={option}
                            onChange={(e) => {
                              const updatedOptions = [...manualQuestion.options];
                              updatedOptions[index] = e.target.value;
                              setManualQuestion({ ...manualQuestion, options: updatedOptions });
                            }}
                            placeholder={`Option ${String.fromCharCode(65 + index)}`}
                            className="flex-1"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Select the correct answer using the radio buttons
                    </p>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <Button
                      onClick={handleEnhanceManualQuestion}
                      disabled={!manualQuestion.text.trim() || !manualQuestion.options.every(opt => opt.trim()) || isEnhancingManual}
                      variant="outline"
                      className="flex-1 text-sm px-3 py-2"
                      size="sm"
                    >
                      {isEnhancingManual ? (
                        <span className="flex items-center space-x-1">
                          <span className="animate-spin text-xs">🔄</span>
                          <span>Enhancing...</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-1">
                          <span>✨</span>
                          <span>Enhance</span>
                        </span>
                      )}
                    </Button>
                    <Button
                      onClick={handleAddManualQuestion}
                      disabled={!manualQuestion.text.trim() || !manualQuestion.options.every(opt => opt.trim())}
                      className="flex-1 text-sm px-3 py-2"
                      size="sm"
                    >
                      <span className="flex items-center space-x-1">
                        <span>➕</span>
                        <span>Add Question</span>
                      </span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Panel - Question Management */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg dark:text-gray-100">Question Management</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">{questions.length}</span> questions ready
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    {questions.length > 0 && (
                      <Button
                        onClick={handleDeleteAllQuestions}
                        variant="destructive"
                        size="sm"
                        className="text-xs"
                      >
                        🗑️ Delete All
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {questions.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="mb-6">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-dark-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">📝</span>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        No questions yet
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                        Get started by creating questions using AI generation or manual entry from the panel on the left.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
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
      </main>

      {/* Enhancement Preview Modal */}
      {enhancementPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">✨</span>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Enhancement Preview</h2>
                </div>
                <button
                  onClick={handleRejectEnhancement}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <span className="sr-only">Close</span>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Review the AI-enhanced version and choose how to proceed
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div>
                  <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center space-x-2">
                    <span>📝</span>
                    <span>Original Question</span>
                  </h3>
                  <div className="p-4 bg-gray-50 dark:bg-dark-700 rounded-lg border dark:border-dark-600">
                    <h4 className="font-medium mb-3 text-gray-900 dark:text-gray-100">{enhancementPreview.original.text}</h4>
                    <div className="space-y-2">
                      {enhancementPreview.original.options.map((option, i) => (
                        <div key={i} className={`text-sm p-2 rounded ${enhancementPreview.original.correct === i ? 'bg-green-100 dark:bg-green-800/30 border border-green-300 dark:border-green-600 text-green-800 dark:text-green-200' : 'bg-white dark:bg-dark-600 text-gray-700 dark:text-gray-300'}`}>
                          <span className="font-medium">{String.fromCharCode(65 + i)}: </span>
                          {option}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center space-x-2">
                    <span>✨</span>
                    <span>Enhanced Question</span>
                  </h3>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                    <h4 className="font-medium mb-3 text-gray-900 dark:text-gray-100">{enhancementPreview.enhanced.text}</h4>
                    <div className="space-y-2">
                      {enhancementPreview.enhanced.options.map((option, i) => (
                        <div key={i} className={`text-sm p-2 rounded ${enhancementPreview.enhanced.correct === i ? 'bg-green-100 dark:bg-green-800/30 border border-green-300 dark:border-green-600 text-green-800 dark:text-green-200' : 'bg-white dark:bg-dark-600 text-gray-700 dark:text-gray-300'}`}>
                          <span className="font-medium">{String.fromCharCode(65 + i)}: </span>
                          {option}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
                <Button 
                  onClick={handleRejectEnhancement} 
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <span>❌</span>
                  <span>Reject Changes</span>
                </Button>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <Button 
                    onClick={handleAcceptEnhancement}
                    variant="outline"
                    className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                  >
                    <span>✅</span>
                    <span>Accept Changes</span>
                  </Button>
                  <Button 
                    onClick={handleAcceptAndAddQuestion}
                    className="bg-green-600 hover:bg-green-700 flex items-center space-x-2"
                  >
                    <span>➕</span>
                    <span>Accept & Add to Questions</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
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

  if (isEditing) {
    return (
      <div className="flex items-start space-x-4">
        <button
          onClick={() => onStartReordering(index)}
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200 mt-2 ${
            reorderingIndex === index
              ? 'bg-blue-500 text-white scale-110 shadow-lg'
              : isReordering
              ? 'bg-green-500 hover:bg-green-600 text-white cursor-pointer shadow-md hover:scale-105'
              : 'bg-blue-500 text-white'
          }`}
          title={
            reorderingIndex === index
              ? 'Click another number to move here, or click again to cancel'
              : isReordering
              ? 'Click to move the selected question here'
              : 'Click to reorder this question'
          }
          disabled={!isReordering && reorderingIndex === null}
        >
          {index + 1}
        </button>
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20 flex-1">
          <CardHeader>
            <CardTitle className="text-lg dark:text-gray-100">Edit Question</CardTitle>
          </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Question</label>
            <Input
              value={editedQuestion.text}
              onChange={(e) => setEditedQuestion({ ...editedQuestion, text: e.target.value })}
              placeholder="Enter your question..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Answer Options</label>
            <div className="space-y-2">
              {editedQuestion.options.map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name={`correct-${index}`}
                    checked={editedQuestion.correct === optionIndex}
                    onChange={() => setEditedQuestion({ ...editedQuestion, correct: optionIndex })}
                    className="text-green-600"
                  />
                  <span className="w-6 text-sm font-medium text-gray-600 dark:text-gray-400">
                    {String.fromCharCode(65 + optionIndex)}:
                  </span>
                  <Input
                    value={option}
                    onChange={(e) => {
                      const updatedOptions = [...editedQuestion.options];
                      updatedOptions[optionIndex] = e.target.value;
                      setEditedQuestion({ ...editedQuestion, options: updatedOptions });
                    }}
                    placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                    className="flex-1"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button onClick={onCancelEdit} variant="outline">Cancel</Button>
            <Button 
              onClick={handleSave}
              disabled={!editedQuestion.text.trim() || !editedQuestion.options.every(opt => opt.trim())}
            >
              Save Question
            </Button>
          </div>
        </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-start space-x-4">
      {/* Clickable number for reordering */}
      <button
        onClick={() => onStartReordering(index)}
        disabled={isAnimating}
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200 ${
          isAnimating
            ? 'bg-gray-300 dark:bg-dark-500 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            : reorderingIndex === index
            ? 'bg-blue-500 text-white scale-110 shadow-lg'
            : isReordering
            ? 'bg-green-500 hover:bg-green-600 text-white cursor-pointer shadow-md hover:scale-105'
            : 'bg-gray-200 dark:bg-dark-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-dark-500 cursor-pointer'
        }`}
        title={
          isAnimating
            ? 'Reordering in progress...'
            : reorderingIndex === index
            ? 'Click another number to move here, or click again to cancel'
            : isReordering
            ? 'Click to move the selected question here'
            : 'Click to reorder this question'
        }
      >
        {index + 1}
      </button>

      {/* Question card */}
      <Card className={`hover:shadow-md transition-shadow flex-1 ${
        reorderingIndex === index ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
      }`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                {question.text}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {question.options.map((option, optionIndex) => (
                  <div 
                    key={optionIndex}
                    className={`p-2 rounded border text-sm ${
                      question.correct === optionIndex 
                        ? 'bg-green-100 dark:bg-green-800/30 border-green-300 dark:border-green-600 text-green-800 dark:text-green-200' 
                        : 'bg-gray-50 dark:bg-dark-700 border-gray-200 dark:border-dark-600 dark:text-gray-300'
                    }`}
                  >
                    <span className="font-medium">{String.fromCharCode(65 + optionIndex)}: </span>
                    {option}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex space-x-1 ml-4">
              <Button 
                onClick={onStartEdit} 
                variant="outline" 
                size="sm" 
                className="text-xs"
                disabled={isReordering || isAnimating}
              >
                Edit
              </Button>
              <Button 
                onClick={onDelete} 
                variant="destructive" 
                size="sm" 
                className="text-xs"
                disabled={isReordering || isAnimating}
              >
                Delete
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
      </div>
    </ProtectedRoute>
  );
}