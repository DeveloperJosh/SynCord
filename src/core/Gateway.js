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
    }

    log(...args) {
        if (this.debug) {
            console.log("  [Gateway]", ...args);
        }
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
        const payload = {
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
        };
        this.ws.send(JSON.stringify(payload));
        this.log("📨 Sent IDENTIFY");
    }

    resume() {
        if (!this.sessionId) {
            return this.identify();
        }

        const payload = {
            op: 6,
            d: {
                token: this.token,
                session_id: this.sessionId,
                seq: this.sequence,
            },
        };
        this.ws.send(JSON.stringify(payload));
        this.log("📨 Sent RESUME");
    }

    handlePayload(payload) {
        if (payload.s !== null) this.sequence = payload.s;

        switch (payload.op) {
            case 10: // HELLO
                this.log("👋 Received HELLO. Starting heartbeat.");
                this.startHeartbeat(payload.d.heartbeat_interval);
                this.identify();
                break;
            case 11: // Heartbeat ACK
                this.log("✅ Heartbeat ACK received.");
                break;
            case 0: // DISPATCH
                if (payload.t === "READY") {
                    this.sessionId = payload.d.session_id;
                }
                if (payload.t) {
                    this.log(`🔔 Dispatch event: ${payload.t}`);
                    this.emit(payload.t, payload.d);
                }
                break;
            case 7: // RECONNECT
                this.log("🔄 Gateway requested reconnect.");
                this.ws.close(4000);
                break;
            case 9: // INVALID SESSION
                this.log("⚠️ Invalid session. Re-identifying.");
                setTimeout(() => this.identify(), 1000);
                break;
        }
    }
    /**
     * Starts the heartbeat interval.
     * @param {number} interval - The heartbeat interval in milliseconds.
     */
    startHeartbeat(interval) {
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);

        this.heartbeatInterval = setInterval(() => {
            this.ws.send(
                JSON.stringify({
                    op: 1,
                    d: this.sequence,
                })
            );
        }, interval);
    }

    sendPresenceUpdate(data) {
        this.ws.send(
            JSON.stringify({
                op: 3,
                d: data,
            })
        );
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