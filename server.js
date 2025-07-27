const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

// Quiz state
let currentQuestion = 1;
let buzzOrder = [];
const teams = new Map();
const scores = new Map();

// New quiz modes state
let quizMode = 'buzzer'; // 'buzzer' | 'basic' | 'scheduled'
let quizSettings = {
  mode: 'buzzer',
  timeLimit: undefined,
  allowRetakes: false,
  showCorrectAnswers: true,
  passingScore: undefined
};

// Basic mode state
const basicSubmissions = new Map(); // socketId -> submission

// Scheduled mode state  
const scheduledSubmissions = new Map(); // socketId -> submission
let revealedQuestions = []; // Array of {questionIndex, isRevealed, revealedAt}
let leaderboardVisible = false;
const announcements = []; // Array of {message, timestamp}

// Polling state
let currentPoll = null;
let pollHistory = [];
let pollParticipants = new Map(); // socketId -> teamName

// Quiz questions - can be overridden by custom questions
let questions = [
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

// Helper functions
function calculateLeaderboard() {
  const leaderboard = [];
  const revealedCount = revealedQuestions.filter(r => r.isRevealed).length;
  
  if (revealedCount === 0) {
    return [];
  }
  
  scheduledSubmissions.forEach((submission, socketId) => {
    let score = 0;
    
    // Calculate score based on revealed questions only
    submission.answers.forEach(answer => {
      const questionRevealed = revealedQuestions[answer.questionIndex]?.isRevealed;
      if (questionRevealed && answer.selectedOption === questions[answer.questionIndex]?.correct) {
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

    // Send current question to newly connected clients
    socket.emit('question-change', {
      questionNumber: currentQuestion,
      questionData: questions[currentQuestion - 1]
    });

    // Handle custom questions from host
    socket.on('set-custom-questions', (data) => {
      console.log('Custom questions received:', data.questions.length, 'questions');
      questions = data.questions;
      currentQuestion = 1;
      buzzOrder = [];
      
      // Initialize reveal state for scheduled mode
      revealedQuestions = questions.map((_, index) => ({
        questionIndex: index,
        isRevealed: false,
        revealedAt: null
      }));
      
      // Send updated question to all clients
      io.emit('question-change', {
        questionNumber: currentQuestion,
        questionData: questions[currentQuestion - 1]
      });
    });

    // NEW MODE SELECTION EVENTS
    socket.on('set-quiz-mode', (data) => {
      console.log('Quiz mode set:', data.mode, 'with settings:', data.settings);
      quizMode = data.mode;
      quizSettings = { ...quizSettings, ...data.settings };
      
      // Reset state for new mode
      if (data.mode === 'basic') {
        basicSubmissions.clear();
      } else if (data.mode === 'scheduled') {
        scheduledSubmissions.clear();
        revealedQuestions = questions.map((_, index) => ({
          questionIndex: index,
          isRevealed: false,
          revealedAt: null
        }));
        leaderboardVisible = false;
        announcements.length = 0;
      }
      
      io.emit('quiz-mode-set', { mode: data.mode, settings: quizSettings });
    });

    // BASIC MODE EVENTS
    socket.on('submit-basic-quiz', (data) => {
      console.log('Basic quiz submitted by:', data.participantName);
      
      // Calculate score
      let score = 0;
      data.answers.forEach(answer => {
        if (answer.selectedOption === questions[answer.questionIndex]?.correct) {
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
      
      basicSubmissions.set(socket.id, submission);
      
      // Send results back to participant
      socket.emit('basic-quiz-submitted', { submission });
      
      // Notify host of new submission
      io.emit('basic-quiz-submitted', submission);
      io.emit('submission-received', { 
        participantName: data.participantName, 
        submissionTime: submission.submissionTime 
      });
      
      // Update submission count
      io.emit('submissions-count-update', { 
        count: basicSubmissions.size, 
        total: teams.size 
      });
    });

    socket.on('get-submissions-count', () => {
      socket.emit('submissions-count-update', { 
        count: basicSubmissions.size, 
        total: teams.size 
      });
    });

    socket.on('get-results-summary', () => {
      const submissions = Array.from(basicSubmissions.values());
      socket.emit('results-summary', { submissions });
    });

    socket.on('quiz-settings-update', (data) => {
      quizSettings = { ...quizSettings, ...data.settings };
      io.emit('quiz-settings-updated', { settings: quizSettings });
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
      
      scheduledSubmissions.set(socket.id, submission);
      
      // Notify participant and host
      socket.emit('submission-stored', { participantName: data.participantName });
      io.emit('submission-received', { 
        participantName: data.participantName, 
        submissionTime: submission.submissionTime 
      });
    });

    socket.on('reveal-question', (data) => {
      const questionIndex = data.questionIndex;
      if (questionIndex < 0 || questionIndex >= revealedQuestions.length) return;
      
      console.log('Revealing question:', questionIndex);
      
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
    });

    socket.on('reveal-all', () => {
      console.log('Revealing all questions');
      
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
    });

    socket.on('toggle-leaderboard-visibility', (data) => {
      leaderboardVisible = data.visible;
      console.log('Leaderboard visibility:', leaderboardVisible);
      
      const leaderboard = calculateLeaderboard();
      
      io.emit('leaderboard-visibility-changed', { visible: leaderboardVisible });
      io.emit('leaderboard-updated', { 
        leaderboard, 
        visible: leaderboardVisible 
      });
    });

    socket.on('get-leaderboard-status', () => {
      const leaderboard = calculateLeaderboard();
      socket.emit('leaderboard-updated', { 
        leaderboard, 
        visible: leaderboardVisible 
      });
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
      const submissions = Array.from(scheduledSubmissions.values());
      socket.emit('all-submissions', { submissions, revealedQuestions });
    });

    socket.on('register-team', (data) => {
      console.log('Team registered:', data.teamName);
      teams.set(socket.id, data.teamName);
      scores.set(data.teamName, 0);
      
      // Send current quiz mode and questions to the new participant
      socket.emit('quiz-mode-set', {
        mode: quizMode,
        settings: quizSettings,
        questions: questions
      });
      
      // Send current question only for buzzer mode
      if (quizMode === 'buzzer') {
        socket.emit('question-change', {
          questionNumber: currentQuestion,
          questionData: questions[currentQuestion - 1] || null
        });
      }
      
      io.emit('register-team', { socketId: socket.id, teamName: data.teamName });
    });

    socket.on('question-change', (data) => {
      currentQuestion = data.questionNumber;
      buzzOrder = []; // Reset buzz order for new question
      
      // Broadcast question change with question data
      io.emit('question-change', {
        questionNumber: currentQuestion,
        questionData: questions[currentQuestion - 1]
      });
    });

    socket.on('buzz', (data) => {
      const teamName = data.teamName;
      if (!buzzOrder.includes(teamName)) {
        buzzOrder.push(teamName);
        const rank = buzzOrder.length;
        io.emit('buzz', {
          teamName: teamName,
          timestamp: data.timestamp,
          rank: rank,
          socketId: socket.id,
          totalResponses: buzzOrder.length
        });
      }
    });

    socket.on('reset-buzzer', () => {
      buzzOrder = [];
      io.emit('reset-buzzer');
    });

    socket.on('trigger-celebration', (data) => {
      io.emit('celebrate', { teamName: data.teamName });
    });

    socket.on('answer-revealed', (data) => {
      // Broadcast answer reveal to all participants
      io.emit('answer-revealed', data);
    });

    socket.on('disconnect', () => {
      const teamName = teams.get(socket.id);
      if (teamName) {
        teams.delete(socket.id);
        scores.delete(teamName);
        io.emit('disconnect-team', socket.id);
      }
      console.log('Client disconnected:', socket.id);
    });

    // Handle request for current question number
    socket.on('request-question-number', () => {
      socket.emit('question-change', {
        questionNumber: currentQuestion,
        questionData: questions[currentQuestion - 1]
      });
    });

    // Handle host exit quiz
    socket.on('host-exit-quiz', () => {
      console.log('Host is exiting quiz, notifying all participants');
      
      // Reset quiz state
      currentQuestion = 1;
      buzzOrder = [];
      teams.clear();
      scores.clear();
      
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

    // Handle disconnect for polling
    socket.on('disconnect', () => {
      const teamName = teams.get(socket.id) || pollParticipants.get(socket.id);
      
      // Quiz cleanup
      if (teams.has(socket.id)) {
        teams.delete(socket.id);
        scores.delete(teamName);
        io.emit('disconnect-team', socket.id);
      }
      
      // Polling cleanup
      if (pollParticipants.has(socket.id)) {
        pollParticipants.delete(socket.id);
      }
      
      console.log('Client disconnected:', socket.id);
    });
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