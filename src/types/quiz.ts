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
  'answer-revealed': (data: { revealedAnswer: number }) => void;
  'quiz-ended': (data: { message: string }) => void;
}

export interface ClientToServerEvents {
  'question-change': (data: { questionNumber: number }) => void;
  'buzz': (data: { teamName: string; timestamp: number }) => void;
  'reset-buzzer': () => void;
  'register-team': (data: { teamName: string }) => void;
  'trigger-celebration': (data: { teamName: string }) => void;
  'request-question-number': () => void;
  'set-custom-questions': (data: { questions: QuizQuestion[] }) => void;
  'answer-revealed': (data: { revealedAnswer: number }) => void;
  'host-exit-quiz': () => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  teamName?: string;
}

// Quiz questions data
export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    text: "Who has more Instagram followers?",
    options: [
      "Kylie Jenner",
      "Lionel Messi", 
      "Cristiano Ronaldo",
      "Kim Kardashian"
    ],
    correct: 2
  },
  {
    text: "Which movie made more money in 2023?",
    options: [
      "Barbie",
      "Oppenheimer",
      "Mario Movie",
      "Avatar 2"
    ],
    correct: 0
  },
  {
    text: "What's Taylor Swift's cat's name?",
    options: [
      "Meredith",
      "Oliver",
      "Luna",
      "Bella"
    ],
    correct: 0
  },
  {
    text: "Which Netflix show features Wednesday Addams?",
    options: [
      "Stranger Things",
      "Wednesday",
      "Shadow and Bone",
      "Outer Banks"
    ],
    correct: 1
  },
  {
    text: "Most played song on Spotify ever is:",
    options: [
      "Shape of You",
      "Blinding Lights",
      "Dance Monkey",
      "Someone Like You"
    ],
    correct: 0
  },
  {
    text: "What's the most used emoji worldwide?",
    options: [
      "😂",
      "❤️",
      "👍",
      "😭"
    ],
    correct: 0
  },
  {
    text: "Which platform has more users?",
    options: [
      "Instagram",
      "TikTok",
      "Twitter",
      "Snapchat"
    ],
    correct: 0
  },
  {
    text: "Who won Best Actor Oscar 2023?",
    options: [
      "Austin Butler",
      "Brendan Fraser",
      "Colin Farrell",
      "Tom Cruise"
    ],
    correct: 1
  },
  {
    text: "What's BTS's fandom called?",
    options: [
      "ARMY",
      "BLINK",
      "ONCE",
      "STAY"
    ],
    correct: 0
  },
  {
    text: "Most subscribed YouTube channel is:",
    options: [
      "PewDiePie",
      "MrBeast",
      "T-Series",
      "Cocomelon"
    ],
    correct: 1
  },
  {
    text: "How many subscribers does ACKO insurance YouTube channel have?",
    options: [
      "125K",
      "250K",
      "500K",
      "750K"
    ],
    correct: 1
  },
  {
    text: "How many vehicles do we insure today at ACKO?",
    options: [
      "2 Million",
      "3.5 Million",
      "5 Million",
      "7 Million"
    ],
    correct: 2
  },
  {
    text: "How many health policies have we sold till date at ACKO?",
    options: [
      "100K",
      "250K",
      "500K",
      "1 Million"
    ],
    correct: 3
  }
];