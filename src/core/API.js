import fetch from "node-fetch";

const baseApi = "https://discord.com/api/v10";

export class API {
    constructor(token, options = {}) {
        this.token = token;
        this.options = options;
    }

    getHeaders() {
        return {
            Authorization: `Bot ${this.token}`,
            "Content-Type": "application/json",
        };
    }

    _createResponseData(response) {
        if (typeof response === 'string') {
            return { content: response };
        }
        return {
            content: response.content,
            embeds: response.embeds,
            components: response.components,
            flags: response.ephemeral ? 64 : 0,
        };
    }

    async getOriginalInteractionResponse(interactionToken) {
        const url = `${baseApi}/webhooks/${this.options.applicationId}/${interactionToken}/messages/@original`;
        const res = await fetch(url, { headers: this.getHeaders() });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Failed to get original interaction response: ${res.status} ${text}`);
        }
        return res.json();
    }

    async reply(interactionId, interactionToken, response) {
        const body = {
            type: 4,
            data: this._createResponseData(response),
        };
        const callbackUrl = `${baseApi}/interactions/${interactionId}/${interactionToken}/callback`;
        const res = await fetch(callbackUrl, {
            method: "POST",
            headers: this.getHeaders(),
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Failed to reply: ${res.status} ${text}`);
        }

        const message = await this.getOriginalInteractionResponse(interactionToken);
        return message;
    }

    async deferReply(interactionId, interactionToken, ephemeral = false) {
        const body = {
            type: 5,
            data: { flags: ephemeral ? 64 : 0 },
        };
        const res = await fetch(`${baseApi}/interactions/${interactionId}/${interactionToken}/callback`, {
            method: "POST",
            headers: this.getHeaders(),
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Failed to defer reply: ${res.status} ${text}`);
        }
    }

    async deferUpdate(interactionId, interactionToken) {
        const body = { type: 6 };
        const res = await fetch(`${baseApi}/interactions/${interactionId}/${interactionToken}/callback`, {
            method: "POST",
            headers: this.getHeaders(),
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Failed to defer update: ${res.status} ${text}`);
        }
    }

    async updateMessage(interactionId, interactionToken, response) {
        const body = {
            type: 7,
            data: this._createResponseData(response),
        };
        const res = await fetch(`${baseApi}/interactions/${interactionId}/${interactionToken}/callback`, {
            method: "POST",
            headers: this.getHeaders(),
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Failed to update message: ${res.status} ${text}`);
        }
    }

    async editReply(applicationId, interactionToken, response) {
        const url = `${baseApi}/webhooks/${applicationId}/${interactionToken}/messages/@original`;
        const body = this._createResponseData(response);
        const res = await fetch(url, {
            method: "PATCH",
            headers: this.getHeaders(),
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Failed to edit reply: ${res.status} ${text}`);
        }
        return res.json();
    }
    
    async getUser(userId) {
        const url = `${baseApi}/users/${userId}`;
        const res = await fetch(url, { headers: this.getHeaders() });
        if (!res.ok) {
            const text = await res.text();
            if (res.status === 404) {
                throw new Error(`User not found: ${userId}`);
            }
            throw new Error(`Failed to get user: ${res.status} ${text}`);
        }
        return res.json();
    }

    async createMessage(channelId, payload) {
        const url = `${baseApi}/channels/${channelId}/messages`;
        const res = await fetch(url, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Failed to create message: ${res.status} ${text}`);
        }

        return res.json();
    }

    async createDmMessage(userId, content) {
        const dmChannelRes = await fetch(`${baseApi}/users/@me/channels`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ recipient_id: userId }),
        });

        if (!dmChannelRes.ok) {
            const text = await dmChannelRes.text();
            throw new Error(`Failed to create DM channel: ${dmChannelRes.status} ${text}`);
        }

        const channel = await dmChannelRes.json();
        return this.createMessage(channel.id, { content });
    }

    async kickMember(guildId, userId, reason) {
        const url = `${baseApi}/guilds/${guildId}/members/${userId}`;
        const headers = this.getHeaders();
        if (reason) {
            headers['X-Audit-Log-Reason'] = encodeURIComponent(reason);
        }

        const res = await fetch(url, { method: 'DELETE', headers });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Failed to kick member: ${res.status} ${text}`);
        }
        return true;
    }

    async banMember(guildId, userId, deleteMessageSeconds = 0, reason) {
        const url = `${baseApi}/guilds/${guildId}/bans/${userId}`;
        const headers = this.getHeaders();
        if (reason) {
            headers['X-Audit-Log-Reason'] = encodeURIComponent(reason);
        }
        const body = JSON.stringify({ delete_message_seconds: deleteMessageSeconds });

        const res = await fetch(url, { method: 'PUT', headers, body });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Failed to ban member: ${res.status} ${text}`);
        }
        return true;
    }

    async timeoutMember(guildId, userId, durationSeconds, reason) {
        const url = `${baseApi}/guilds/${guildId}/members/${userId}`;
        const headers = this.getHeaders();
        if (reason) {
            headers['X-Audit-Log-Reason'] = encodeURIComponent(reason);
        }

        const timeoutEndTimestamp = durationSeconds > 0
            ? new Date(Date.now() + durationSeconds * 1000).toISOString()
            : null;

        const body = JSON.stringify({ communication_disabled_until: timeoutEndTimestamp });

        const res = await fetch(url, { method: 'PATCH', headers, body });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Failed to timeout member: ${res.status} ${text}`);
        }
        return res.json();
    }

    async registerGlobalCommand(appId, name, description, options = []) {
        const url = `${baseApi}/applications/${appId}/commands`;
        const body = { name, description, options };

        const res = await fetch(url, {
            method: "POST",
            headers: this.getHeaders(),
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Failed to register command ${name}: ${res.status} ${text}`);
        }
        return res.json();
    }
}