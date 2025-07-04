export class ButtonBuilder {
  constructor() {
    this.button = {
      type: 2,
      style: 1,
      label: null,
      custom_id: null,
      url: null,
      disabled: false,
    };
  }

  setStyle(style) {
    this.button.style = style;
    return this;
  }

  setLabel(label) {
    this.button.label = label;
    return this;
  }

  setCustomId(customId) {
    this.button.custom_id = customId;
    return this;
  }

  setURL(url) {
    this.button.url = url;
    return this;
  }

  setDisabled(disabled = true) {
    this.button.disabled = disabled;
    return this;
  }

  toJSON() {
    if (this.button.style !== 5) {
      delete this.button.url;
    } else {
      delete this.button.custom_id;
    }
    return this.button;
  }
}
