export class ActionRowBuilder {
  constructor() {
    this.row = {
      type: 1,
      components: [],
    };
  }

  addButton(button) {
    this.row.components.push(button.toJSON());
    return this;
  }

  toJSON() {
    return this.row;
  }
}
