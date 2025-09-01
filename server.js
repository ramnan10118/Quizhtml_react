const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

// Session Manager for in-memory caching
class SessionManager {
  constructor() {
    this.sessions = new Map(); // sessionId -> sessionData
    this.userSessions = new Map(); // socketId -> sessionId
    this.startCleanup();
  }

  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  createSession(type = 'quiz', customSessionId = null, initialMode = 'buzzer') {
    const sessionId = customSessionId || this.generateSessionId();
    const sessionData = {
      id: sessionId,
      type: type, // 'quiz' or 'poll'
      createdAt: Date.now(),
      lastActivity: Date.now(),
      
      // Quiz state
      currentQuestion: 1,
      buzzOrder: [],
      teams: new Map(),
      scores: new Map(),
      quizMode: initialMode,
      quizSettings: {
        mode: initialMode,
        timeLimit: undefined,
        allowRetakes: false,
        showCorrectAnswers: true,
        passingScore: undefined
      },
      
      // Basic mode state
      basicSubmissions: new Map(),
      
      // Scheduled mode state
      scheduledSubmissions: new Map(),
      revealedQuestions: [],
      leaderboardVisible: false,
      announcements: [],
      
      // Polling state
      currentPoll: null,
      pollHistory: [],
      pollParticipants: new Map(),
      
      // Questions (can be overridden)
      questions: []
    };
    
    this.sessions.set(sessionId, sessionData);
    console.log(`Created new session: ${sessionId}`);
    return sessionData;
  }

  getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = Date.now();
    }
    return session;
  }

  updateSession(sessionId, updates) {
    const session = this.sessions.get(sessionId);
    if (session) {
      Object.assign(session, updates);
      session.lastActivity = Date.now();
      return session;
    }
    return null;
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
      const session = this.getSession(sessionId);
      if (session) {
        // Remove user from session data
        const teamName = session.teams.get(socketId);
        session.teams.delete(socketId);
        if (teamName) {
          session.scores.delete(teamName);
        }
        session.pollParticipants.delete(socketId);
        session.basicSubmissions.delete(socketId);
        session.scheduledSubmissions.delete(socketId);
      }
    }
    this.userSessions.delete(socketId);
  }

  startCleanup() {
    setInterval(() => {
      const now = Date.now();
      const SESSION_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours
      
      for (let [sessionId, session] of this.sessions) {
        if (now - session.lastActivity > SESSION_TIMEOUT) {
          console.log(`Cleaning up expired session: ${sessionId}`);
          this.sessions.delete(sessionId);
          
          // Clean up user associations
          for (let [socketId, sessId] of this.userSessions) {
            if (sessId === sessionId) {
              this.userSessions.delete(socketId);
            }
          }
        }
      }
    }, 60000); // Check every minute
  }

  getAllSessions() {
    return Array.from(this.sessions.values());
  }
}

// Initialize session manager
const sessionManager = new SessionManager();

// Legacy global state - DEPRECATED (kept for cleanup)
// All state is now managed in sessions for multi-host support

// Default questions removed - all questions are now session-specific

// Helper functions
function calculateLeaderboard(sessionData = null) {
  const leaderboard = [];
  let submissions, revealed, questionsToCheck;
  
  if (sessionData) {
    // Use session-based data
    submissions = sessionData.scheduledSubmissions;
    revealed = sessionData.revealedQuestions;
    questionsToCheck = sessionData.questions;
  } else {
    // Legacy fallback - should not be used in session-based architecture
    return []; // Return empty leaderboard if no session data
  }
  
  const revealedCount = revealed.filter(r => r.isRevealed).length;
  
  if (revealedCount === 0) {
    return [];
  }
  
  submissions.forEach((submission, socketId) => {
    let score = 0;
    
    // Calculate score based on revealed questions only
    submission.answers.forEach(answer => {
      const questionRevealed = revealed[answer.questionIndex]?.isRevealed;
      if (questionRevealed && answer.selectedOption === questionsToCheck[answer.questionIndex]?.correct) {
        score++;
      }
    });
    
    leaderboard.push({
      rank: 0, // Will be set after sorting
      participantName: submission.participantName,
      score: score,
      submissionTime: submission.submissionTime,
      questionsRevealed: revealedCount
    });
  });
  
  // Sort by score (descending), then by submission time (ascending)
  leaderboard.sort((a, b) => {
    if (a.score === b.score) {
      return a.submissionTime - b.submissionTime;
    }
    return b.score - a.score;
  });
  
  // Assign ranks
  leaderboard.forEach((entry, index) => {
    entry.rank = index + 1;
  });
  
  return leaderboard;
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handler(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // SESSION RECOVERY EVENTS
    socket.on('recover-session', (data) => {
      const { sessionId, userInfo } = data;
      console.log(`Session recovery requested for: ${sessionId}`);
      
      const session = sessionManager.getSession(sessionId);
      if (session) {
        // Associate user with session
        sessionManager.associateUserWithSession(socket.id, sessionId);
        
        // Restore user to their teams/participants if they were part of it
        if (userInfo?.teamName) {
          session.teams.set(socket.id, userInfo.teamName);
          if (!session.scores.has(userInfo.teamName)) {
            session.scores.set(userInfo.teamName, 0);
          }
          session.pollParticipants.set(socket.id, userInfo.teamName);
        }
        
        // Send session data to client
        socket.emit('session-recovered', {
          sessionId: sessionId,
          sessionData: {
            type: session.type,
            currentQuestion: session.currentQuestion,
            totalQuestions: session.questions.length,
            currentQuestionData: session.questions[session.currentQuestion - 1] || null,
            teams: Array.from(session.teams.entries()),
            scores: Array.from(session.scores.entries()),
            buzzOrder: session.buzzOrder,
            canBuzz: session.buzzOrder.length < 3,
            quizMode: session.quizMode,
            settings: session.quizSettings,
            currentPoll: session.currentPoll,
            pollHistory: session.pollHistory,
            userInfo: userInfo
          }
        });
        
        // Join appropriate rooms
        if (session.type === 'quiz') {
          socket.join(`quiz_${sessionId}`);
        } else if (session.type === 'poll') {
          socket.join(`poll_${sessionId}`);
        }
        
        console.log(`Session recovered successfully: ${sessionId}`);
      } else {
        console.log(`Session not found: ${sessionId}`);
        socket.emit('session-not-found', { sessionId });
      }
    });

    socket.on('create-session', (data) => {
      console.log('🔧 Server received create-session request:', data);
      const { type = 'quiz', userInfo, customSessionId, initialMode = 'buzzer' } = data;
      
      // Check if session with this ID already exists
      if (customSessionId && sessionManager.getSession(customSessionId)) {
        console.log(`Session ${customSessionId} already exists, not creating duplicate`);
        const existingSession = sessionManager.getSession(customSessionId);
        
        // Associate user with existing session
        sessionManager.associateUserWithSession(socket.id, customSessionId);
        
        // Host joins the session room
        if (existingSession?.type === 'quiz') {
          socket.join(`quiz_${customSessionId}`);
          console.log(`Host joined existing quiz room: quiz_${customSessionId}`);
        } else if (existingSession?.type === 'poll') {
          socket.join(`poll_${customSessionId}`);
        }
        
        socket.emit('session-created', {
          sessionId: customSessionId,
          sessionData: existingSession
        });
        return;
      }
      
      const session = sessionManager.createSession(type, customSessionId, initialMode);
      
      // Associate creator with session
      sessionManager.associateUserWithSession(socket.id, session.id);
      
      // Set initial questions (empty - will be set by host)
      session.questions = [];
      
      // Initialize reveal state for scheduled mode
      session.revealedQuestions = session.questions.map((_, index) => ({
        questionIndex: index,
        isRevealed: false,
        revealedAt: null
      }));
      
      console.log('📤 Server sending session-created event to client:', session.id);
      
      // Host joins the session room to receive events
      if (session.type === 'quiz') {
        socket.join(`quiz_${session.id}`);
        console.log(`Host joined quiz room: quiz_${session.id}`);
      } else if (session.type === 'poll') {
        socket.join(`poll_${session.id}`);
      }
      
      socket.emit('session-created', {
        sessionId: session.id,
        sessionData: {
          type: session.type,
          currentQuestion: session.currentQuestion,
          totalQuestions: session.questions.length,
          currentQuestionData: session.questions[0] || null,
          teams: [],
          scores: [],
          buzzOrder: [],
          canBuzz: true,
          quizMode: session.quizMode,
          settings: session.quizSettings,
          currentPoll: session.currentPoll,
          pollHistory: session.pollHistory
        }
      });
      
      console.log(`New session created: ${session.id}`);
    });

    socket.on('join-session', (data) => {
      const { sessionId, teamName } = data;
      const session = sessionManager.getSession(sessionId);
      
      if (session) {
        // Associate user with session
        sessionManager.associateUserWithSession(socket.id, sessionId);
        
        // Add to teams and participants
        session.teams.set(socket.id, teamName);
        session.scores.set(teamName, 0);
        session.pollParticipants.set(socket.id, teamName);
        
        // Join room
        socket.join(`${session.type}_${sessionId}`);
        
        // Send session data
        socket.emit('session-joined', {
          sessionId: sessionId,
          sessionData: {
            type: session.type,
            currentQuestion: session.currentQuestion,
            totalQuestions: session.questions.length,
            currentQuestionData: session.questions[session.currentQuestion - 1] || null,
            teams: Array.from(session.teams.entries()),
            scores: Array.from(session.scores.entries()),
            buzzOrder: session.buzzOrder,
            canBuzz: session.buzzOrder.length < 3,
            quizMode: session.quizMode,
            settings: session.quizSettings,
            currentPoll: session.currentPoll,
            pollHistory: session.pollHistory,
            teamName: teamName
          }
        });
        
        // Notify others
        socket.to(`${session.type}_${sessionId}`).emit('participant-joined', {
          socketId: socket.id,
          teamName: teamName
        });
        
        console.log(`${teamName} joined session: ${sessionId}`);
      } else {
        socket.emit('session-not-found', { sessionId });
      }
    });

    // Legacy support removed - clients should join specific sessions
    // Default question sending is no longer needed with session-based architecture

    // Handle custom questions from host (legacy support - DEPRECATED)
    socket.on('set-custom-questions', (data) => {
      console.log('⚠️ Legacy custom questions received - use update-session-questions instead');
      
      // Try to update session if available
      const session = sessionManager.getUserSession(socket.id);
      if (session && session.type === 'quiz') {
        session.questions = data.questions;
        session.currentQuestion = 1;
        session.buzzOrder = [];
        
        // Initialize reveal state for scheduled mode
        session.revealedQuestions = session.questions.map((_, index) => ({
          questionIndex: index,
          isRevealed: false,
          revealedAt: null
        }));
        
        // Send updated question to session room only
        socket.to(`quiz_${session.id}`).emit('question-change', {
          questionNumber: session.currentQuestion,
          questionData: session.questions[session.currentQuestion - 1]
        });
        
        socket.emit('question-change', {
          questionNumber: session.currentQuestion,
          questionData: session.questions[session.currentQuestion - 1]
        });
        
        console.log(`Questions updated for session ${session.id}: ${data.questions.length} questions`);
      } else {
        console.warn('Custom questions received but no session found');
      }
    });

    // NEW SESSION-BASED QUESTION MANAGEMENT
    socket.on('update-session-questions', (data) => {
      const { sessionId, questions: sessionQuestions } = data;
      const session = sessionManager.getSession(sessionId);
      
      if (session) {
        console.log(`Updating questions for session ${sessionId}:`, sessionQuestions.length, 'questions');
        
        // Store questions in session
        session.questions = sessionQuestions;
        session.currentQuestion = 1;
        session.buzzOrder = [];
        
        // Initialize reveal state for scheduled mode
        session.revealedQuestions = sessionQuestions.map((_, index) => ({
          questionIndex: index,
          isRevealed: false,
          revealedAt: null
        }));
        
        // Notify clients in this session
        socket.to(`${session.type}_${sessionId}`).emit('session-questions-updated', {
          questions: sessionQuestions,
          currentQuestion: 1,
          currentQuestionData: sessionQuestions[0] || null
        });
        
        // Confirm to sender
        socket.emit('session-questions-updated', {
          questions: sessionQuestions,
          currentQuestion: 1,
          currentQuestionData: sessionQuestions[0] || null
        });
        
        console.log(`Session ${sessionId} now has ${sessionQuestions.length} questions`);
      } else {
        socket.emit('session-not-found', { sessionId });
      }
    });

    socket.on('get-session-questions', (data) => {
      const { sessionId } = data;
      const session = sessionManager.getSession(sessionId);
      
      if (session) {
        socket.emit('session-questions-retrieved', {
          sessionId,
          questions: session.questions || [],
          currentQuestion: session.currentQuestion || 1
        });
      } else {
        socket.emit('session-not-found', { sessionId });
      }
    });

    // NEW MODE SELECTION EVENTS
    socket.on('set-quiz-mode', (data) => {
      console.log('Quiz mode set:', data.mode, 'with settings:', data.settings, 'liveQuizId:', data.liveQuizId);
      
      // Set mode and settings in session instead of global variables
      const session = sessionManager.getUserSession(socket.id);
      if (session) {
        session.quizMode = data.mode;
        session.quizSettings = { ...session.quizSettings, ...data.settings };
      }
      
      // If this is a live quiz, associate the socket with the session
      if (data.liveQuizId) {
        sessionManager.associateUserWithSession(socket.id, data.liveQuizId);
        console.log('Host associated with live quiz session:', data.liveQuizId);
      }
      
      // Mode-specific setup is now handled per session
      // Global variable cleanup removed - all data is session-based
      
      // Send mode to all clients in session instead of global broadcast
      if (session) {
        io.to(`quiz_${session.id}`).emit('quiz-mode-set', { 
          mode: data.mode, 
          settings: session.quizSettings 
        });
      }
    });

    // BASIC MODE EVENTS
    socket.on('submit-basic-quiz', (data) => {
      console.log('Basic quiz submitted by:', data.participantName);
      
      // Use session-based state
      const session = sessionManager.getUserSession(socket.id);
      if (session && session.type === 'quiz') {
        // Calculate score using session questions
        let score = 0;
        data.answers.forEach(answer => {
          if (answer.selectedOption === session.questions[answer.questionIndex]?.correct) {
            score++;
          }
        });
        
        const submission = {
          participantName: data.participantName,
          socketId: socket.id,
          answers: data.answers,
          submissionTime: Date.now(),
          score: score,
          isComplete: true
        };
        
        session.basicSubmissions.set(socket.id, submission);
        
        // Send results back to participant
        socket.emit('basic-quiz-submitted', { submission });
        
        // Notify host and other participants in session
        socket.to(`quiz_${session.id}`).emit('basic-quiz-submitted', submission);
        socket.to(`quiz_${session.id}`).emit('submission-received', { 
          participantName: data.participantName, 
          submissionTime: submission.submissionTime 
        });
        
        // Update submission count for session
        socket.to(`quiz_${session.id}`).emit('submissions-count-update', { 
          count: session.basicSubmissions.size, 
          total: session.teams.size 
        });
        
        console.log(`Basic quiz submitted in session ${session.id}: ${data.participantName} (score: ${score})`);
      } else {
        console.warn('Basic quiz submission but no session found');
        socket.emit('error', { message: 'Session not found' });
      }
    });

    socket.on('get-submissions-count', () => {
      // Use session-based state
      const session = sessionManager.getUserSession(socket.id);
      if (session && session.type === 'quiz') {
        socket.emit('submissions-count-update', { 
          count: session.basicSubmissions.size, 
          total: session.teams.size 
        });
      } else {
        socket.emit('submissions-count-update', { count: 0, total: 0 });
      }
    });

    socket.on('get-results-summary', () => {
      // Use session-based state
      const session = sessionManager.getUserSession(socket.id);
      if (session && session.type === 'quiz') {
        const submissions = Array.from(session.basicSubmissions.values());
        socket.emit('results-summary', { submissions });
      } else {
        socket.emit('results-summary', { submissions: [] });
      }
    });

    socket.on('quiz-settings-update', (data) => {
      // Use session-based state
      const session = sessionManager.getUserSession(socket.id);
      if (session && session.type === 'quiz') {
        session.quizSettings = { ...session.quizSettings, ...data.settings };
        
        // Broadcast to session room only
        socket.to(`quiz_${session.id}`).emit('quiz-settings-updated', { 
          settings: session.quizSettings 
        });
        
        console.log(`Quiz settings updated in session ${session.id}`);
      } else {
        console.warn('Quiz settings update requested but no session found');
      }
    });

    // SCHEDULED MODE EVENTS
    socket.on('submit-answers', (data) => {
      console.log('Scheduled answers submitted by:', data.participantName);
      
      const submission = {
        participantName: data.participantName,
        socketId: socket.id,
        answers: data.answers,
        submissionTime: Date.now(),
        score: 0, // Will be calculated during reveals
        isComplete: true
      };
      
      // Check if this is part of a live quiz session
      const session = sessionManager.getUserSession(socket.id);
      if (session && session.type === 'quiz') {
        // Store in session-based submission system
        session.scheduledSubmissions.set(socket.id, submission);
        console.log(`Submission stored in session ${session.id} for participant ${data.participantName}`);
        
        // Notify clients in the session room
        socket.emit('submission-stored', { participantName: data.participantName });
        socket.to(`quiz_${session.id}`).emit('submission-received', { 
          participantName: data.participantName, 
          submissionTime: submission.submissionTime 
        });
      } else {
        // Fall back to global state for non-session quizzes
        scheduledSubmissions.set(socket.id, submission);
        
        // Notify participant and host
        socket.emit('submission-stored', { participantName: data.participantName });
        io.emit('submission-received', { 
          participantName: data.participantName, 
          submissionTime: submission.submissionTime 
        });
      }
    });

    socket.on('reveal-question', (data) => {
      const questionIndex = data.questionIndex;
      
      // Check if this is part of a live quiz session
      const session = sessionManager.getUserSession(socket.id);
      if (session && session.type === 'quiz') {
        // Use session-based data
        if (questionIndex < 0 || questionIndex >= session.revealedQuestions.length) return;
        
        console.log('Revealing question in session:', questionIndex, 'for session:', session.id);
        
        session.revealedQuestions[questionIndex] = {
          questionIndex,
          isRevealed: true,
          revealedAt: Date.now()
        };
        
        // Calculate updated scores and leaderboard using session data
        const leaderboard = calculateLeaderboard(session);
        
        // Broadcast to session room
        socket.to(`quiz_${session.id}`).emit('question-revealed', { 
          questionIndex, 
          correctAnswer: session.questions[questionIndex].correct 
        });
        
        socket.to(`quiz_${session.id}`).emit('leaderboard-updated', { 
          leaderboard, 
          visible: session.leaderboardVisible 
        });
        
        // Confirm to host
        socket.emit('question-revealed', { 
          questionIndex, 
          correctAnswer: session.questions[questionIndex].correct 
        });
        
        socket.emit('leaderboard-updated', { 
          leaderboard, 
          visible: session.leaderboardVisible 
        });
      } else {
        // Fall back to global state
        if (questionIndex < 0 || questionIndex >= revealedQuestions.length) return;
        
        console.log('Revealing question (global):', questionIndex);
        
        revealedQuestions[questionIndex] = {
          questionIndex,
          isRevealed: true,
          revealedAt: Date.now()
        };
        
        // Calculate updated scores and leaderboard
        const leaderboard = calculateLeaderboard();
        
        // Broadcast the reveal
        io.emit('question-revealed', { 
          questionIndex, 
          correctAnswer: questions[questionIndex].correct 
        });
        
        io.emit('leaderboard-updated', { 
          leaderboard, 
          visible: leaderboardVisible 
        });
      }
    });

    socket.on('reveal-all', () => {
      // Check if this is part of a live quiz session
      const session = sessionManager.getUserSession(socket.id);
      if (session && session.type === 'quiz') {
        // Use session-based data
        console.log('Revealing all questions in session:', session.id);
        
        session.revealedQuestions = session.revealedQuestions.map((r, index) => ({
          questionIndex: index,
          isRevealed: true,
          revealedAt: Date.now()
        }));
        
        const leaderboard = calculateLeaderboard(session);
        
        // Broadcast to session room
        socket.to(`quiz_${session.id}`).emit('all-questions-revealed', { leaderboard });
        socket.to(`quiz_${session.id}`).emit('leaderboard-updated', { 
          leaderboard, 
          visible: session.leaderboardVisible 
        });
        
        // Confirm to host
        socket.emit('all-questions-revealed', { leaderboard });
        socket.emit('leaderboard-updated', { 
          leaderboard, 
          visible: session.leaderboardVisible 
        });
      } else {
        // Fall back to global state
        console.log('Revealing all questions (global)');
        
        revealedQuestions = revealedQuestions.map((r, index) => ({
          questionIndex: index,
          isRevealed: true,
          revealedAt: Date.now()
        }));
        
        const leaderboard = calculateLeaderboard();
        
        io.emit('all-questions-revealed', { leaderboard });
        io.emit('leaderboard-updated', { 
          leaderboard, 
          visible: leaderboardVisible 
        });
      }
    });

    socket.on('toggle-leaderboard-visibility', (data) => {
      // Check if this is part of a live quiz session
      const session = sessionManager.getUserSession(socket.id);
      if (session && session.type === 'quiz') {
        // Use session-based data
        session.leaderboardVisible = data.visible;
        console.log('Leaderboard visibility for session:', session.leaderboardVisible);
        
        const leaderboard = calculateLeaderboard(session);
        
        // Broadcast to session room
        socket.to(`quiz_${session.id}`).emit('leaderboard-visibility-changed', { 
          visible: session.leaderboardVisible 
        });
        socket.to(`quiz_${session.id}`).emit('leaderboard-updated', { 
          leaderboard, 
          visible: session.leaderboardVisible 
        });
        
        // Confirm to host
        socket.emit('leaderboard-visibility-changed', { visible: session.leaderboardVisible });
        socket.emit('leaderboard-updated', { 
          leaderboard, 
          visible: session.leaderboardVisible 
        });
      } else {
        // Fall back to global state
        leaderboardVisible = data.visible;
        console.log('Leaderboard visibility (global):', leaderboardVisible);
        
        const leaderboard = calculateLeaderboard();
        
        io.emit('leaderboard-visibility-changed', { visible: leaderboardVisible });
        io.emit('leaderboard-updated', { 
          leaderboard, 
          visible: leaderboardVisible 
        });
      }
    });

    socket.on('get-leaderboard-status', () => {
      // Check if this is part of a live quiz session
      const session = sessionManager.getUserSession(socket.id);
      if (session && session.type === 'quiz') {
        // Use session-based data
        const leaderboard = calculateLeaderboard(session);
        socket.emit('leaderboard-updated', { 
          leaderboard, 
          visible: session.leaderboardVisible 
        });
      } else {
        // Fall back to global state
        const leaderboard = calculateLeaderboard();
        socket.emit('leaderboard-updated', { 
          leaderboard, 
          visible: leaderboardVisible 
        });
      }
    });

    socket.on('send-announcement', (data) => {
      const announcement = {
        message: data.message,
        timestamp: Date.now()
      };
      
      announcements.push(announcement);
      
      // Keep only last 10 announcements  
      if (announcements.length > 10) {
        announcements.shift();
      }
      
      io.emit('announcement', announcement);
    });

    socket.on('get-all-submissions', () => {
      // Check if this is part of a live quiz session
      const session = sessionManager.getUserSession(socket.id);
      if (session && session.type === 'quiz') {
        // Use session-based submissions
        const submissions = Array.from(session.scheduledSubmissions.values());
        console.log('Returning session submissions count:', submissions.length);
        socket.emit('all-submissions', { 
          submissions, 
          revealedQuestions: session.revealedQuestions || [] 
        });
      } else {
        // Fall back to global state
        const submissions = Array.from(scheduledSubmissions.values());
        console.log('Returning global submissions count:', submissions.length);
        socket.emit('all-submissions', { submissions, revealedQuestions });
      }
    });

    // NEW: Session-specific participant joining (preferred method)
    socket.on('join-quiz-session', (data) => {
      const { sessionId, teamName } = data;
      console.log(`Participant ${teamName} requesting to join session: ${sessionId}`);
      
      const session = sessionManager.getSession(sessionId);
      if (session && session.type === 'quiz') {
        // Associate user with specific session
        sessionManager.associateUserWithSession(socket.id, sessionId);
        session.teams.set(socket.id, teamName);
        session.scores.set(teamName, 0);
        
        // Join the session room
        socket.join(`quiz_${sessionId}`);
        
        console.log(`✅ Participant ${teamName} joined quiz session: ${sessionId} (mode: ${session.quizMode})`);
        
        // Send session-specific quiz mode and questions
        socket.emit('quiz-mode-set', {
          mode: session.quizMode,
          settings: session.quizSettings,
          questions: session.questions
        });
        
        // Send current question for buzzer mode
        if (session.quizMode === 'buzzer') {
          socket.emit('question-change', {
            questionNumber: session.currentQuestion,
            questionData: session.questions[session.currentQuestion - 1] || null
          });
        }
        
        // Notify other clients in the session
        socket.to(`quiz_${sessionId}`).emit('register-team', { 
          socketId: socket.id, 
          teamName: teamName 
        });
        
        // Confirm successful join
        socket.emit('session-joined-successfully', { sessionId, teamName });
      } else {
        console.warn(`Session not found or not a quiz: ${sessionId}`);
        socket.emit('session-join-failed', { 
          sessionId, 
          error: 'Session not found or not available' 
        });
      }
    });

    // LEGACY: Generic team registration (fallback for compatibility)
    socket.on('register-team', (data) => {
      console.log('Team registered (legacy mode):', data.teamName);
      
      // Check if there's an active quiz session to join
      const quizSessions = sessionManager.getAllSessions().filter(s => s.type === 'quiz');
      if (quizSessions.length > 0) {
        // Join the most recent quiz session
        const latestSession = quizSessions.sort((a, b) => b.lastActivity - a.lastActivity)[0];
        sessionManager.associateUserWithSession(socket.id, latestSession.id);
        latestSession.teams.set(socket.id, data.teamName);
        latestSession.scores.set(data.teamName, 0);
        
        // Join the session room
        socket.join(`quiz_${latestSession.id}`);
        
        console.log(`Participant ${data.teamName} joined quiz session: ${latestSession.id} (mode: ${latestSession.quizMode})`);
        
        // Send session-specific quiz mode and questions
        console.log(`📤 Sending session mode to participant: ${latestSession.quizMode}`);
        socket.emit('quiz-mode-set', {
          mode: latestSession.quizMode,
          settings: latestSession.quizSettings,
          questions: latestSession.questions
        });
        
        // Send current question for buzzer mode
        if (latestSession.quizMode === 'buzzer') {
          socket.emit('question-change', {
            questionNumber: latestSession.currentQuestion,
            questionData: latestSession.questions[latestSession.currentQuestion - 1] || null
          });
        }
        
        // Notify other clients in the session
        socket.to(`quiz_${latestSession.id}`).emit('register-team', { 
          socketId: socket.id, 
          teamName: data.teamName 
        });
      } else {
        // No active sessions - this shouldn't happen with new architecture
        console.warn('No active quiz sessions found for participant registration');
        socket.emit('error', { message: 'No active quiz sessions available' });
      }
    });

    socket.on('question-change', (data) => {
      // Use session-based state instead of global
      const session = sessionManager.getUserSession(socket.id);
      if (session && session.type === 'quiz') {
        session.currentQuestion = data.questionNumber;
        session.buzzOrder = []; // Reset buzz order for new question
        
        // Broadcast to session room only
        socket.to(`quiz_${session.id}`).emit('question-change', {
          questionNumber: session.currentQuestion,
          questionData: session.questions[session.currentQuestion - 1]
        });
        
        // Confirm to host
        socket.emit('question-change', {
          questionNumber: session.currentQuestion,
          questionData: session.questions[session.currentQuestion - 1]
        });
        
        console.log(`Question changed to ${session.currentQuestion} in session ${session.id}`);
      } else {
        console.warn('Question change requested but no session found');
      }
    });

    socket.on('buzz', (data) => {
      const teamName = data.teamName;
      // Use session-based state instead of global
      const session = sessionManager.getUserSession(socket.id);
      if (session && session.type === 'quiz') {
        if (!session.buzzOrder.includes(teamName)) {
          session.buzzOrder.push(teamName);
          const rank = session.buzzOrder.length;
          
          const buzzData = {
            teamName: teamName,
            timestamp: data.timestamp,
            rank: rank,
            socketId: socket.id,
            totalResponses: session.buzzOrder.length
          };
          
          // Broadcast to session room only
          socket.to(`quiz_${session.id}`).emit('buzz', buzzData);
          socket.emit('buzz', buzzData); // Confirm to buzzer
          
          console.log(`Buzz from ${teamName} in session ${session.id} (rank: ${rank})`);
        }
      } else {
        console.warn('Buzz received but no session found');
      }
    });

    socket.on('reset-buzzer', () => {
      // Use session-based state instead of global
      const session = sessionManager.getUserSession(socket.id);
      if (session && session.type === 'quiz') {
        session.buzzOrder = [];
        
        // Broadcast to session room only
        socket.to(`quiz_${session.id}`).emit('reset-buzzer');
        socket.emit('reset-buzzer'); // Confirm to host
        
        console.log(`Buzzer reset in session ${session.id}`);
      } else {
        console.warn('Buzzer reset requested but no session found');
      }
    });

    socket.on('trigger-celebration', (data) => {
      // Use session-based broadcasting instead of global
      const session = sessionManager.getUserSession(socket.id);
      if (session && session.type === 'quiz') {
        // Broadcast to session room only
        socket.to(`quiz_${session.id}`).emit('celebrate', { teamName: data.teamName });
        socket.emit('celebrate', { teamName: data.teamName }); // Confirm to host
        
        console.log(`Celebration triggered for ${data.teamName} in session ${session.id}`);
      } else {
        console.warn('Celebration requested but no session found');
      }
    });

    socket.on('answer-revealed', (data) => {
      // Use session-based broadcasting instead of global
      const session = sessionManager.getUserSession(socket.id);
      if (session && session.type === 'quiz') {
        // Broadcast to session room only
        socket.to(`quiz_${session.id}`).emit('answer-revealed', data);
        
        console.log(`Answer revealed in session ${session.id}`);
      } else {
        console.warn('Answer reveal requested but no session found');
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      // Session-based cleanup
      const session = sessionManager.getUserSession(socket.id);
      if (session) {
        const teamName = session.teams.get(socket.id);
        
        // Don't remove from session immediately - keep for recovery
        // Just notify others about disconnect
        if (teamName) {
          socket.to(`${session.type}_${session.id}`).emit('participant-disconnected', {
            socketId: socket.id,
            teamName: teamName
          });
        }
        
        console.log(`User disconnected from session ${session.id}, but session data preserved for recovery`);
      }
      
      // Legacy cleanup removed - all cleanup now handled by session manager
    });

    // Handle request for current question number
    socket.on('request-question-number', () => {
      const session = sessionManager.getUserSession(socket.id);
      if (session && session.questions.length > 0) {
        socket.emit('question-change', {
          questionNumber: session.currentQuestion,
          questionData: session.questions[session.currentQuestion - 1]
        });
      }
    });

    // Handle host exit quiz
    socket.on('host-exit-quiz', () => {
      console.log('Host is exiting quiz, notifying all participants');
      
      // Legacy reset removed - quiz state now managed per session
      
      // Notify all participants that the quiz has ended
      io.emit('quiz-ended', {
        message: 'The quiz has been ended by the host.'
      });
    });

    // POLLING EVENTS

    // Register participant for polling
    socket.on('register-participant', (data) => {
      console.log('Participant registered for polling:', data.teamName);
      pollParticipants.set(socket.id, data.teamName);
      
      // Send current poll if exists
      if (currentPoll) {
        socket.emit('poll-created', currentPoll);
      }
    });

    // Create new poll
    socket.on('create-poll', (data) => {
      console.log('Creating new poll:', data.question);
      
      currentPoll = {
        id: Date.now().toString(),
        question: data.question,
        options: data.options,
        votes: new Map(),
        isActive: true,
        showResults: false,
        createdAt: Date.now()
      };

      // Broadcast new poll to all clients
      io.emit('poll-created', currentPoll);
    });

    // Cast vote
    socket.on('cast-vote', (data) => {
      if (!currentPoll || !currentPoll.isActive) {
        socket.emit('error', { message: 'No active poll' });
        return;
      }

      const teamName = pollParticipants.get(socket.id);
      if (!teamName) {
        socket.emit('error', { message: 'Not registered as participant' });
        return;
      }

      // Check if already voted
      if (currentPoll.votes.has(teamName)) {
        socket.emit('error', { message: 'Already voted' });
        return;
      }

      // Record vote
      currentPoll.votes.set(teamName, data.optionIndex);
      
      // Create vote data
      const voteData = {
        pollId: currentPoll.id,
        teamName: teamName,
        optionIndex: data.optionIndex,
        timestamp: Date.now()
      };

      // Confirm vote to voter
      socket.emit('vote-cast', voteData);

      // Send updated poll data to all clients
      const pollUpdate = {
        poll: currentPoll,
        results: calculatePollResults(currentPoll)
      };
      
      io.emit('poll-updated', pollUpdate);
    });

    // Close poll
    socket.on('close-poll', (pollId) => {
      if (currentPoll && currentPoll.id === pollId) {
        currentPoll.isActive = false;
        currentPoll.closedAt = Date.now();
        
        // Add to history
        pollHistory.unshift({ ...currentPoll });
        
        // Send final results
        const results = calculatePollResults(currentPoll);
        io.emit('poll-closed', results);
      }
    });

    // Toggle results visibility
    socket.on('toggle-results', (pollId) => {
      if (currentPoll && currentPoll.id === pollId) {
        currentPoll.showResults = !currentPoll.showResults;
        
        const pollUpdate = {
          poll: currentPoll,
          results: calculatePollResults(currentPoll)
        };
        
        io.emit('poll-updated', pollUpdate);
      }
    });

    // Request current poll
    socket.on('request-current-poll', () => {
      if (currentPoll) {
        socket.emit('poll-created', currentPoll);
        
        const pollUpdate = {
          poll: currentPoll,
          results: calculatePollResults(currentPoll)
        };
        
        socket.emit('poll-updated', pollUpdate);
      }
    });

    // Disconnect handling is managed by the session-based handler above
  });

  // Helper function to calculate poll results
  function calculatePollResults(poll) {
    const voteCounts = new Array(poll.options.length).fill(0);
    const voterNames = {};
    
    // Initialize voter names arrays
    for (let i = 0; i < poll.options.length; i++) {
      voterNames[i] = [];
    }
    
    // Count votes and collect voter names
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

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});