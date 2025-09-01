export interface QuizQuestion {
  text: string;
  options: string[];
  correct: number;
}

// Quiz mode types
export type QuizMode = 'buzzer' | 'basic' | 'scheduled';

export interface QuizSettings {
  mode: QuizMode;
  timeLimit?: number;
  allowRetakes?: boolean;
  showCorrectAnswers?: boolean;
  passingScore?: number;
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

export interface ConnectionStatus {
  isConnected: boolean;
  connectionMessage: string;
}

// Basic and Scheduled mode interfaces
export interface ParticipantAnswer {
  questionIndex: number;
  selectedOption: number;
  timestamp: number;
}

export interface ParticipantSubmission {
  participantName: string;
  socketId: string;
  answers: ParticipantAnswer[];
  submissionTime: number;
  score?: number;
  isComplete: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  participantName: string;
  score: number;
  submissionTime: number;
  questionsRevealed: number;
}

export interface RevealState {
  questionIndex: number;
  isRevealed: boolean;
  revealedAt?: number;
}

export interface ScheduledQuizState {
  submissions: ParticipantSubmission[];
  revealedQuestions: RevealState[];
  leaderboardVisible: boolean;
  isComplete: boolean;
}

export interface QuizState {
  mode: QuizMode;
  currentQuestion: number;
  totalQuestions: number;
  currentQuestionData: QuizQuestion | null;
  teams: Map<string, string>;
  scores: Map<string, number>;
  buzzOrder: string[];
  rankings: RankingData[];
  canBuzz: boolean;
  isHost: boolean;
  settings: QuizSettings;
  // New mode-specific state
  basicSubmissions?: ParticipantSubmission[];
  scheduledState?: ScheduledQuizState;
}

// Session recovery data types
export interface SessionData {
  sessionId: string;
  type: 'quiz' | 'poll';
  currentQuestion: number;
  totalQuestions: number;
  currentQuestionData: QuizQuestion | null;
  teams: [string, string][]; // [socketId, teamName] pairs
  scores: [string, number][]; // [teamName, score] pairs
  buzzOrder: string[];
  canBuzz: boolean;
  quizMode: QuizMode;
  settings: QuizSettings;
  currentPoll: object | null;
  pollHistory: object[];
  teamName?: string;
  userInfo?: Record<string, unknown>;
}

export interface SessionRecoveryRequest {
  sessionId: string;
  userInfo?: {
    teamName?: string;
    isHost?: boolean;
    [key: string]: unknown;
  };
}

// Socket.io event types
export interface ServerToClientEvents {
  // Session recovery events
  'session-created': (data: { sessionId: string; sessionData: SessionData }) => void;
  'session-joined': (data: { sessionId: string; sessionData: SessionData }) => void;
  'session-recovered': (data: { sessionId: string; sessionData: SessionData }) => void;
  'session-not-found': (data: { sessionId: string }) => void;
  'participant-joined': (data: { socketId: string; teamName: string }) => void;
  'participant-disconnected': (data: { socketId: string; teamName: string }) => void;
  
  // Session-based question management events
  'session-questions-updated': (data: { questions: QuizQuestion[]; currentQuestion: number; currentQuestionData: QuizQuestion | null }) => void;
  'session-questions-retrieved': (data: { sessionId: string; questions: QuizQuestion[]; currentQuestion: number }) => void;
  
  // Existing buzzer mode events
  'question-change': (data: QuestionChangeData) => void;
  'buzz': (data: BuzzData) => void;
  'reset-buzzer': () => void;
  'register-team': (data: TeamData) => void;
  'disconnect-team': (socketId: string) => void;
  'celebrate': (data: CelebrationData) => void;
  'answer-revealed': (data: { revealedAnswer: number }) => void;
  'quiz-ended': (data: { message: string }) => void;
  'score-update': (data: { teams: ScoreData[] }) => void;
  'error': (data: { message: string }) => void;
  'connect': () => void;
  'disconnect': () => void;
  'connect_error': (error: Error) => void;
  
  // New mode selection events
  'quiz-mode-set': (data: { mode: QuizMode; settings: QuizSettings }) => void;
  
  // Basic mode events
  'basic-quiz-submitted': (submission: ParticipantSubmission) => void;
  'submission-received': (data: { participantName: string; submissionTime: number }) => void;
  'submissions-count-update': (data: { count: number; total: number }) => void;
  'results-summary': (data: { submissions: ParticipantSubmission[] }) => void;
  'quiz-results': (data: { submission: ParticipantSubmission }) => void;
  
  // Scheduled mode events
  'submission-stored': (data: { participantName: string }) => void;
  'all-submissions': (data: { submissions: ParticipantSubmission[]; revealedQuestions: RevealState[] }) => void;
  'question-revealed': (data: { questionIndex: number; correctAnswer: number }) => void;
  'all-questions-revealed': (data: { leaderboard: LeaderboardEntry[] }) => void;
  'leaderboard-updated': (data: { leaderboard: LeaderboardEntry[]; visible: boolean }) => void;
  'leaderboard-visibility-changed': (data: { visible: boolean }) => void;
  'announcement': (data: { message: string; timestamp: number }) => void;
}

export interface ClientToServerEvents {
  // Session recovery events
  'create-session': (data: { type?: 'quiz' | 'poll'; userInfo?: Record<string, unknown> }) => void;
  'join-session': (data: { sessionId: string; teamName: string }) => void;
  'recover-session': (data: SessionRecoveryRequest) => void;
  
  // Session-based question management events
  'update-session-questions': (data: { sessionId: string; questions: QuizQuestion[] }) => void;
  'get-session-questions': (data: { sessionId: string }) => void;
  
  // Existing buzzer mode events
  'question-change': (data: { questionNumber: number }) => void;
  'buzz': (data: { teamName: string; timestamp: number }) => void;
  'reset-buzzer': () => void;
  'register-team': (data: { teamName: string }) => void;
  'trigger-celebration': (data: { teamName: string }) => void;
  'request-question-number': () => void;
  'set-custom-questions': (data: { questions: QuizQuestion[] }) => void;
  'answer-revealed': (data: { revealedAnswer: number }) => void;
  'host-exit-quiz': () => void;
  
  // Mode selection events
  'set-quiz-mode': (data: { mode: QuizMode; settings: QuizSettings }) => void;
  
  // Basic mode events
  'submit-basic-quiz': (data: { participantName: string; answers: ParticipantAnswer[] }) => void;
  'submit-quiz': (data: { participantName: string; answers: ParticipantAnswer[] }) => void;
  'get-submissions-count': () => void;
  'get-submissions-list': () => void;
  'get-results-summary': () => void;
  'quiz-settings-update': (data: { settings: Partial<QuizSettings> }) => void;
  
  // Scheduled mode events  
  'submit-answers': (data: { participantName: string; answers: ParticipantAnswer[] }) => void;
  'submit-scheduled-quiz': (data: { participantName: string; answers: ParticipantAnswer[] }) => void;
  'get-all-submissions': () => void;
  'reveal-question': (data: { questionIndex: number }) => void;
  'reveal-all': () => void;
  'toggle-leaderboard-visibility': (data: { visible: boolean }) => void;
  'get-leaderboard-status': () => void;
  'send-announcement': (data: { message: string }) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  teamName?: string;
}

// Hardcoded questions removed - all questions now come from database or API generation