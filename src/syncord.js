import { Gateway } from './ws/gateway.js';

export default class SynCord {
    constructor(options) {
        this.options = options;
        this.gateway = new Gateway({ intents: this.options.intents, game: this.options.game, status: this.options.status });
    }

    start(token) {
        this.gateway.start(token);
    }

    event(event, callback) {
        this.gateway.on(event, callback);
    }
    send(channel_id, content, embed=null) {
        this.gateway.send(channel_id, content, embed);
    }
    send_embed(channel_id, embed) {
        this.gateway.send_embed(channel_id, embed);
    }
    register(name, description, options=null, guild_id=null) {
        this.gateway.register(name, description, options, guild_id);
    }
    register_guild(bot_id, guild_id, name, description, options=null) {
        this.gateway.register_guild(bot_id, guild_id, name, description, options);
    }

    interaction_response(id, token, content, ephemeral) {
        this.gateway.interaction_response(id, token, content, ephemeral);
    }

    interaction_response_embed(id, token, embed, ephemeral) {
        this.gateway.interaction_response_embed(id, token, embed, ephemeral);
    }
}