<template>
    <div>
        <div style="float:left">
            <canvas
                id="game-canvas"
                width="640"
                height="480"
                style="border: 1px solid black;"
                @mousemove="movePlayerByMouseMove"
            ></canvas>
            <p>
                <input type="text" v-model="player.name" disabled />
            </p>
            <p>
                <input
                    type="text"
                    @focus="toggleWindowKeyDown(false)"
                    @blur="toggleWindowKeyDown(true)"
                    v-model="messageText"
                />
                <button @click="sendMessage()">Send</button>
            </p>
            <p>
                <button @click="movePlayer('right')">Right</button>
                <button @click="movePlayer('left')">Left</button>
                <button @click="movePlayer('up')">Up</button>
                <button @click="movePlayer('down')">Down</button>
            </p>
        </div>
        <div
            style="float:left; margin-left:20px; border: 1px solid black; width:640px; height:480px"
        >
            <div v-for="message in chat" :key="message.id">
                <p>{{ message.player.name }}: {{ message.text }}</p>
            </div>
        </div>
    </div>
</template>

<script>
import io from "socket.io-client";
import { v4 as uuidv4 } from "uuid";

export default {
    paramName: "BlockGame",

    data() {
        return {
            socket: {},
            context: {},
            player: {},
            players: [],
            messageText: "",
            chat: []
        };
    },

    created() {
        this.socket = io(process.env.VUE_APP_SOCKET_URL);
        this.socket.on("playersLoaded", this.playersLoaded);
        this.socket.on("chatHistoryLoaded", this.chatHistoryLoaded);
        this.socket.on("playerMoved", this.playerMoved);
        this.socket.on("messageLoaded", this.messageLoaded);

        window.addEventListener("keydown", this.movePlayerWithKeyboard);

        this.init();
    },

    mounted() {
        this.context = document.querySelector("#game-canvas").getContext("2d");
    },

    methods: {
        init() {
            this.loadPlayers();
            this.loadChatHistory();
        },
        loadPlayers() {
            this.socket.emit("loadPlayers");
        },
        setupCurrentPlayer() {
            const playerToken = this.getUrlParameter("playerToken");

            this.player = this.players.find(
                player => player.token === playerToken
            );

            if (!this.player) {
                throw new Error("No player found for token " + playerToken);
            }
        },
        loadChatHistory() {
            this.socket.emit("loadChatHistory");
        },
        playersLoaded(payload) {
            this.players = payload;
            this.setupCurrentPlayer();
            this.drawPlayers();
        },
        chatHistoryLoaded(payload) {
            this.chat = payload;
        },
        drawPlayers(updatedPlayer) {
            this.context.clearRect(
                0,
                0,
                this.context.canvas.width,
                this.context.canvas.height
            );

            this.players.forEach(player => {
                if (updatedPlayer) {
                    if (player.id === updatedPlayer.id) {
                        player.coordinates = updatedPlayer.coordinates;
                    }
                }

                this.context.fillStyle = player.color;

                this.context.fillRect(
                    player.coordinates.x,
                    player.coordinates.y,
                    20,
                    20
                );
            });
        },
        movePlayer(direction) {
            const payload = {
                option: "direction",
                player: this.player,
                direction: direction
            };

            this.socket.emit("movePlayer", payload);
        },
        movePlayerByMouseMove(e) {
            const payload = {
                option: "coordinates",
                player: this.player,
                coordinates: {
                    x: e.pageX,
                    y: e.pageY
                }
            };

            this.socket.emit("movePlayer", payload);
        },
        playerMoved(payload) {
            this.drawPlayers(payload);
        },
        movePlayerWithKeyboard(e) {
            switch (String.fromCharCode(e.keyCode)) {
                case "A":
                    this.movePlayer("left");
                    break;
                case "D":
                    this.movePlayer("right");
                    break;
                case "W":
                    this.movePlayer("up");
                    break;
                case "S":
                    this.movePlayer("down");
                    break;
            }
        },
        getUrlParameter(paramName) {
            const params = new URLSearchParams(location.search);

            return params.get(paramName);
        },
        sendMessage() {
            const payload = {
                id: uuidv4(),
                player: this.player,
                text: this.messageText
            };

            this.socket.emit("sendMessage", payload);

            this.messageText = "";
        },
        messageLoaded(message) {
            this.chat.push(message);
        },
        toggleWindowKeyDown(status) {
            status === true
                ? window.addEventListener(
                      "keydown",
                      this.movePlayerWithKeyboard
                  )
                : window.removeEventListener(
                      "keydown",
                      this.movePlayerWithKeyboard
                  );
        }
    }
};
</script>