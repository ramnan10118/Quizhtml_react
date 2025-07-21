export interface Poll {
  id: string;
  question: string;
  options: string[];
  votes: Map<string, number>; // teamName -> optionIndex
  isActive: boolean;
  showResults: boolean;
  createdAt: number;
  closedAt?: number;
}

export interface PollVote {
  pollId: string;
  teamName: string;
  optionIndex: number;
  timestamp: number;
}

export interface PollResults {
  pollId: string;
  question: string;
  options: string[];
  voteCounts: number[]; // votes per option
  totalVotes: number;
  voterNames: Record<number, string[]>; // optionIndex -> teamNames[]
}

export interface PollCreateData {
  question: string;
  options: string[];
}

export interface PollStateUpdate {
  poll: Poll;
  results: PollResults;
}

// Socket.io event types for polling
export interface PollingServerToClientEvents {
  'poll-created': (poll: Poll) => void;
  'poll-updated': (data: PollStateUpdate) => void;
  'poll-closed': (results: PollResults) => void;
  'vote-cast': (vote: PollVote) => void;
  'poll-results': (results: PollResults) => void;
  'connect': () => void;
  'disconnect': () => void;
}

export interface PollingClientToServerEvents {
  'create-poll': (data: PollCreateData) => void;
  'cast-vote': (vote: { pollId: string; optionIndex: number; teamName: string }) => void;
  'close-poll': (pollId: string) => void;
  'toggle-results': (pollId: string) => void;
  'register-participant': (data: { teamName: string }) => void;
  'request-current-poll': () => void;
}

export interface PollState {
  currentPoll: Poll | null;
  pollHistory: Poll[];
  participants: Map<string, string>; // socketId -> teamName
  isHost: boolean;
  canVote: boolean;
  hasVoted: boolean;
}

export interface PollCreatorData {
  question: string;
  options: string[];
  isValid: boolean;
}