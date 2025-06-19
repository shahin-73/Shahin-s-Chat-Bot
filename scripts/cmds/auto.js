const fs = require("fs-extra");
const axios = require("axios");
const request = require("request");

module.exports = {
  config: {
    name: 'auto',
    version: '5.0',
    author: 'MR᭄﹅ MAHABUB﹅ メꪜ',
    countDown: 5,
    role: 0,
    shortDescription: 'auto video downloader',
    category: 'media',
  },

  onStart: async function ({ api, event }) {
    return api.sendMessage("𝐈𝐧𝐬𝐞𝐫𝐭 𝐥𝐢𝐧𝐤 🤏", event.threadID);
  },

  onChat: async function ({ api, event }) {
    const threadID = event.threadID;
    const message = event.body;

    const linkMatch = message.match(/(https?:\/\/[^\s]+)/);
    if (!linkMatch) return;

    const sumaiya = linkMatch[0];
    api.setMessageReaction("♻", event.messageID, () => {}, true);

    try {
      
      const jsonRes = await axios.get("https://raw.githubusercontent.com/MR-MAHABUB-004/MAHABUB-BOT-STORAGE/refs/heads/main/APIURL.json");
      const mahhabub4xBase = jsonRes.data.Alldl;

      
      const response = await axios.get(`${mahhabub4xBase}${encodeURIComponent(sumaiya)}`);
      const { title, downloadurlX } = response.data;

      if (!downloadurlX) {
        api.setMessageReaction("✖", event.messageID, () => {}, true);
        return api.sendMessage("", threadID, event.messageID);
      }

      
      request(downloadurlX)
        .pipe(fs.createWriteStream("video.mp4"))
        .on("close", () => {
          api.setMessageReaction("✔", event.messageID, () => {}, true);
          api.sendMessage({
            body: `╭──────────────────◊\n\n《𝐓𝐢𝐭𝐥𝐞》: ${title || "𝐔𝐧𝐟𝐢𝐧𝐝 💔"}\n\n╰──────────────────◊`,
            attachment: fs.createReadStream("video.mp4")
          }, threadID, () => fs.unlinkSync("video.mp4"));
        });

    } catch (err) {
      console.error("Download Error:", err.response?.data || err.message || err);
      api.setMessageReaction("✖", event.messageID, () => {}, true);
      api.sendMessage("", threadID, event.messageID);
    }
  }
};
