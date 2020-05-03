const express = require("express");
const socketIO = require("socket.io");
const serveStatic = require("serve-static");

const appPort = process.env.PORT || 3000;

const server = express()
    .use(serveStatic(__dirname + "/public/dist"))
    .listen(appPort, () => {
        console.log(`App running at port ${appPort}`);
    });

const io = socketIO(server);

io.on("connection", socket => {
    socket.on("loadPlayers", loadPlayers);
    socket.on("movePlayer", movePlayer);
    socket.on("sendMessage", sendMessage);
    socket.on("loadChatHistory", loadChatHistory);
    socket.on('disconnect', () => console.log("Client disconnected"));
});

const loadPlayers = () => {
    const players = [
        {
            id: "1",
            token: "XPTO",
            name: "Luiz",
            color: "blue",
            coordinates: {
                x: 0,
                y: 0
            }
        },
        {
            id: "2",
            token: "ABCD",
            name: "Lorena",
            color: "pink",
            coordinates: {
                x: 0,
                y: 0
            }
        }
    ];

    io.emit("playersLoaded", players);
};

const movePlayer = (payload) => {
    const option = payload.option;
    const player = payload.player;
    const direction = payload.direction;
    const coordinates = payload.coordinates;

    if (!player || !("coordinates" in player)) {
        return;
    }

    switch (option) {
        case "coordinates":
            movePlayerByCoordinates(player, coordinates);
            break;
        case "direction":
            movePlayerByKeyboard(player, direction);
            break;

    }

    io.emit("playerMoved", player);
};

const movePlayerByKeyboard = (player, direction) => {
    if (!direction) {
        return;
    }

    switch (direction) {
        case "left":
            player.coordinates.x -= 5;
            break;
        case "right":
            player.coordinates.x += 5;
            break;
        case "up":
            player.coordinates.y -= 5;
            break;
        case "down":
            player.coordinates.y += 5;
            break;
    }
}

const movePlayerByCoordinates = (player, coordinates) => {
    if (!coordinates || !("x" in coordinates) || !("y" in coordinates)) {
        return;
    }

    player.coordinates.x = coordinates.x;
    player.coordinates.y = coordinates.y;
}

const chatHistory = [];

const sendMessage = (payload) => {
    io.emit("messageLoaded", payload);
    chatHistory.push(payload);
}

const loadChatHistory = () => {
    io.emit("chatHistoryLoaded", chatHistory);
}

