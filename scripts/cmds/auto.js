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
    shortDescription: 'Always active auto video download for any URL',
    category: 'media',
  },

  onStart: async function ({ api, event }) {
    return api.sendMessage("✅ AutoLink is always active. Just send any link!", event.threadID);
  },

  onChat: async function ({ api, event }) {
    const threadID = event.threadID;
    const message = event.body;

    const linkMatch = message.match(/(https?:\/\/[^\s]+)/);
    if (!linkMatch) return;

    const url = linkMatch[0];
    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    try {
      const response = await axios.get(`https://nayan-video-downloader.vercel.app/alldown?url=${encodeURIComponent(url)}`);
      const { title, high, low } = response.data.data;

      if (!high && !low) {
        api.setMessageReaction("😞", event.messageID, () => {}, true); 
        return api.sendMessage("❌ No video found at this URL.", threadID, event.messageID);
      }

      const videoUrl = high || low;

      const imgurRes = await axios.get(`https://imgur-upload-psi.vercel.app/mahabub?url=${encodeURIComponent(videoUrl)}`);
      const imgurLink = imgurRes.data.url || "N/A";

      request(videoUrl).pipe(fs.createWriteStream("video.mp4")).on("close", () => {
        api.setMessageReaction("✅", event.messageID, () => {}, true); 
        api.sendMessage({
          body: `╭──────────────────◊\n\n\n《TITLE》: ${title || "No Title"}\n\n🌐 《IMGUR》: ${imgurLink}\n\n\n╰──────────────────◊`,
          attachment: fs.createReadStream("video.mp4")
        }, threadID, () => fs.unlinkSync("video.mp4"));
      });

    } catch (err) {
      console.error("Download Error:", err);
      api.setMessageReaction("😞", event.messageID, () => {}, true); 
      api.sendMessage("❌ Error processing the link.", threadID, event.messageID);
    }
  }
};
