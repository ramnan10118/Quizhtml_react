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

// Quiz questions
const questions = [
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

    socket.on('register-team', (data) => {
      console.log('Team registered:', data.teamName);
      teams.set(socket.id, data.teamName);
      scores.set(data.teamName, 0);
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
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});