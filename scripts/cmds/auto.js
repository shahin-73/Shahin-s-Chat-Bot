const fs = require("fs-extra");
const axios = require("axios");
const request = require("request");
const https = require("https");

module.exports = {
  config: {
    name: 'auto',
    version: '5.3',
    author: 'MR᭄﹅ MAHABUB﹅ メꪜ',
    countDown: 5,
    role: 0,
    shortDescription: 'Auto video downloader',
    category: 'media',
  },

  onStart: async function ({ api, event }) {
    return api.sendMessage("📥 Send the link to download the video 🎥", event.threadID);
  },

  onChat: async function ({ api, event }) {
    const threadID = event.threadID;
    const message = event.body.trim();

    const linkMatch = message.match(/(https?:\/\/[^\s]+)/);
    if (!linkMatch) {
      return api.sendMessage("❌ No link found. Please send a valid link.", threadID, event.messageID);
    }

    const videoLink = linkMatch[0];
    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    // Detect if the link is Facebook
    const isFacebook = videoLink.includes("facebook.com");

    // Custom headers for Facebook or generic
    const headers = isFacebook
      ? {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          "Accept": "*/*",
          "Referer": "https://www.facebook.com/"
        }
      : {
          "User-Agent": "Mozilla/5.0"
        };

    // Force IPv4 if Facebook
    const httpsAgent = isFacebook
      ? new https.Agent({ family: 4 })
      : undefined;

    try {
      // Get API Base URL
      const jsonRes = await axios.get("https://raw.githubusercontent.com/MR-MAHABUB-004/MAHABUB-BOT-STORAGE/main/APIURL.json");
      const apiBaseURL = jsonRes.data.Alldl;

      // Call API with headers and agent if needed
      const response = await axios.get(
        `${apiBaseURL}${encodeURIComponent(videoLink)}`,
        { headers, httpsAgent }
      );

      const { platform, title, hd, sd } = response.data;
      const downloadURL = hd || sd;

      if (!downloadURL) {
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        return api.sendMessage("❌ Could not find any download link.", threadID, event.messageID);
      }

      const filePath = "video.mp4";

      request({ url: downloadURL, headers })
        .pipe(fs.createWriteStream(filePath))
        .on("close", async () => {
          api.setMessageReaction("✅", event.messageID, () => {}, true);
          await api.sendMessage({
            body: `✅ 𝗗𝗼𝘄𝗻𝗹𝗼𝗮𝗱𝗲𝗱!\n\n📌 Platform: ${platform || "Unknown"}\n🎬 Title: ${title || "No Title"}\n📥 Quality: ${hd ? "HD" : "SD"}`,
            attachment: fs.createReadStream(filePath)
          }, threadID, () => fs.unlinkSync(filePath));
        })
        .on("error", (err) => {
          console.error("File Write Error:", err);
          api.setMessageReaction("❌", event.messageID, () => {}, true);
          api.sendMessage("❌ Error downloading the video.", threadID, event.messageID);
        });

    } catch (err) {
      console.error("API Error:", err.response?.data || err.message || err);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      api.sendMessage("❌ Something went wrong. Try again later.", threadID, event.messageID);
    }
  }
};
