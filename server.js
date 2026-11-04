const { createServer } = require('http');
const { parse } = require('url');
const { randomUUID } = require('crypto');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

// Safety net: a bug in one socket handler must never take the whole server down.
// Socket.io dispatches handlers on process.nextTick, so a throw is otherwise fatal.
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception (server kept alive):', err);
});
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection (server kept alive):', err);
});

// ---------------------------------------------------------------------------
// Limits and validation helpers
// ---------------------------------------------------------------------------
const SESSION_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours of inactivity
const DISCONNECT_GRACE_MS = 60 * 1000;         // keep a participant's seat for 60s
const MAX_NAME_LENGTH = 40;
const MAX_TEXT_LENGTH = 500;
const MAX_QUESTIONS = 100;
const MAX_POLL_OPTIONS = 10;
const MAX_ANNOUNCEMENT_LENGTH = 300;

const isInt = (v) => Number.isInteger(v);

function sanitizeName(value) {
  return typeof value === 'string' ? value.trim().slice(0, MAX_NAME_LENGTH) : '';
}

function sanitizeText(value, max = MAX_TEXT_LENGTH) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function isValidQuestion(q) {
  return (
    q && typeof q === 'object' &&
    typeof q.text === 'string' && q.text.trim().length > 0 && q.text.length <= MAX_TEXT_LENGTH &&
    Array.isArray(q.options) && q.options.length === 4 &&
    q.options.every((o) => typeof o === 'string' && o.length <= MAX_TEXT_LENGTH) &&
    isInt(q.correct) && q.correct >= 0 && q.correct <= 3
  );
}

function normalizeQuestions(list) {
  if (!Array.isArray(list) || list.length === 0 || list.length > MAX_QUESTIONS) return null;
  if (!list.every(isValidQuestion)) return null;
  return list.map((q) => ({ text: q.text.trim(), options: q.options.map(String), correct: q.correct }));
}

function normalizeAnswers(answers, questionCount) {
  if (!Array.isArray(answers) || answers.length > questionCount) return null;
  const out = [];
  for (const a of answers) {
    if (!a || typeof a !== 'object') return null;
    if (!isInt(a.questionIndex) || a.questionIndex < 0 || a.questionIndex >= questionCount) return null;
    const sel = a.selectedOption;
    if (!(sel === -1 || (isInt(sel) && sel >= 0 && sel <= 3))) return null;
    out.push({
      questionIndex: a.questionIndex,
      selectedOption: sel,
      timestamp: isInt(a.timestamp) ? a.timestamp : Date.now()
    });
  }
  return out;
}

// Participants must never receive the correct answer index before a reveal.
const publicQuestion = (q) => (q ? { text: q.text, options: q.options } : null);
const publicQuestions = (list) => (list || []).map(publicQuestion);
const sameName = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();

// ---------------------------------------------------------------------------
// Session manager (in-memory, one session per host)
// ---------------------------------------------------------------------------
class SessionManager {
  constructor() {
    this.sessions = new Map();      // sessionId -> session
    this.userSessions = new Map();  // socketId -> sessionId
    this.startCleanup();
  }

  generateSessionId() {
    return `session_${randomUUID()}`;
  }

  createSession(type = 'quiz', customSessionId = null, initialMode = 'buzzer') {
    const sessionId = customSessionId || this.generateSessionId();
    const session = {
      id: sessionId,
      type,
      createdAt: Date.now(),
      lastActivity: Date.now(),

      // Host identity. hostToken is handed only to the creator and lets the
      // host reclaim the session after a reload/reconnect.
      hostSocketId: null,
      hostToken: randomUUID(),

      // Quiz state
      currentQuestion: 1,
      buzzOrder: [],
      teams: new Map(),            // socketId -> teamName
      scores: new Map(),           // teamName -> score
      pendingRemovals: new Map(),  // socketId -> timeout
      quizMode: initialMode,
      quizSettings: {
        mode: initialMode,
        timeLimit: undefined,
        allowRetakes: false,
        showCorrectAnswers: true,
        passingScore: undefined
      },

      // Basic mode
      basicSubmissions: new Map(),      // socketId -> submission

      // Scheduled mode
      scheduledSubmissions: new Map(),  // socketId -> submission
      revealedQuestions: [],
      leaderboardVisible: false,
      announcements: [],

      // Questions (full, including correct index; strip before sending to participants)
      questions: []
    };
    this.sessions.set(sessionId, session);
    console.log(`Created new session: ${sessionId}`);
    return session;
  }

  getSession(sessionId) {
    if (typeof sessionId !== 'string') return undefined;
    const session = this.sessions.get(sessionId);
    if (session) session.lastActivity = Date.now();
    return session;
  }

  associateUserWithSession(socketId, sessionId) {
    this.userSessions.set(socketId, sessionId);
  }

  getUserSession(socketId) {
    const sessionId = this.userSessions.get(socketId);
    return sessionId ? this.getSession(sessionId) : null;
  }

  removeUserFromSession(socketId) {
    const sessionId = this.userSessions.get(socketId);
    if (sessionId) {
      const session = this.sessions.get(sessionId);
      if (session) {
        const teamName = session.teams.get(socketId);
        session.teams.delete(socketId);
        if (teamName && ![...session.teams.values()].some((n) => sameName(n, teamName))) {
          session.scores.delete(teamName);
        }
        session.pendingRemovals.delete(socketId);
        // Submissions are kept so a returning participant keeps their result.
      }
    }
    this.userSessions.delete(socketId);
  }

  deleteSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    for (const t of session.pendingRemovals.values()) clearTimeout(t);
    this.sessions.delete(sessionId);
    for (const [socketId, sessId] of this.userSessions) {
      if (sessId === sessionId) this.userSessions.delete(socketId);
    }
  }

  startCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [sessionId, session] of this.sessions) {
        if (now - session.lastActivity > SESSION_TIMEOUT_MS) {
          console.log(`Cleaning up expired session: ${sessionId}`);
          this.deleteSession(sessionId);
        }
      }
    }, 60000);
  }
}

const sessionManager = new SessionManager();

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------
function percentage(score, total) {
  return total > 0 ? Math.round((score / total) * 100) : 0;
}

function passedFor(session, score) {
  const passing = session.quizSettings.passingScore;
  if (!isInt(passing) && typeof passing !== 'number') return undefined;
  return percentage(score, session.questions.length) >= passing;
}

function assignRanks(entries) {
  // entries must already be sorted. Equal scores share a rank (1,1,3).
  entries.forEach((entry, index) => {
    entry.rank = index > 0 && entries[index - 1].score === entry.score ? entries[index - 1].rank : index + 1;
  });
  return entries;
}

function calculateLeaderboard(session) {
  if (!session) return [];
  const revealed = session.revealedQuestions;
  const revealedCount = revealed.filter((r) => r.isRevealed).length;
  if (revealedCount === 0) return [];

  const leaderboard = [];
  session.scheduledSubmissions.forEach((submission) => {
    let score = 0;
    submission.answers.forEach((answer) => {
      const questionRevealed = revealed[answer.questionIndex]?.isRevealed;
      if (questionRevealed && answer.selectedOption === session.questions[answer.questionIndex]?.correct) {
        score++;
      }
    });
    leaderboard.push({
      rank: 0,
      participantName: submission.participantName,
      score,
      submissionTime: submission.submissionTime,
      questionsRevealed: revealedCount
    });
  });

  leaderboard.sort((a, b) => (a.score === b.score ? a.submissionTime - b.submissionTime : b.score - a.score));
  return assignRanks(leaderboard);
}

// Replace any earlier submission from the same participant name (reconnects get a new socket id).
function storeSubmission(map, socketId, submission) {
  for (const [id, existing] of map) {
    if (id !== socketId && sameName(existing.participantName, submission.participantName)) {
      map.delete(id);
    }
  }
  map.set(socketId, submission);
}

function findSubmissionByName(map, name) {
  for (const existing of map.values()) {
    if (sameName(existing.participantName, name)) return existing;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Global poll state. The polling pages do not create sessions (they connect
// with a plain io() client), so there is one live poll per server. Only the
// socket that created the poll may close it or toggle its results.
// ---------------------------------------------------------------------------
let currentPoll = null;
const pollHistory = [];
const pollParticipants = new Map(); // socketId -> teamName

function calculatePollResults(poll) {
  const voteCounts = new Array(poll.options.length).fill(0);
  const voterNames = {};
  for (let i = 0; i < poll.options.length; i++) voterNames[i] = [];
  poll.votes.forEach((optionIndex, teamName) => {
    if (optionIndex >= 0 && optionIndex < poll.options.length) {
      voteCounts[optionIndex]++;
      voterNames[optionIndex].push(teamName);
    }
  });
  return {
    pollId: poll.id,
    question: poll.question,
    options: poll.options,
    voteCounts,
    totalVotes: poll.votes.size,
    voterNames
  };
}

// Shape sent over the wire (votes is a Map and would serialize to {}).
function publicPoll(poll) {
  if (!poll) return null;
  return {
    id: poll.id,
    question: poll.question,
    options: poll.options,
    votes: {},
    isActive: poll.isActive,
    showResults: poll.showResults,
    createdAt: poll.createdAt,
    closedAt: poll.closedAt
  };
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------
app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handler(req, res, parsedUrl);
  });

  // Same-origin by default. Set APP_ORIGIN (comma separated) to allow others.
  const allowedOrigins = process.env.APP_ORIGIN ? process.env.APP_ORIGIN.split(',').map((s) => s.trim()) : undefined;
  const io = new Server(httpServer, allowedOrigins ? { cors: { origin: allowedOrigins, methods: ['GET', 'POST'] } } : {});

  const isHost = (socket, session) => !!session && session.hostSocketId === socket.id;
  const hostConnected = (session) => !!session.hostSocketId && io.sockets.sockets.has(session.hostSocketId);

  // Build the session snapshot a client receives. Hosts get full questions.
  function sessionSnapshot(session, { forHost = false, teamName, userInfo } = {}) {
    const current = session.questions[session.currentQuestion - 1] || null;
    return {
      type: session.type,
      currentQuestion: session.currentQuestion,
      totalQuestions: session.questions.length,
      currentQuestionData: forHost ? current : publicQuestion(current),
      teams: Array.from(session.teams.entries()),
      scores: Array.from(session.scores.entries()),
      buzzOrder: session.buzzOrder,
      canBuzz: session.buzzOrder.length < 3,
      quizMode: session.quizMode,
      settings: session.quizSettings,
      currentPoll: null,
      pollHistory: [],
      ...(teamName ? { teamName } : {}),
      ...(userInfo ? { userInfo } : {}),
      ...(forHost ? { hostToken: session.hostToken, isHost: true } : {})
    };
  }

  function sendError(socket, message) {
    socket.emit('error', { message });
  }

  // Resolve the caller's session and require that they are its host.
  function requireHost(socket, type = 'quiz') {
    const session = sessionManager.getUserSession(socket.id);
    if (!session || session.type !== type) {
      sendError(socket, 'Session not found');
      return null;
    }
    if (!isHost(socket, session)) {
      sendError(socket, 'Only the host can do that');
      return null;
    }
    return session;
  }

  function requireParticipantSession(socket, type = 'quiz') {
    const session = sessionManager.getUserSession(socket.id);
    if (!session || session.type !== type) {
      sendError(socket, 'Session not found');
      return null;
    }
    return session;
  }

  function resetRevealState(session) {
    session.revealedQuestions = session.questions.map((_, index) => ({
      questionIndex: index,
      isRevealed: false,
      revealedAt: null
    }));
  }

  function seatParticipant(session, socket, teamName) {
    // A returning participant (same name, new socket) replaces their old seat.
    for (const [id, name] of session.teams) {
      if (id !== socket.id && sameName(name, teamName)) {
        session.teams.delete(id);
        const pending = session.pendingRemovals.get(id);
        if (pending) clearTimeout(pending);
        session.pendingRemovals.delete(id);
        sessionManager.userSessions.delete(id);
        // Re-key any stored submission to the new socket id.
        for (const map of [session.basicSubmissions, session.scheduledSubmissions]) {
          const sub = map.get(id);
          if (sub) {
            map.delete(id);
            sub.socketId = socket.id;
            map.set(socket.id, sub);
          }
        }
      }
    }
    sessionManager.associateUserWithSession(socket.id, session.id);
    session.teams.set(socket.id, teamName);
    if (!session.scores.has(teamName)) session.scores.set(teamName, 0);
    socket.join(`quiz_${session.id}`);
  }

  function sendModeToParticipant(socket, session) {
    socket.emit('quiz-mode-set', {
      mode: session.quizMode,
      settings: session.quizSettings,
      questions: publicQuestions(session.questions)
    });
    if (session.quizMode === 'buzzer') {
      socket.emit('question-change', {
        questionNumber: session.currentQuestion,
        questionData: publicQuestion(session.questions[session.currentQuestion - 1])
      });
    }
  }

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // ---------------- Session lifecycle ----------------

    socket.on('create-session', (data = {}) => {
      const type = data.type === 'poll' ? 'poll' : 'quiz';
      const initialMode = ['buzzer', 'basic', 'scheduled'].includes(data.initialMode) ? data.initialMode : 'buzzer';
      const customSessionId = typeof data.customSessionId === 'string' && data.customSessionId.length <= 128
        ? data.customSessionId
        : null;
      const providedToken = data.userInfo && typeof data.userInfo.hostToken === 'string' ? data.userInfo.hostToken : null;

      if (data.customSessionId !== undefined && !customSessionId) {
        socket.emit('session-creation-error', { error: 'Invalid session id' });
        return;
      }

      const existing = customSessionId ? sessionManager.getSession(customSessionId) : null;
      if (existing) {
        // Reclaim is allowed with the host token, or when no host is connected
        // (e.g. the host's browser crashed and local storage was lost).
        const mayReclaim = providedToken === existing.hostToken || !hostConnected(existing);
        if (!mayReclaim) {
          socket.emit('session-creation-error', { error: 'That session already has a host' });
          return;
        }
        existing.hostSocketId = socket.id;
        sessionManager.associateUserWithSession(socket.id, existing.id);
        socket.join(`${existing.type}_${existing.id}`);
        socket.emit('session-created', {
          sessionId: existing.id,
          hostToken: existing.hostToken,
          sessionData: sessionSnapshot(existing, { forHost: true })
        });
        console.log(`Host reclaimed existing session: ${existing.id}`);
        return;
      }

      const session = sessionManager.createSession(type, customSessionId, initialMode);
      session.hostSocketId = socket.id;
      sessionManager.associateUserWithSession(socket.id, session.id);
      socket.join(`${session.type}_${session.id}`);

      socket.emit('session-created', {
        sessionId: session.id,
        hostToken: session.hostToken,
        sessionData: sessionSnapshot(session, { forHost: true })
      });
      console.log(`New session created: ${session.id}`);
    });

    socket.on('recover-session', (data = {}) => {
      const { sessionId } = data;
      const userInfo = data.userInfo && typeof data.userInfo === 'object' ? data.userInfo : {};
      const session = sessionManager.getSession(sessionId);
      if (!session) {
        socket.emit('session-not-found', { sessionId });
        return;
      }

      const claimsHost = userInfo.isHost === true;
      const tokenMatches = typeof userInfo.hostToken === 'string' && userInfo.hostToken === session.hostToken;
      const recoverAsHost = tokenMatches || (claimsHost && !hostConnected(session));

      if (recoverAsHost) {
        session.hostSocketId = socket.id;
        sessionManager.associateUserWithSession(socket.id, session.id);
        socket.join(`${session.type}_${session.id}`);
        socket.emit('session-recovered', {
          sessionId: session.id,
          sessionData: sessionSnapshot(session, { forHost: true, userInfo: { ...userInfo, hostToken: session.hostToken, isHost: true } })
        });
        console.log(`Host recovered session: ${session.id}`);
        return;
      }

      if (claimsHost) {
        sendError(socket, 'That session already has a connected host');
        socket.emit('session-not-found', { sessionId });
        return;
      }

      const teamName = sanitizeName(userInfo.teamName);
      if (!teamName) {
        socket.emit('session-not-found', { sessionId });
        return;
      }
      seatParticipant(session, socket, teamName);
      socket.emit('session-recovered', {
        sessionId: session.id,
        sessionData: sessionSnapshot(session, { teamName, userInfo: { teamName } })
      });
      sendModeToParticipant(socket, session);
      console.log(`Participant ${teamName} recovered session: ${session.id}`);
    });

    socket.on('join-session', (data = {}) => {
      const { sessionId } = data;
      const teamName = sanitizeName(data.teamName);
      const session = sessionManager.getSession(sessionId);
      if (!session) {
        socket.emit('session-not-found', { sessionId });
        return;
      }
      if (!teamName) return sendError(socket, 'A name is required');
      if (session.type !== 'quiz') return sendError(socket, 'Polls are joined from the polling page');

      seatParticipant(session, socket, teamName);
      socket.emit('session-joined', {
        sessionId: session.id,
        sessionData: sessionSnapshot(session, { teamName })
      });
      socket.to(`quiz_${session.id}`).emit('participant-joined', { socketId: socket.id, teamName });
      console.log(`${teamName} joined session: ${session.id}`);
    });

    // Preferred participant join (used by the share link).
    socket.on('join-quiz-session', (data = {}) => {
      const { sessionId } = data;
      const teamName = sanitizeName(data.teamName);
      const session = sessionManager.getSession(sessionId);

      if (!session || session.type !== 'quiz') {
        socket.emit('session-join-failed', { sessionId, error: 'Session not found or not available' });
        return;
      }
      if (!teamName) {
        socket.emit('session-join-failed', { sessionId, error: 'A team name is required' });
        return;
      }

      seatParticipant(session, socket, teamName);
      sendModeToParticipant(socket, session);
      socket.to(`quiz_${session.id}`).emit('register-team', { socketId: socket.id, teamName });
      socket.emit('session-joined-successfully', { sessionId, teamName });
      console.log(`Participant ${teamName} joined quiz session: ${sessionId} (mode: ${session.quizMode})`);
    });

    // Legacy registration. Only re-registers within the session this socket
    // already belongs to; it never drops a participant into someone else's quiz.
    socket.on('register-team', (data = {}) => {
      const teamName = sanitizeName(data.teamName);
      const session = sessionManager.getUserSession(socket.id);
      if (!session || session.type !== 'quiz') {
        return sendError(socket, 'Use the join link from your host to join a quiz');
      }
      if (!teamName) return sendError(socket, 'A team name is required');
      seatParticipant(session, socket, teamName);
      sendModeToParticipant(socket, session);
      socket.to(`quiz_${session.id}`).emit('register-team', { socketId: socket.id, teamName });
    });

    // ---------------- Questions ----------------

    socket.on('set-custom-questions', (data = {}) => {
      const session = requireHost(socket);
      if (!session) return;
      const questions = normalizeQuestions(data.questions);
      if (!questions) return sendError(socket, 'Invalid questions payload');

      session.questions = questions;
      session.currentQuestion = 1;
      session.buzzOrder = [];
      resetRevealState(session);

      socket.to(`quiz_${session.id}`).emit('question-change', {
        questionNumber: 1,
        questionData: publicQuestion(questions[0])
      });
      socket.emit('question-change', { questionNumber: 1, questionData: questions[0] });
    });

    socket.on('update-session-questions', (data = {}) => {
      const { sessionId } = data;
      const session = sessionManager.getSession(sessionId);
      if (!session) {
        socket.emit('session-not-found', { sessionId });
        return;
      }
      if (!isHost(socket, session)) return sendError(socket, 'Only the host can change the questions');

      const questions = normalizeQuestions(data.questions);
      if (!questions) return sendError(socket, 'Invalid questions payload');

      // A host reload re-sends the same questions; only reset progress when
      // the question set actually changed (or a reset is explicitly requested).
      const changed = JSON.stringify(questions) !== JSON.stringify(session.questions);
      if (changed || data.reset === true) {
        session.questions = questions;
        session.currentQuestion = 1;
        session.buzzOrder = [];
        resetRevealState(session);
      }

      socket.to(`quiz_${session.id}`).emit('session-questions-updated', {
        questions: publicQuestions(session.questions),
        currentQuestion: session.currentQuestion,
        currentQuestionData: publicQuestion(session.questions[session.currentQuestion - 1])
      });
      socket.emit('session-questions-updated', {
        questions: session.questions,
        currentQuestion: session.currentQuestion,
        currentQuestionData: session.questions[session.currentQuestion - 1] || null
      });
      console.log(`Session ${session.id} has ${session.questions.length} questions${changed ? ' (updated)' : ''}`);
    });

    socket.on('get-session-questions', (data = {}) => {
      const { sessionId } = data;
      const session = sessionManager.getSession(sessionId);
      if (!session) {
        socket.emit('session-not-found', { sessionId });
        return;
      }
      const forHost = isHost(socket, session);
      socket.emit('session-questions-retrieved', {
        sessionId,
        questions: forHost ? session.questions : publicQuestions(session.questions),
        currentQuestion: session.currentQuestion || 1
      });
    });

    // ---------------- Mode and settings ----------------

    socket.on('set-quiz-mode', (data = {}) => {
      const session = requireHost(socket);
      if (!session) return;
      if (!['buzzer', 'basic', 'scheduled'].includes(data.mode)) return sendError(socket, 'Invalid quiz mode');

      session.quizMode = data.mode;
      session.quizSettings = { ...session.quizSettings, ...(data.settings && typeof data.settings === 'object' ? data.settings : {}), mode: data.mode };

      socket.to(`quiz_${session.id}`).emit('quiz-mode-set', {
        mode: session.quizMode,
        settings: session.quizSettings,
        questions: publicQuestions(session.questions)
      });
      socket.emit('quiz-mode-set', {
        mode: session.quizMode,
        settings: session.quizSettings,
        questions: session.questions
      });
    });

    socket.on('quiz-settings-update', (data = {}) => {
      const session = requireHost(socket);
      if (!session) return;
      if (!data.settings || typeof data.settings !== 'object') return sendError(socket, 'Invalid settings');
      session.quizSettings = { ...session.quizSettings, ...data.settings, mode: session.quizMode };
      io.to(`quiz_${session.id}`).emit('quiz-settings-updated', { settings: session.quizSettings });
    });

    // ---------------- Basic mode ----------------

    socket.on('submit-basic-quiz', (data = {}) => {
      const session = requireParticipantSession(socket);
      if (!session) return;
      const participantName = sanitizeName(data.participantName) || session.teams.get(socket.id);
      if (!participantName) return sendError(socket, 'Join the quiz before submitting');
      const answers = normalizeAnswers(data.answers, session.questions.length);
      if (!answers) return sendError(socket, 'Invalid answers payload');

      const previous = session.basicSubmissions.get(socket.id) || findSubmissionByName(session.basicSubmissions, participantName);
      if (previous && !session.quizSettings.allowRetakes) {
        return sendError(socket, 'You have already submitted this quiz');
      }

      let score = 0;
      answers.forEach((answer) => {
        if (answer.selectedOption === session.questions[answer.questionIndex]?.correct) score++;
      });

      const submission = {
        participantName,
        socketId: socket.id,
        answers,
        submissionTime: Date.now(),
        score,
        percentage: percentage(score, session.questions.length),
        passed: passedFor(session, score),
        isComplete: true
      };
      storeSubmission(session.basicSubmissions, socket.id, submission);

      // The participant gets their own result. Correct answers are included
      // only when the host chose to show them.
      socket.emit('basic-quiz-submitted', {
        submission,
        totalQuestions: session.questions.length,
        correctAnswers: session.quizSettings.showCorrectAnswers ? session.questions.map((q) => q.correct) : undefined
      });

      socket.to(`quiz_${session.id}`).emit('basic-quiz-submitted', submission);
      socket.to(`quiz_${session.id}`).emit('submission-received', {
        participantName,
        submissionTime: submission.submissionTime
      });
      socket.to(`quiz_${session.id}`).emit('submissions-count-update', {
        count: session.basicSubmissions.size,
        total: session.teams.size
      });
      console.log(`Basic quiz submitted in session ${session.id}: ${participantName} (score: ${score})`);
    });

    socket.on('get-submissions-count', () => {
      const session = sessionManager.getUserSession(socket.id);
      if (session && session.type === 'quiz') {
        socket.emit('submissions-count-update', { count: session.basicSubmissions.size, total: session.teams.size });
      } else {
        socket.emit('submissions-count-update', { count: 0, total: 0 });
      }
    });

    socket.on('get-results-summary', () => {
      const session = requireHost(socket);
      if (!session) return;
      socket.emit('results-summary', { submissions: Array.from(session.basicSubmissions.values()) });
    });

    // ---------------- Scheduled mode ----------------

    socket.on('submit-answers', (data = {}) => {
      const session = requireParticipantSession(socket);
      if (!session) return;
      const participantName = sanitizeName(data.participantName) || session.teams.get(socket.id);
      if (!participantName) return sendError(socket, 'Join the quiz before submitting');
      const answers = normalizeAnswers(data.answers, session.questions.length);
      if (!answers) return sendError(socket, 'Invalid answers payload');

      const previous = session.scheduledSubmissions.get(socket.id) || findSubmissionByName(session.scheduledSubmissions, participantName);
      if (previous && !session.quizSettings.allowRetakes) {
        return sendError(socket, 'You have already submitted this quiz');
      }

      const submission = {
        participantName,
        socketId: socket.id,
        answers,
        submissionTime: Date.now(),
        score: 0, // calculated at reveal time
        isComplete: true
      };
      storeSubmission(session.scheduledSubmissions, socket.id, submission);

      socket.emit('submission-stored', { participantName });
      socket.to(`quiz_${session.id}`).emit('submission-received', {
        participantName,
        submissionTime: submission.submissionTime
      });
      console.log(`Scheduled submission stored in session ${session.id} for ${participantName}`);
    });

    socket.on('reveal-question', (data = {}) => {
      const session = requireHost(socket);
      if (!session) return;
      const questionIndex = Number(data.questionIndex);
      if (!isInt(questionIndex) || questionIndex < 0 || questionIndex >= session.questions.length) {
        return sendError(socket, 'Invalid question index');
      }
      if (session.revealedQuestions.length !== session.questions.length) resetRevealState(session);

      session.revealedQuestions[questionIndex] = { questionIndex, isRevealed: true, revealedAt: Date.now() };
      const leaderboard = calculateLeaderboard(session);
      const payload = { questionIndex, correctAnswer: session.questions[questionIndex].correct };

      io.to(`quiz_${session.id}`).emit('question-revealed', payload);
      io.to(`quiz_${session.id}`).emit('leaderboard-updated', { leaderboard, visible: session.leaderboardVisible });
    });

    socket.on('reveal-all', () => {
      const session = requireHost(socket);
      if (!session) return;

      session.revealedQuestions = session.questions.map((_, index) => ({
        questionIndex: index,
        isRevealed: true,
        revealedAt: Date.now()
      }));
      const leaderboard = calculateLeaderboard(session);
      const correctAnswers = session.questions.map((q) => q.correct);

      io.to(`quiz_${session.id}`).emit('all-questions-revealed', { leaderboard, correctAnswers });
      io.to(`quiz_${session.id}`).emit('leaderboard-updated', { leaderboard, visible: session.leaderboardVisible });
    });

    socket.on('toggle-leaderboard-visibility', (data = {}) => {
      const session = requireHost(socket);
      if (!session) return;
      session.leaderboardVisible = data.visible === true;
      const leaderboard = calculateLeaderboard(session);

      io.to(`quiz_${session.id}`).emit('leaderboard-visibility-changed', { visible: session.leaderboardVisible });
      io.to(`quiz_${session.id}`).emit('leaderboard-updated', { leaderboard, visible: session.leaderboardVisible });
    });

    socket.on('get-leaderboard-status', () => {
      const session = sessionManager.getUserSession(socket.id);
      if (!session || session.type !== 'quiz') {
        return socket.emit('leaderboard-updated', { leaderboard: [], visible: false });
      }
      const leaderboard = isHost(socket, session) || session.leaderboardVisible ? calculateLeaderboard(session) : [];
      socket.emit('leaderboard-updated', { leaderboard, visible: session.leaderboardVisible });
    });

    socket.on('send-announcement', (data = {}) => {
      const session = requireHost(socket);
      if (!session) return;
      const message = sanitizeText(data.message, MAX_ANNOUNCEMENT_LENGTH);
      if (!message) return sendError(socket, 'Announcement cannot be empty');

      const announcement = { message, timestamp: Date.now() };
      session.announcements.push(announcement);
      if (session.announcements.length > 10) session.announcements.shift();
      io.to(`quiz_${session.id}`).emit('announcement', announcement);
    });

    socket.on('get-all-submissions', () => {
      const session = requireHost(socket);
      if (!session) return;
      socket.emit('all-submissions', {
        submissions: Array.from(session.scheduledSubmissions.values()),
        revealedQuestions: session.revealedQuestions || []
      });
    });

    // ---------------- Buzzer mode ----------------

    socket.on('question-change', (data = {}) => {
      const session = requireHost(socket);
      if (!session) return;
      const questionNumber = Number(data.questionNumber);
      if (!isInt(questionNumber) || questionNumber < 1 || questionNumber > Math.max(session.questions.length, 1)) {
        return sendError(socket, 'Invalid question number');
      }
      session.currentQuestion = questionNumber;
      session.buzzOrder = [];
      const question = session.questions[questionNumber - 1] || null;

      socket.to(`quiz_${session.id}`).emit('question-change', { questionNumber, questionData: publicQuestion(question) });
      socket.emit('question-change', { questionNumber, questionData: question });
    });

    socket.on('buzz', (data = {}) => {
      const session = requireParticipantSession(socket);
      if (!session) return;
      // Trust the seat, not the payload, for who buzzed.
      const teamName = session.teams.get(socket.id) || sanitizeName(data.teamName);
      if (!teamName) return sendError(socket, 'Join the quiz before buzzing');
      if (session.buzzOrder.includes(teamName)) return;

      session.buzzOrder.push(teamName);
      const buzzData = {
        teamName,
        timestamp: isInt(data.timestamp) ? data.timestamp : Date.now(),
        rank: session.buzzOrder.length,
        socketId: socket.id,
        totalResponses: session.buzzOrder.length
      };
      io.to(`quiz_${session.id}`).emit('buzz', buzzData);
    });

    socket.on('reset-buzzer', () => {
      const session = requireHost(socket);
      if (!session) return;
      session.buzzOrder = [];
      io.to(`quiz_${session.id}`).emit('reset-buzzer');
    });

    socket.on('trigger-celebration', (data = {}) => {
      const session = requireHost(socket);
      if (!session) return;
      const teamName = sanitizeName(data.teamName);
      if (!teamName) return;
      io.to(`quiz_${session.id}`).emit('celebrate', { teamName });
    });

    socket.on('answer-revealed', (data = {}) => {
      const session = requireHost(socket);
      if (!session) return;
      const revealedAnswer = Number(data.revealedAnswer);
      if (!isInt(revealedAnswer) || revealedAnswer < 0 || revealedAnswer > 3) return sendError(socket, 'Invalid answer index');
      socket.to(`quiz_${session.id}`).emit('answer-revealed', { revealedAnswer });
    });

    socket.on('request-question-number', () => {
      const session = sessionManager.getUserSession(socket.id);
      if (!session || session.questions.length === 0) return;
      const question = session.questions[session.currentQuestion - 1] || null;
      socket.emit('question-change', {
        questionNumber: session.currentQuestion,
        questionData: isHost(socket, session) ? question : publicQuestion(question)
      });
    });

    socket.on('host-exit-quiz', () => {
      const session = requireHost(socket);
      if (!session) return;
      console.log(`Host ended session ${session.id}`);
      io.to(`quiz_${session.id}`).emit('quiz-ended', { message: 'The quiz has been ended by the host.' });
      io.in(`quiz_${session.id}`).socketsLeave(`quiz_${session.id}`);
      sessionManager.deleteSession(session.id);
    });

    // ---------------- Polling ----------------

    socket.on('register-participant', (data = {}) => {
      const teamName = sanitizeName(data.teamName);
      if (!teamName) return sendError(socket, 'A name is required');
      pollParticipants.set(socket.id, teamName);
      if (currentPoll) socket.emit('poll-created', publicPoll(currentPoll));
    });

    socket.on('create-poll', (data = {}) => {
      const question = sanitizeText(data.question);
      const options = Array.isArray(data.options)
        ? data.options.map((o) => sanitizeText(o, 200)).filter(Boolean).slice(0, MAX_POLL_OPTIONS)
        : [];
      if (!question || options.length < 2) return sendError(socket, 'A poll needs a question and at least two options');

      // Only the creator of the current poll may replace it while it is active.
      if (currentPoll && currentPoll.isActive && currentPoll.hostSocketId !== socket.id && io.sockets.sockets.has(currentPoll.hostSocketId)) {
        return sendError(socket, 'Another host has an active poll running');
      }

      const id = typeof data.id === 'string' && data.id.length <= 128 ? data.id : Date.now().toString();
      currentPoll = {
        id,
        hostSocketId: socket.id,
        question,
        options,
        votes: new Map(),
        isActive: true,
        showResults: data.showResults === true,
        createdAt: Date.now()
      };
      io.emit('poll-created', publicPoll(currentPoll));
    });

    socket.on('cast-vote', (data = {}) => {
      if (!currentPoll || !currentPoll.isActive) return sendError(socket, 'No active poll');
      const teamName = pollParticipants.get(socket.id);
      if (!teamName) return sendError(socket, 'Not registered as participant');
      if (currentPoll.votes.has(teamName)) return sendError(socket, 'Already voted');
      const optionIndex = Number(data.optionIndex);
      if (!isInt(optionIndex) || optionIndex < 0 || optionIndex >= currentPoll.options.length) {
        return sendError(socket, 'Invalid option');
      }

      currentPoll.votes.set(teamName, optionIndex);
      socket.emit('vote-cast', { pollId: currentPoll.id, teamName, optionIndex, timestamp: Date.now() });
      io.emit('poll-updated', { poll: publicPoll(currentPoll), results: calculatePollResults(currentPoll) });
    });

    socket.on('close-poll', (pollId) => {
      if (!currentPoll || currentPoll.id !== pollId) return;
      if (currentPoll.hostSocketId !== socket.id) return sendError(socket, 'Only the poll host can close it');
      currentPoll.isActive = false;
      currentPoll.closedAt = Date.now();
      pollHistory.unshift({ ...currentPoll });
      if (pollHistory.length > 50) pollHistory.pop();
      io.emit('poll-closed', calculatePollResults(currentPoll));
    });

    socket.on('toggle-results', (pollId) => {
      if (!currentPoll || currentPoll.id !== pollId) return;
      if (currentPoll.hostSocketId !== socket.id) return sendError(socket, 'Only the poll host can show results');
      currentPoll.showResults = !currentPoll.showResults;
      io.emit('poll-updated', { poll: publicPoll(currentPoll), results: calculatePollResults(currentPoll) });
    });

    socket.on('request-current-poll', () => {
      if (!currentPoll) return;
      socket.emit('poll-created', publicPoll(currentPoll));
      socket.emit('poll-updated', { poll: publicPoll(currentPoll), results: calculatePollResults(currentPoll) });
    });

    // ---------------- Disconnect ----------------

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      pollParticipants.delete(socket.id);

      const session = sessionManager.getUserSession(socket.id);
      if (!session) return;

      if (isHost(socket, session)) {
        // Keep the session so the host can reclaim it; participants are told nothing.
        console.log(`Host disconnected from session ${session.id}; waiting for reclaim`);
        return;
      }

      const teamName = session.teams.get(socket.id);
      if (teamName) {
        socket.to(`${session.type}_${session.id}`).emit('participant-disconnected', { socketId: socket.id, teamName });
        socket.to(`${session.type}_${session.id}`).emit('disconnect-team', socket.id);

        // Give the participant a grace period to reconnect before freeing the seat.
        const timeout = setTimeout(() => {
          if (session.teams.get(socket.id) === teamName) {
            sessionManager.removeUserFromSession(socket.id);
            console.log(`Removed ${teamName} from session ${session.id} after grace period`);
          }
        }, DISCONNECT_GRACE_MS);
        session.pendingRemovals.set(socket.id, timeout);
      } else {
        sessionManager.userSessions.delete(socket.id);
      }
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
