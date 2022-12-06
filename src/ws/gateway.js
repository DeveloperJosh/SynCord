import WebSocket from "ws";
import fetch from "node-fetch";
import os from "os";

let baseapi = "https://discord.com/api"

let ws = new WebSocket("wss://gateway.discord.gg/");

// gateway for handling websocket connections to discord
export class Gateway {
    // token will be in start function
    constructor(options) {
        this.options = options;
    }
    start(token) {
        if (token == null) {
            throw new Error("token is required");
        }
        if (this.options.intents == null) {
            throw new Error("intents are required");
        }
        this.token = token;
        ws.on("open", () => {
            ws.send(JSON.stringify({
                "op": 2,
                "d": {
                  "token": `${token}`,
                  "intents": this.options.intents,
                  "properties": {
                    "$os": `${os.platform()}`,
                    "$browser": "my_library",
                    "$device": "my_library"
                  }
                }
            }));

            // ready event
            ws.on("open", data => {
                let parsedData = JSON.parse(data);
                if (parsedData.t == "READY") {
                    this.user = parsedData.d.user;
                    this.user.id = parsedData.d.user.id;
                    this.session_id = parsedData.d.session_id;
                }
            });

            if(this.options.game != null) {
                ws.send(JSON.stringify({
                    "op": 3,
                    "d": {
                        "since": null,
                        "activities": [{
                            "name": this.options.game,
                            "type": 0
                        }],
                        "status": `${this.options.status}`,
                        "afk": false
                    }
                }));
            } else {
                ws.send(JSON.stringify({
                    "op": 3,
                    "d": {
                        "since": null,
                        "activities": [{
                            "name": "SynCord",
                            "type": 0
                        }],
                        "status": "online",
                        "afk": false
                    }
                }));
            }

            let heartbeat = setInterval(() => {
                ws.send(JSON.stringify({
                    op: 1,
                    d: null
                }));
            }, 41250);

            // heartbeat ack
            ws.on("message", data => {
                let parsedData = JSON.parse(data);
                if (parsedData.op == 11) {
                    clearInterval(heartbeat);
                    heartbeat = setInterval(() => {
                        ws.send(JSON.stringify({
                            op: 1,
                            d: null
                        }));
                    }, 41250);
                }
            });

            // set up the reconnect function for when the websocket closes
            ws.on("reconnect", () => {
                console.log("reconnecting...");
                this.start(this.token).then(() => {
                    console.log("reconnected");
                });
            });
        });
    }
    on(event, callback) {
        ws.on("message", data => {
            let parsedData = JSON.parse(data);
            if (parsedData.t == event) {
                callback(parsedData.d);
            }
        });
    }
    send(channel_id, message, embeds=null) {
        let headers = {
            "Authorization": `Bot ${this.token}`,
            "Content-Type": "application/json"
        }

        let body = {
            //content and channel_id are required
            "content": message,
            "channel_id": channel_id,
            "embeds": embeds
    }
    fetch(`${baseapi}/v10/channels/${channel_id}/messages`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(body)
     })
    }
    send_embed(channel_id, embeds) {
        let headers = {
            "Authorization": `Bot ${this.token}`,
            "Content-Type": "application/json"
        }
        let body = {
            "embeds": embeds,
            "channel_id": channel_id
        }
        fetch(`${baseapi}/v10/channels/${channel_id}/messages`, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(body)
        })
    }

    // slash commands require a different endpoint
    register(bot_id, name, description, options=null) {
        let headers = {
            "Authorization": `Bot ${this.token}`,
            "Content-Type": "application/json"
        }
        // {API_ENDPOINT}/applications/{bot_id}/guilds/{guild_id}/commands
        let body = {
            "name": name,
            "description": description
        }
            fetch(`${baseapi}/v10/applications/${bot_id}/commands`, {
                method: "POST",
                headers: headers,
                body: JSON.stringify(body)
            }).then((res) => {
                return res.json();
            }).then((json) => {
                console.log(json);
            });
    }

    register_guild(bot_id, guild_id, name, description, options=null) {
        let headers = {
            "Authorization": `Bot ${this.token}`,
            "Content-Type": "application/json"
        }
        // {API_ENDPOINT}/applications/{bot_id}/guilds/{guild_id}/commands
        let body = {
            "name": name,
            "description": description,
            "options": options
        }
        fetch(`${baseapi}/v10/applications/${bot_id}/guilds/${guild_id}/commands`, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(body)
        }).then((res) => {
            return res.json();
        }).then((json) => {
            console.log(json);
        });
    }

    interaction_response(interaction_id, interaction_token, message, ephemeral=false) {
        let headers = {
            "Authorization": `Bot ${this.token}`,
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

    interaction_response_embed(interaction_id, interaction_token, embeds, ephemeral=false) {
        let headers = {
            "Authorization": `Bot ${this.token}`,
            "Content-Type": "application/json"
        }

        if (ephemeral == true) {
            let body = {
                "type": 4,
                "data": {
                    "embeds": embeds,
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
                    "embeds": embeds
                }
            }
            fetch(`${baseapi}/v10/interactions/${interaction_id}/${interaction_token}/callback`, {
                method: "POST",
                headers: headers,
                body: JSON.stringify(body)
            });
        }
    }
    create_channel(guild_id, name, type=0, topic=null, bitrate=null, user_limit=null, rate_limit_per_user=null, position=null, permission_overwrites=null, parent_id=null, nsfw=null) {
        let headers = {
            "Authorization": `Bot ${this.token}`,
            "Content-Type": "application/json"
        }
        let body = {
            "name": name,
            "type": type,
            "topic": topic,
            "bitrate": bitrate,
            "user_limit": user_limit,
            "rate_limit_per_user": rate_limit_per_user,
            "position": position,
            "permission_overwrites": permission_overwrites,
            "parent_id": parent_id,
            "nsfw": nsfw
        }
        fetch(`${baseapi}/v10/guilds/${guild_id}/channels`, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(body)
        });
    }

    delete_channel(guild_id, channel_id) {
        let headers = {
            "Authorization": `Bot ${this.token}`,
            "Content-Type": "application/json"
        }
        fetch(`${baseapi}/v10/guilds/${guild_id}/channels/${channel_id}`, {
            method: "DELETE",
            headers: headers
        });
    }

    edit_channel(guild_id, channel_id, name, type=0, topic=null, bitrate=null, user_limit=null, rate_limit_per_user=null, position=null, permission_overwrites=null, parent_id=null, nsfw=null) {
        let headers = {
            "Authorization": `Bot ${this.token}`,
            "Content-Type": "application/json"
        }
        let body = {
            "name": name,
            "type": type,
            "topic": topic,
            "bitrate": bitrate,
            "user_limit": user_limit,
            "rate_limit_per_user": rate_limit_per_user,
            "position": position,
            "permission_overwrites": permission_overwrites,
            "parent_id": parent_id,
            "nsfw": nsfw
        }
        fetch(`${baseapi}/v10/guilds/${guild_id}/channels/${channel_id}`, {
            method: "PATCH",
            headers: headers,
            body: JSON.stringify(body)
        });
    }
    get_channel(guild_id, channel_id) {
        let headers = {
            "Authorization": `Bot ${this.token}`,
            "Content-Type": "application/json"
        }
        fetch(`${baseapi}/v10/guilds/${guild_id}/channels/${channel_id}`, {
            method: "GET",
            headers: headers
        });
    }
}