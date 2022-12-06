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
    create_channel(guild_id, name, type, topic=null, bitrate=null, user_limit=null, rate_limit_per_user=null, position=null, permission_overwrites=null, parent_id=null, nsfw=null) {
        this.gateway.create_channel(guild_id, name, type, topic, bitrate, user_limit, rate_limit_per_user, position, permission_overwrites, parent_id, nsfw);
    }
    delete_channel(guild_id, channel_id) {
        this.gateway.delete_channel(guild_id, channel_id);
    }
    edit_channel(guild_id, channel_id, name, type, topic, position, nsfw, rate_limit_per_user, bitrate, user_limit, permission_overwrites, parent_id) {
        this.gateway.edit_channel(guild_id, channel_id, name, type, topic, position, nsfw, rate_limit_per_user, bitrate, user_limit, permission_overwrites, parent_id);
    }
    get_channel(guild_id, channel_id) {
        this.gateway.get_channel(guild_id, channel_id);
    }
    on(event, callback) {
        this.gateway.on(event, callback);
    }
}