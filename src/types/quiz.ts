export interface QuizQuestion {
  text: string;
  options: string[];
  correct: number;
}

export interface BuzzData {
  teamName: string;
  timestamp: number;
  rank: number;
  socketId: string;
  totalResponses: number;
}

export interface QuestionChangeData {
  questionNumber: number;
  questionData: QuizQuestion;
}

export interface TeamData {
  teamName: string;
  socketId: string;
}

export interface ScoreData {
  teamName: string;
  score: number;
}

export interface CelebrationData {
  teamName: string;
}

export interface RankingData {
  teamName: string;
  timestamp: number;
  rank: number;
}

export interface AnswerRevealedData {
  revealedAnswer: number | null;
}

export interface QuizEndedData {
  message: string;
}

export interface ConnectionStatus {
  isConnected: boolean;
  connectionMessage: string;
}

export interface QuizState {
  currentQuestion: number;
  totalQuestions: number;
  currentQuestionData: QuizQuestion | null;
  teams: Map<string, string>;
  scores: Map<string, number>;
  buzzOrder: string[];
  rankings: RankingData[];
  canBuzz: boolean;
  isHost: boolean;
}

// Socket.io event types
export interface ServerToClientEvents {
  'question-change': (data: QuestionChangeData) => void;
  'buzz': (data: BuzzData) => void;
  'reset-buzzer': () => void;
  'register-team': (data: TeamData) => void;
  'disconnect-team': (socketId: string) => void;
  'celebrate': (data: CelebrationData) => void;
  'answer-revealed': (data: AnswerRevealedData) => void;
  'quiz-ended': (data: QuizEndedData) => void;
}

export interface ClientToServerEvents {
  'question-change': (data: { questionNumber: number }) => void;
  'buzz': (data: { teamName: string; timestamp: number }) => void;
  'reset-buzzer': () => void;
  'register-team': (data: { teamName: string }) => void;
  'trigger-celebration': (data: { teamName: string }) => void;
  'request-question-number': () => void;
  'set-custom-questions': (data: { questions: QuizQuestion[] }) => void;
  'answer-revealed': (data: AnswerRevealedData) => void;
  'host-exit-quiz': () => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  teamName?: string;
}

