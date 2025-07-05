export class SlashCommandOptionBuilder {
    constructor(type) {
        this.option = {
            type,
            name: null,
            description: null,
            required: false,
        };
    }

    setName(name) {
        this.option.name = name;
        return this;
    }

    setDescription(description) {
        this.option.description = description;
        return this;
    }

    setRequired(required = true) {
        this.option.required = required;
        return this;
    }

    toJSON() {
        return this.option;
    }
}

export class SlashCommandBuilder {
    constructor() {
        this.command = {
            name: null,
            description: null,
            options: [],
            // This field will hold the required permissions
            default_member_permissions: null,
        };
    }

    setName(name) {
        this.command.name = name;
        return this;
    }

    setDescription(description) {
        this.command.description = description;
        return this;
    }

    /**
     * Sets the default permissions required for a user to run the command.
     * @param {string} permissions - A string representing the bitfield of the permissions.
     */
    setDefaultMemberPermissions(permissions) {
        this.command.default_member_permissions = permissions;
        return this;
    }

    addStringOption(callback) {
        const option = new SlashCommandOptionBuilder(3); // Type 3 for STRING
        callback(option);
        this.command.options.push(option.toJSON());
        return this;
    }

    addUserOption(callback) {
        const option = new SlashCommandOptionBuilder(6); // Type 6 for USER
        callback(option);
        this.command.options.push(option.toJSON());
        return this;
    }

    toJSON() {
        return this.command;
    }
}
