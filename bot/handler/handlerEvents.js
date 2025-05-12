// handlerEvents.js
const logger = require("../utils/log");
const moment = require("moment-timezone");
const chalk = require("chalk");
const fs = require("fs-extra");
const path = require("path");

module.exports = async function ({ api, event }) {
  const { commands } = global.client;
  const { PREFIX } = global.config;
  const { threadID, body, senderID, isGroup } = event;

  if (!body || typeof body !== "string") return;

  const args = body.trim().split(/\s+/);
  const invoked = args[0];
  const commandArgs = args.slice(1);

  let commandName = null;
  let command = null;
  let usedPrefix = false;

  // Step 1: Try command with prefix
  if (invoked.startsWith(PREFIX)) {
    const name = invoked.slice(PREFIX.length).toLowerCase();
    if (commands.has(name)) {
      commandName = name;
      command = commands.get(name);
      usedPrefix = true;
    }
  }

  // Step 2: Try command without prefix
  if (!command) {
    const name = invoked.toLowerCase();
    if (commands.has(name)) {
      commandName = name;
      command = commands.get(name);
      usedPrefix = false;
    }
  }

  // Step 3: If no matching command found, exit
  if (!command) return;

  // Step 4: Check command's prefix requirement
  const prefixPolicy = (command.config && command.config.prefix) || "enable";

  if (prefixPolicy === "enable" && !usedPrefix) return;
  if (prefixPolicy === "disable" && usedPrefix) return;

  // Step 5: Logging for debug
  const time = moment().tz("Asia/Dhaka").format("HH:mm:ss");
  const logText = `[ ${time} ] ⇨ ${chalk.hex("#00FFFF")(commandName)} ⇨ From: ${chalk.hex("#FF9933")(senderID)} ⇨ Group: ${chalk.greenBright(isGroup ? "Yes" : "No")}`;
  console.log(logText);

  // Step 6: Execute the command
  try {
    await command.onStart({ api, event, args: commandArgs });
  } catch (error) {
    console.error("❌ Error in command:", commandName, error);
    api.sendMessage("⚠️ ᴄᴏᴍᴍᴀɴᴅ ᴇʀʀᴏʀ! ᴄʜᴇᴄᴋ ᴄᴏɴsᴏʟᴇ.", threadID);
  }
};
