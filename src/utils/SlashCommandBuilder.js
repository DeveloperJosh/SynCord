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

    addStringOption(callback) {
        const option = new SlashCommandOptionBuilder(3); 
        callback(option);
        this.command.options.push(option.toJSON());
        return this;
    }

    addUserOption(callback) {
        const option = new SlashCommandOptionBuilder(6); 
        callback(option);
        this.command.options.push(option.toJSON());
        return this;
    }

    toJSON() {
        return this.command;
    }
}
