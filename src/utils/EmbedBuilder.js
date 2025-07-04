export class EmbedBuilder {
  constructor() {
    this.embed = {
      title: null,
      description: null,
      url: null,
      color: null,
      timestamp: null,
      footer: null,
      image: null,
      thumbnail: null,
      author: null,
      fields: [],
    };
  }

  setTitle(title) {
    this.embed.title = title;
    return this;
  }

  setDescription(description) {
    this.embed.description = description;
    return this;
  }

  setURL(url) {
    this.embed.url = url;
    return this;
  }

  setColor(color) {
    if (typeof color === "string" && color.startsWith("#")) {
      this.embed.color = parseInt(color.slice(1), 16);
    } else if (typeof color === "number") {
      this.embed.color = color;
    }
    return this;
  }

  setTimestamp(date = new Date()) {
    this.embed.timestamp = date.toISOString();
    return this;
  }

  setFooter(text, iconURL = null) {
    this.embed.footer = { text };
    if (iconURL) this.embed.footer.icon_url = iconURL;
    return this;
  }

  setImage(url) {
    this.embed.image = { url };
    return this;
  }

  setThumbnail(url) {
    this.embed.thumbnail = { url };
    return this;
  }

  setAuthor(name, iconURL = null, url = null) {
    this.embed.author = { name };
    if (iconURL) this.embed.author.icon_url = iconURL;
    if (url) this.embed.author.url = url;
    return this;
  }

  addField(name, value, inline = false) {
    this.embed.fields.push({ name, value, inline });
    return this;
  }

  toJSON() {
    const cleanEmbed = {};
    for (const [k, v] of Object.entries(this.embed)) {
      if (
        v !== null &&
        (!(Array.isArray(v)) || (Array.isArray(v) && v.length > 0))
      ) {
        cleanEmbed[k] = v;
      }
    }
    return cleanEmbed;
  }
}
