import { useState, useCallback } from 'react';
import { QuizState, QuizQuestion, RankingData, QUIZ_QUESTIONS } from '@/types/quiz';

const initialState: QuizState = {
  currentQuestion: 1,
  totalQuestions: QUIZ_QUESTIONS.length,
  currentQuestionData: QUIZ_QUESTIONS[0] || null,
  teams: new Map(),
  scores: new Map(),
  buzzOrder: [],
  rankings: [],
  canBuzz: false,
  isHost: false,
};

export function useQuizState(isHost: boolean = false) {
  const [quizState, setQuizState] = useState<QuizState>({
    ...initialState,
    isHost,
  });

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
    setQuizState(prev => {
      let newQuestionNumber = prev.currentQuestion;
      
      if (direction === 'next' && prev.currentQuestion < prev.totalQuestions) {
        newQuestionNumber = prev.currentQuestion + 1;
      } else if (direction === 'prev' && prev.currentQuestion > 1) {
        newQuestionNumber = prev.currentQuestion - 1;
      }
      
      const newQuestionData = QUIZ_QUESTIONS[newQuestionNumber - 1];
      
      return {
        ...prev,
        currentQuestion: newQuestionNumber,
        currentQuestionData: newQuestionData || null,
        buzzOrder: [],
        rankings: [],
        canBuzz: !prev.isHost,
      };
    });
    
    return quizState.currentQuestion;
  }, [quizState.currentQuestion]);

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