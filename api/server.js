const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files
app.use(express.static("public"));

let players = {}; // Store player data
let snippet = ""; // Shared typing text

// Random text snippets
const textSnippets = [
    "The quick brown fox jumps over the lazy dog.",
    "Programming isn't about what you know; it's about what you can figure out.",
    "Code is like humor. When you have to explain it, it’s bad.",
];

io.on("connection", (socket) => {
    console.log(`Player connected: ${socket.id}`);
    players[socket.id] = { progress: 0, wpm: 0, completed: false };

    // Send current snippet and player list to the new player
    socket.emit("snippet", snippet || (snippet = textSnippets[Math.floor(Math.random() * textSnippets.length)]));
    io.emit("players", players);

    // Listen for typing updates
    socket.on("typing", ({ typedText, timeElapsed }) => {
        const wordsTyped = typedText.trim().split(" ").length;
        players[socket.id].progress = typedText.length / snippet.length;
        players[socket.id].wpm = Math.round((wordsTyped / timeElapsed) * 60);

        if (typedText === snippet && !players[socket.id].completed) {
            players[socket.id].completed = true;
        }

        io.emit("players", players);
    });

    socket.on("disconnect", () => {
        console.log(`Player disconnected: ${socket.id}`);
        delete players[socket.id];
        io.emit("players", players);
    });
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
