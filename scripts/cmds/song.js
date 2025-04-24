const axios = require("axios");
const fs = require("fs");
const path = require("path");
const ytSearch = require("yt-search");
const https = require("https");
const ytdl = require("ytdl-core");

function deleteAfterTimeout(filePath, timeout = 15000) {
  setTimeout(() => {
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (!err) {
          console.log(`✅ Deleted file: ${filePath}`);
        } else {
          console.error(`❌ Error deleting file: ${filePath}`);
        }
      });
    }
  }, timeout);
}

async function getAPIUrl() {
  try {
    console.log("🔄 Fetching API URL from JSON...");
    const response = await axios.get('https://raw.githubusercontent.com/MR-MAHABUB-004/MAHABUB-BOT-STORAGE/refs/heads/main/APIURL.json');
    console.log("✅ Successfully fetched API URL JSON:", response.data); // Debug log

    // Ensure the response contains the expected 'YouTube' field
    if (response.data && response.data.YouTube) {
      return response.data.YouTube;
    } else {
      console.error("❌ YouTube field not found in the JSON.");
      throw new Error("YouTube field not found in the JSON.");
    }
  } catch (error) {
    console.error("❌ Failed to fetch API URL:", error.message);
    throw new Error("Failed to load API URL.");
  }
}

module.exports = {
  config: {
    name: "song",
    aliases: ["music"],
    version: "1.0",
    author: "‎MR᭄﹅ MAHABUB﹅ メꪜ",
    countDown: 5,
    role: 0,
    shortDescription: "mp3 song from YouTube",
    longDescription: "download mp3 song from YouTube using api",
    category: "user",
    guide: "{p}{n}song",
  },
  onStart: async function ({ api, event, args }) {
    if (args.length === 0) {
      return api.sendMessage("⚠️ Please provide a song name to search.", event.threadID);
    }

    const songName = args.join(" ");
    const processingMessage = await api.sendMessage(
      `🔍 Searching for "${songName}"...`,
      event.threadID,
      null,
      event.messageID
    );

    try {
      const searchResults = await ytSearch(songName);
      if (!searchResults || !searchResults.videos.length) {
        throw new Error("No results found for your search query.");
      }

      const topResult = searchResults.videos[0];
      const videoUrl = `https://www.youtube.com/watch?v=${topResult.videoId}`;

      const downloadDir = path.join(__dirname, "cache");
      if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true });
      }

      const safeTitle = topResult.title.replace(/[^a-zA-Z0-9]/g, "_");
      const downloadPath = path.join(downloadDir, `${safeTitle}.mp3`);

      // Fetch API URL from the external JSON file
      const apiUrl = await getAPIUrl();
      console.log("✅ Using API URL:", apiUrl); // Debug log
      if (!apiUrl) {
        throw new Error("No API URL found for YouTube.");
      }

      const downloadApiUrl = `${apiUrl}/download?url=${encodeURIComponent(videoUrl)}`;
      let fileDownloaded = false;

      try {
        const downloadResponse = await axios.get(downloadApiUrl);
        if (downloadResponse.data.file_url) {
          const downloadUrl = downloadResponse.data.file_url.replace("http:", "https:");
          const file = fs.createWriteStream(downloadPath);

          await new Promise((resolve, reject) => {
            https.get(downloadUrl, (response) => {
              if (response.statusCode === 200) {
                response.pipe(file);
                file.on("finish", () => {
                  file.close(resolve);
                  fileDownloaded = true;
                });
              } else {
                reject(new Error(`Failed to download file. Status code: ${response.statusCode}`));
              }
            }).on("error", reject);
          });
        }
      } catch (apiError) {
        console.error("❌ API failed, switching to ytdl-core:", apiError.message);
      }

      if (!fileDownloaded) {
        console.log("⚠️ Using ytdl-core as a backup...");
        const file = fs.createWriteStream(downloadPath);
        await new Promise((resolve, reject) => {
          ytdl(videoUrl, { filter: "audioonly", quality: "highestaudio" })
            .pipe(file)
            .on("finish", resolve)
            .on("error", reject);
        });
      }

      api.setMessageReaction("✅", event.messageID, () => {}, true);

      await api.sendMessage(
        {
          attachment: fs.createReadStream(downloadPath),
          body: `🎶 Title: ${topResult.title}\nHere is your song:`,
        },
        event.threadID,
        event.messageID
      );

      deleteAfterTimeout(downloadPath, 15000);
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      api.sendMessage(`❌ Failed: ${error.message}`, event.threadID, event.messageID);
    }
  },
};
