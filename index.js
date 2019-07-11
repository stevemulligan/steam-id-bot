const Discord = require("discord.js");
const winston = require("winston");
const waitUntil = require('wait-until');
const DOMParser = require('xmldom').DOMParser;
const fetch = require('node-fetch');
const getUrls = require('get-urls');

require('dotenv').config();

const logger = winston.createLogger({
  level: "info",
  // format: winston.format.json(),
  transports: [
    //
    // - Write to all logs with level `info` and below to `combined.log`
    // - Write all logs error (and below) to `error.log`.
    //
    // new winston.transports.File({ filename: "error.log", level: "error" }),
    // new winston.transports.File({ filename: "combined.log" })
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.simple(),
        winston.format.colorize()
      )
    })
  ]
});

// Initialize Discord Bot
const client = new Discord.Client();

client.on("ready", evt => {
  logger.info("Connected");
  const { username, id } = client.user;
  logger.info(`Logged in as: ${username} (${id})`);
  // client.user.setActivity(`Serving ${client.guilds.size} servers`);
  client.user.setActivity(`Looking for steam ID's`);
});


// TODO: post message when first joining
client.on('guildCreate', guild => {
  // waituntil guild is available
  waitUntil()
    .interval(1000)
    .times(30)
    .condition(() => guild.available)
    .done(result => {
      if (result) {
        // console.log(guild.channels.find("name", "general"));
        // const channel = guild.channels.find("name", "general");
        // guild.systemChannel.send
        // guild.defaultChannel.sendMessage("DM me your steam profile URL and I will give you your steam ID");

        const { id, name, region } = guild;
        logger.info(`Added to guild ${name} | ID: ${id} | Region: ${region}`);
        const totalGuilds = client.guilds.size;
        logger.info(`Total guilds: ${totalGuilds}`);
      }
    });

  // message.channel.send("DM me your steam profile URL and I will give you your steam ID");
});

client.on("guildDelete", guild => {
  const { id, name, region } = guild;
  logger.info(`Guild ${name} removed me with ID: ${id}`);
  const totalGuilds = client.guilds.size;
  logger.info(`Total guilds: ${totalGuilds}`);
});

async function processMessage(message) {
	const urlSet = getUrls(message.content);
	const urls = Array.from(urlSet);
	for (let i = 0; i < urls.length; i++) {

		const url = urls[i].concat("?xml=1");

		try {
			const resp = await fetch(url);
			const text = await resp.text();
			const doc = new DOMParser().parseFromString(text);
			const ele = doc.documentElement.getElementsByTagName("steamID64");
			const steamID = ele.item(0).firstChild.nodeValue;
			message.channel.send(`Your steam id: ${steamID}`);
		} catch (error) {
			console.log(error);
			message.channel.send("An error occurred retrieving steam id for " + url);
		}
	}
}

client.on("message", async message => {

  switch(message.channel.type) {
    case "dm":
      if (message.content.includes("help")) {
        message.channel.send("Enter your steam profile URL to get your steam ID. It should look like so: `https://steamcommunity.com/id/your_profile_name/`");
      } else {
	      await processMessage(message);
      }
  }

  if (message.content.startsWith('steamid '))
  {
	  if (message.content.includes("help")) {
		  message.channel.send("Enter your steam profile URL to get your steam ID. It should look like so: `https://steamcommunity.com/id/your_profile_name/`");
	  } else {
		  await processMessage(message);
	  }
  }

	if (message.isMentioned(client.user)) {
  	if (message.channel.name === "rust-bots")
	  {
		  if (message.content.includes("help")) {
			  message.channel.send("Enter your steam profile URL to get your steam ID. It should look like so: `https://steamcommunity.com/id/your_profile_name/`");
		  } else {
			  await processMessage(message);
		  }
	  }
  }

});

client.login(process.env.TOKEN);
