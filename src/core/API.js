import fetch from "node-fetch";

const baseApi = "https://discord.com/api/v10";

export class API {
  constructor(token) {
    this.token = token;
  }

  getHeaders() {
    return {
      Authorization: `Bot ${this.token}`,
      "Content-Type": "application/json",
    };
  }

  async registerGlobalCommand(appId, name, description, options = []) {
    const body = { name, description, options };
    const res = await fetch(`${baseApi}/applications/${appId}/commands`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    return res.json();
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

  // Initial reply to a slash command (Type 4)
  async reply(interactionId, interactionToken, response) {
    const body = {
      type: 4,
      data: this._createResponseData(response),
    };
    const res = await fetch(`${baseApi}/interactions/${interactionId}/${interactionToken}/callback`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to reply: ${res.status} ${text}`);
    }
  }

  // Defer the initial reply to a slash command (Type 5)
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

  // Defer the update from a component (Type 6)
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

  // Update the message from a component in one step (Type 7)
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

  // Edit the original reply (works after any acknowledgment)
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

  /**
* Creates a DM channel with a user and sends a message.
* @param {string} userId - The ID of the user to DM.
* @param {string} content - The message content to send.
* @returns {Promise<object>} The sent message object.
*/
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

    const messageRes = await fetch(`${baseApi}/channels/${channel.id}/messages`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ content }),
    });

    if (!messageRes.ok) {
      const text = await messageRes.text();
      throw new Error(`Failed to send DM message: ${messageRes.status} ${text}`);
    }

    return messageRes.json();
  }

  /**
   * Kicks a member from a guild.
   * @param {string} guildId - The ID of the guild.
   * @param {string} userId - The ID of the user to kick.
   * @param {string} [reason] - The reason for the kick, for the audit log.
   * @returns {Promise<boolean>}
   */
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

  /**
   * Bans a member from a guild.
   * @param {string} guildId - The ID of the guild.
   * @param {string} userId - The ID of the user to ban.
   * @param {number} [deleteMessageSeconds=0] - How many seconds of messages to delete.
   * @param {string} [reason] - The reason for the ban, for the audit log.
   * @returns {Promise<boolean>}
   */
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

  /**
   * Times out a member in a guild (also known as moderate member).
   * @param {string} guildId - The ID of the guild.
   * @param {string} userId - The ID of the user to time out.
   * @param {number} durationSeconds - The duration of the timeout in seconds. Set to 0 to remove timeout.
   * @param {string} [reason] - The reason for the timeout, for the audit log.
   * @returns {Promise<object>} The updated member object.
   */
  async timeoutMember(guildId, userId, durationSeconds, reason) {
    const url = `${baseApi}/guilds/${guildId}/members/${userId}`;
    const headers = this.getHeaders();
    if (reason) {
      headers['X-Audit-Log-Reason'] = encodeURIComponent(reason);
    }

    // A duration of 0 or less will remove the timeout
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
}