const express = require("express");
const server = new express();
const http = require("http").Server(server);
const socketio = require("socket.io")(http);

server.use(express.static("client/dist"));

socketio.on("connection", socket => {
    socket.on("loadPlayers", loadPlayers);
    socket.on("movePlayer", movePlayer);
    socket.on("sendMessage", sendMessage);
    socket.on("loadChatHistory", loadChatHistory);
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

    socketio.emit("playersLoaded", players);
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

    socketio.emit("playerMoved", player);
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
    socketio.emit("messageLoaded", payload);
    chatHistory.push(payload);
}

const loadChatHistory = () => {
    socketio.emit("chatHistoryLoaded", chatHistory);
}

http.listen(3000, () => {
    console.log("Listening at :3000...");
});