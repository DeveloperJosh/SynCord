import WebSocket from "ws";
import os from "os";

const GATEWAY_URL = "wss://gateway.discord.gg/?v=10&encoding=json";

export class Gateway {
    constructor(options, token) {
        this.options = options;
        this.token = token;
        this.debug = options.debug ?? false;
        this.ws = null;
        this.heartbeatInterval = null;
        this.sequence = null;
        this.sessionId = null;
        this.listeners = {};
        this.reconnectDelay = 5000;
        this.sendQueue = [];
        this.isProcessingQueue = false;
    }

    log(...args) {
        if (this.debug) {
            console.log("[Gateway]", ...args);
        }
    }

    /**
     * Queues a payload to be sent to the WebSocket, respecting rate limits.
     * @param {object} payload - The payload to send.
     */
    send(payload) {
        this.sendQueue.push(payload);
        if (!this.isProcessingQueue) {
            this.processSendQueue();
        }
    }

    /**
     * Processes one item from the send queue and schedules the next.
     */
    processSendQueue() {
        if (this.sendQueue.length === 0) {
            this.isProcessingQueue = false;
            return;
        }

        this.isProcessingQueue = true;
        const payload = this.sendQueue.shift();

        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(payload));
        }

        // Discord has a strict 1-per-5-seconds limit for IDENTIFY
        const delay = payload.op === 2 ? 5100 : 550;

        setTimeout(() => this.processSendQueue(), delay);
    }

    connect() {
        this.ws = new WebSocket(GATEWAY_URL);

        this.ws.on("open", () => {
            this.log("🌐 WebSocket connected");
        });

        this.ws.on("message", (data) => {
            const payload = JSON.parse(data);
            this.handlePayload(payload);
        });

        this.ws.on("close", (code) => {
            this.log(`❌ WebSocket closed (${code}). Reconnecting...`);
            clearInterval(this.heartbeatInterval);
            setTimeout(() => this.connect(), this.reconnectDelay);
        });

        this.ws.on("error", (err) => {
            console.error("  [Gateway] WebSocket error:", err);
        });
    }

    identify() {
        this.log("📨 Queueing IDENTIFY");
        this.send({
            op: 2,
            d: {
                token: this.token,
                intents: this.options.intents,
                properties: {
                    $os: os.platform(),
                    $browser: "Syncord",
                    $device: "Syncord Bot - Node.js",
                },
            },
        });
    }

    resume() {
        if (!this.sessionId) {
            this.log("No session ID to resume with. Identifying instead.");
            return this.identify();
        }
        this.log("📨 Queueing RESUME");
        this.send({
            op: 6,
            d: {
                token: this.token,
                session_id: this.sessionId,
                seq: this.sequence,
            },
        });
    }

    handlePayload(payload) {
        if (payload.s !== null && payload.s !== undefined) {
            this.sequence = payload.s;
        }

        switch (payload.op) {
            case 10: // HELLO
                this.log("👋 Received HELLO. Starting heartbeat.");
                this.startHeartbeat(payload.d.heartbeat_interval);
                if (this.sessionId) {
                    this.resume();
                } else {
                    this.identify();
                }
                break;

            case 11: // Heartbeat ACK
                //this.log("✅ Heartbeat ACK received.");
                break;

            case 0: // DISPATCH
                if (payload.t === "READY") {
                    this.sessionId = payload.d.session_id;
                    this.log(`✅ READY! Session ID: ${this.sessionId}`);
                }
                if (payload.t) {
                    this.log(`🔔 Dispatch event: ${payload.t}`);
                    this.emit(payload.t, payload.d);
                }
                break;

            case 7: // RECONNECT
                this.log("🔄 Gateway requested reconnect. Closing connection to resume.");
                this.ws.close(4000);
                break;

            case 9: // INVALID SESSION
                this.log(`⚠️ Invalid session. Resumable: ${payload.d}`);
                if (payload.d) {
                    this.ws.close(4000);
                } else {
                    this.sessionId = null;
                    this.sequence = null;
                    setTimeout(() => this.identify(), 1000 + Math.random() * 4000);
                }
                break;
        }
    }

    startHeartbeat(interval) {
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        setTimeout(() => {
            this.send({ op: 1, d: this.sequence });
        }, interval * Math.random());
        this.heartbeatInterval = setInterval(() => {
            this.send({ op: 1, d: this.sequence });
        }, interval);
    }

    sendPresenceUpdate(data) {
        this.log("📨 Queueing presence update");
        this.send({
            op: 3,
            d: data,
        });
    }

    on(event, callback) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    }

    emit(event, data) {
        if (this.listeners[event]) {
            for (const cb of this.listeners[event]) {
                cb(data);
            }
        }
    }
}
