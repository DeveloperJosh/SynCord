import { WebSocket } from "ws";
import fetch from "node-fetch";

let baseapi = "https://discord.com/api"

let ws = new WebSocket("wss://gateway.discord.gg/");

class SynCord {
    constructor(intents=null, token=null, game=null, status="online") {
        this.intents = intents;
        this.token = token;
        this.game = game;
        this.status = status;
    }

    start() {
        let data = this.intents;

        if (data.token == null) {
            throw new Error("token is required");
        }

        if (data.intents == null) {
            throw new Error("intents are required");
        }

        ws.on("open", () => {
            ws.send(JSON.stringify({
                "op": 2,
                "d": {
                  "token": `${data.token}`,
                  "intents": data.intents,
                  "properties": {
                    "os": "linux",
                    "browser": "my_library",
                    "device": "my_library"
                  }
                }
        }));
        if (data.game != null) {
            ws.send(JSON.stringify({
                "op": 3,
                "d": {
                    "since": null,
                    "activities": [{
                        "name": data.game,
                        "type": 0
                    }],
                    "status": `${data.status}`,
                    "afk": false
                }
            }));
        } 
        setInterval(this.heartbeat, 90000);
        });
    }
    heartbeat() {
        ws.send(JSON.stringify({
            op: 1,
            d: null
        }));
    }

    on(event, callback) {
        ws.on("message", (data) => {
            let parsed = JSON.parse(data);
            if (parsed.t == event) {
                callback(parsed.d);
            }
        });
    }

    send_message(channel_id, message, embed=null) {
        let data = this.intents
        let headers = {
            "Authorization": `Bot ${data.token}`,
            "Content-Type": "application/json"
        }

        let body = {
            //content and channel_id are required
            "content": message,
            "channel_id": channel_id,
            "embed": embed
    }
    fetch(`${baseapi}/v10/channels/${channel_id}/messages`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(body)
    })
  }

  send_interaction_response(interaction_id, interaction_token, message, ephemeral=false) {
    let data = this.intents
    let headers = {
        "Authorization": `Bot ${data.token}`,
        "Content-Type": "application/json"
    }

    if (ephemeral == true) {
        let body = {
            "type": 4,
            "data": {
                "content": message,
                "flags": 64
            }
        }
        fetch(`${baseapi}/v10/interactions/${interaction_id}/${interaction_token}/callback`, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(body)
        });
    } else {
        let body = {
            "type": 4,
            "data": {
                "content": message
            }
        }
        fetch(`${baseapi}/v10/interactions/${interaction_id}/${interaction_token}/callback`, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(body)
        });
    }
  }
// INTERACTIONS 
    create_interaction(name, description, user_id, options) {
        let data = this.intents
        let headers = {
            "Authorization": `Bot ${data.token}`,
            "Content-Type": "application/json"
        }
        // {API_ENDPOINT}/applications/{bot_id}/guilds/{guild_id}/commands
        let body = {
            "name": name,
            "description": description
        }
        fetch(`${baseapi}/v10/applications/${user_id}/commands`, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(body)
        }).then((res) => {
            return res.json();
        }).then((json) => {
            console.log(json);
        });
    }

 }

export default SynCord;