import { useState, useCallback, useEffect, useRef } from 'react';
import { QuizState, QuizQuestion, RankingData } from '@/types/quiz';

// Module-level variables to track the current session for saving
let savedSessionIdForPersistence: string | null = null;
let savedHostTokenForPersistence: string | null = null;

// Get custom questions from sessionStorage if available
const getCustomQuestions = (): QuizQuestion[] => {
  if (typeof window !== 'undefined') {
    const stored = sessionStorage.getItem('customQuestions');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error('Error parsing custom questions:', e);
        return [];
      }
    }
  }
  return []; // No fallback questions - questions come from database/API
};

// Save quiz state to localStorage
const saveQuizState = (state: QuizState, sessionId?: string, hostToken?: string | null) => {
  if (typeof window !== 'undefined' && state.isHost) {
    try {
      const stateToSave = {
        teams: Array.from(state.teams.entries()),
        scores: Array.from(state.scores.entries()),
        buzzOrder: state.buzzOrder,
        rankings: state.rankings,
        currentQuestion: state.currentQuestion,
        mode: state.mode,
        settings: state.settings,
        sessionId: sessionId,
        hostToken: hostToken || undefined,
        timestamp: Date.now()
      };
      console.log('💾 Saving to localStorage with sessionId:', sessionId, 'Full state:', stateToSave);
      localStorage.setItem('buzzer_quiz_state', JSON.stringify(stateToSave));
      
      // Verify save immediately
      const saved = localStorage.getItem('buzzer_quiz_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('✅ Verified localStorage save - sessionId in storage:', parsed.sessionId);
      }
    } catch (e) {
      console.error('Error saving quiz state:', e);
    }
  }
};

// Get saved quiz state from localStorage
const getSavedQuizState = (): { state: Partial<QuizState>; sessionId: string | null; hostToken: string | null } | null => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('buzzer_quiz_state');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Check if state is not too old (2 hours)
        if (Date.now() - parsed.timestamp < 2 * 60 * 60 * 1000) {
          return {
            state: {
              teams: new Map(parsed.teams || []),
              scores: new Map(parsed.scores || []),
              buzzOrder: parsed.buzzOrder || [],
              rankings: parsed.rankings || [],
              currentQuestion: parsed.currentQuestion || 1,
              mode: parsed.mode || 'buzzer',
              settings: parsed.settings || initialState.settings
            },
            sessionId: parsed.sessionId || null,
            hostToken: parsed.hostToken || null
          };
        } else {
          localStorage.removeItem('buzzer_quiz_state');
        }
      }
    } catch (e) {
      console.error('Error loading saved quiz state:', e);
      localStorage.removeItem('buzzer_quiz_state');
    }
  }
  return null;
};

const initialState: QuizState = {
  mode: 'buzzer',
  currentQuestion: 1,
  totalQuestions: 0, // Will be set after questions are loaded
  currentQuestionData: null,
  teams: new Map(),
  scores: new Map(),
  buzzOrder: [],
  rankings: [],
  canBuzz: false,
  isHost: false,
  settings: {
    mode: 'buzzer',
    timeLimit: undefined,
    allowRetakes: false,
    showCorrectAnswers: true,
    passingScore: undefined
  },
  basicSubmissions: [],
  scheduledState: {
    submissions: [],
    revealedQuestions: [],
    leaderboardVisible: false,
    isComplete: false
  }
};

export function useQuizState(isHost: boolean = false) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Get saved data only after hydration
  const savedData = isHydrated && isHost ? getSavedQuizState() : null;
  const savedSessionId = savedData?.sessionId || null;
  const savedHostToken = savedData?.hostToken || null;
  
  const [quizState, setQuizState] = useState<QuizState>(() => {
    return {
      ...initialState,
      isHost,
    };
  });

  // Apply saved state after hydration to prevent SSR mismatch
  useEffect(() => {
    console.log('📊 useQuizState hydration effect - isHost:', isHost);
    setIsHydrated(true);
    if (isHost) {
      const savedData = getSavedQuizState();
      if (savedData?.state) {
        console.log('💾 Restoring saved quiz state:', {
          teams: savedData.state.teams?.size || 0,
          scores: savedData.state.scores?.size || 0,
          currentQuestion: savedData.state.currentQuestion,
          mode: savedData.state.mode
        });
        setQuizState(prev => ({
          ...prev,
          ...savedData.state,
        }));
      } else {
        console.log('ℹ️ No saved quiz state found');
      }
    }
  }, [isHost]);

  // Initialize questions on component mount
  useEffect(() => {
    const customQuestions = getCustomQuestions() || [];
    setQuestions(customQuestions);
    setQuizState(prev => ({
      ...prev,
      totalQuestions: customQuestions.length,
      currentQuestionData: customQuestions[prev.currentQuestion - 1] || customQuestions[0] || null,
    }));
  }, []);

  // Save state to localStorage whenever it changes (only for hosts)
  // NOTE: Disabled automatic saves to prevent overwriting sessionId
  // Session saves are now handled explicitly via saveCurrentSession()
  /*
  useEffect(() => {
    if (isHost) {
      saveQuizState(quizState);
    }
  }, [quizState, isHost]);
  */

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
    console.log('👥 Adding team:', teamName, 'socketId:', socketId);
    setQuizState(prev => {
      const newTeams = new Map(prev.teams);
      const newScores = new Map(prev.scores);
      newTeams.set(socketId, teamName);
      if (!newScores.has(teamName)) {
        newScores.set(teamName, 0);
      }
      const newState = {
        ...prev,
        teams: newTeams,
        scores: newScores,
      };
      
      // Save immediately after state change
      setTimeout(() => {
        if (savedSessionIdForPersistence) {
          console.log('💾 Auto-saving after team added');
          saveQuizState(newState, savedSessionIdForPersistence);
        }
      }, 0);
      
      return newState;
    });
  }, []);

  // Replace the whole roster with the server's authoritative list (used after a
  // host reconnect, when stored socket ids are stale).
  const setTeams = useCallback((entries: Array<[string, string]>) => {
    setQuizState(prev => {
      const newTeams = new Map(entries);
      const newScores = new Map(prev.scores);
      newTeams.forEach((teamName) => {
        if (!newScores.has(teamName)) newScores.set(teamName, 0);
      });
      return { ...prev, teams: newTeams, scores: newScores };
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
    console.log('🔥 addBuzz called with:', ranking);
    setQuizState(prev => {
      const newRankings = [...prev.rankings, ranking];
      const newBuzzOrder = [...prev.buzzOrder];
      
      if (!newBuzzOrder.includes(ranking.teamName)) {
        newBuzzOrder.push(ranking.teamName);
      }
      
      console.log('🔥 New rankings:', newRankings, 'BuzzOrder:', newBuzzOrder);
      
      const newState = {
        ...prev,
        rankings: newRankings.slice(0, 3), // Keep only top 3
        buzzOrder: newBuzzOrder,
        canBuzz: prev.isHost ? prev.canBuzz : newRankings.length < 3,
      };
      
      // Save immediately after buzz rankings change
      setTimeout(() => {
        if (savedSessionIdForPersistence) {
          console.log('💾 Auto-saving after buzz rankings updated, sessionId:', savedSessionIdForPersistence);
          saveQuizState(newState, savedSessionIdForPersistence);
        } else {
          console.warn('❌ Cannot save buzz rankings - no session ID set');
        }
      }, 0);
      
      return newState;
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
    console.log('🏆 Updating score for:', teamName, 'points:', points);
    setQuizState(prev => {
      const newScores = new Map(prev.scores);
      const currentScore = newScores.get(teamName) || 0;
      newScores.set(teamName, currentScore + points);
      
      const newState = {
        ...prev,
        scores: newScores,
      };
      
      // Save immediately after score change
      setTimeout(() => {
        if (savedSessionIdForPersistence) {
          console.log('💾 Auto-saving after score updated');
          saveQuizState(newState, savedSessionIdForPersistence);
        }
      }, 0);
      
      return newState;
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

  const clearSavedState = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('buzzer_quiz_state');
    }
  }, []);

  // Use module-level variable to track sessionId
  
  // Keep the latest state in a ref so saveCurrentSession has a stable identity
  // (page effects depend on it; a new identity per render caused duplicate
  // create-session requests).
  const latestStateRef = useRef(quizState);
  latestStateRef.current = quizState;

  const saveCurrentSession = useCallback((sessionId: string, hostToken?: string) => {
    if (isHost && sessionId && sessionId !== 'undefined') {
      savedSessionIdForPersistence = sessionId;
      if (hostToken) savedHostTokenForPersistence = hostToken;
      saveQuizState(latestStateRef.current, sessionId, savedHostTokenForPersistence);
    }
  }, [isHost]);

  return {
    quizState,
    updateCurrentQuestion,
    addTeam,
    setTeams,
    removeTeam,
    addBuzz,
    resetBuzzer,
    updateScore,
    changeQuestion,
    setSinglePlayerBuzzState,
    clearSavedState,
    saveCurrentSession,
    savedSessionId,
    savedHostToken,
  };
}