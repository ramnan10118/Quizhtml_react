import React, { useState, useCallback, useEffect } from 'react';
import { QuizState, QuizQuestion, RankingData, QUIZ_QUESTIONS } from '@/types/quiz';

// Get custom questions from sessionStorage if available
const getCustomQuestions = (): QuizQuestion[] => {
  if (typeof window !== 'undefined') {
    const stored = sessionStorage.getItem('customQuestions');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Error parsing custom questions:', e);
      }
    }
  }
  return QUIZ_QUESTIONS;
};

const initialState: QuizState = {
  currentQuestion: 1,
  totalQuestions: 0, // Will be set after questions are loaded
  currentQuestionData: null,
  teams: new Map(),
  scores: new Map(),
  buzzOrder: [],
  rankings: [],
  canBuzz: false,
  isHost: false,
};

export function useQuizState(isHost: boolean = false) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [quizState, setQuizState] = useState<QuizState>({
    ...initialState,
    isHost,
  });

  // Initialize questions on component mount
  useEffect(() => {
    const customQuestions = getCustomQuestions();
    setQuestions(customQuestions);
    setQuizState(prev => ({
      ...prev,
      totalQuestions: customQuestions.length,
      currentQuestionData: customQuestions[0] || null,
    }));
  }, []);

  const updateCurrentQuestion = useCallback((questionNumber: number, questionData: QuizQuestion) => {
    setQuizState(prev => ({
      ...prev,
      currentQuestion: questionNumber,
      currentQuestionData: questionData,
      buzzOrder: [],
      rankings: [],
      canBuzz: !isHost,
    }));
  }, [isHost]);

  const addTeam = useCallback((socketId: string, teamName: string) => {
    setQuizState(prev => {
      const newTeams = new Map(prev.teams);
      const newScores = new Map(prev.scores);
      newTeams.set(socketId, teamName);
      if (!newScores.has(teamName)) {
        newScores.set(teamName, 0);
      }
      return {
        ...prev,
        teams: newTeams,
        scores: newScores,
      };
    });
  }, []);

  const removeTeam = useCallback((socketId: string) => {
    setQuizState(prev => {
      const teamName = prev.teams.get(socketId);
      const newTeams = new Map(prev.teams);
      const newScores = new Map(prev.scores);
      
      newTeams.delete(socketId);
      if (teamName) {
        newScores.delete(teamName);
      }
      
      return {
        ...prev,
        teams: newTeams,
        scores: newScores,
      };
    });
  }, []);

  const addBuzz = useCallback((ranking: RankingData) => {
    setQuizState(prev => {
      const newRankings = [...prev.rankings, ranking];
      const newBuzzOrder = [...prev.buzzOrder];
      
      if (!newBuzzOrder.includes(ranking.teamName)) {
        newBuzzOrder.push(ranking.teamName);
      }
      
      return {
        ...prev,
        rankings: newRankings.slice(0, 3), // Keep only top 3
        buzzOrder: newBuzzOrder,
        canBuzz: prev.isHost ? prev.canBuzz : newRankings.length < 3,
      };
    });
  }, []);

  const resetBuzzer = useCallback(() => {
    setQuizState(prev => ({
      ...prev,
      buzzOrder: [],
      rankings: [],
      canBuzz: !prev.isHost,
    }));
  }, []);

  const updateScore = useCallback((teamName: string, points: number = 1) => {
    setQuizState(prev => {
      const newScores = new Map(prev.scores);
      const currentScore = newScores.get(teamName) || 0;
      newScores.set(teamName, currentScore + points);
      
      return {
        ...prev,
        scores: newScores,
      };
    });
  }, []);

  const changeQuestion = useCallback((direction: 'next' | 'prev') => {
    let newQuestionNumber = quizState.currentQuestion;
    
    if (direction === 'next' && quizState.currentQuestion < quizState.totalQuestions) {
      newQuestionNumber = quizState.currentQuestion + 1;
    } else if (direction === 'prev' && quizState.currentQuestion > 1) {
      newQuestionNumber = quizState.currentQuestion - 1;
    }
    
    const newQuestionData = newQuestionNumber > 0 && newQuestionNumber <= questions.length 
      ? questions[newQuestionNumber - 1] 
      : null;
    
    setQuizState(prev => ({
      ...prev,
      currentQuestion: newQuestionNumber,
      currentQuestionData: newQuestionData,
      buzzOrder: [],
      rankings: [],
      canBuzz: !prev.isHost,
    }));
    
    return newQuestionNumber;
  }, [quizState.currentQuestion, quizState.totalQuestions, questions]);

  const setSinglePlayerBuzzState = useCallback((canBuzz: boolean) => {
    setQuizState(prev => ({
      ...prev,
      canBuzz,
    }));
  }, []);

  return {
    quizState,
    updateCurrentQuestion,
    addTeam,
    removeTeam,
    addBuzz,
    resetBuzzer,
    updateScore,
    changeQuestion,
    setSinglePlayerBuzzState,
  };
}