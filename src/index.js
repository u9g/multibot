const fs = require('fs');
const Discord = require('discord.js');
const accountHelper = require('./account-handler');
require('dotenv').config();
const prefix = process.env.DISCORD_PREFIX;

const client = new Discord.Client();
client.commands = new Discord.Collection();
// import commands
fs.readdirSync('./commands')
  .filter((file) => file.endsWith('.js'))
  .forEach((file) => {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
  });

const cooldowns = new Discord.Collection();

const logins = require('../config/accounts.json').accounts;
const accounts = new accountHelper.Accounts(logins);

client.once('ready', () => {
  console.log('Ready!');
});

process.on('unhandledRejection', (error) =>
  console.error('Uncaught Promise Rejection', error)
);

client.on('message', (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);

  const commandName = args.shift().toLowerCase();

  const command =
    client.commands.get(commandName) ||
    client.commands.find(
      (cmd) => cmd.aliases && cmd.aliases.includes(commandName)
    );

  if (!command) return;

  if (!cooldowns.has(command.name)) {
    cooldowns.set(command.name, new Discord.Collection());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(command.name);
  const cooldownAmount = (command.cooldown || 3) * 1000;

  if (timestamps.has(message.author.id)) {
    const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

    if (now < expirationTime) {
      timestamps.set(message.author.id, now);
      setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

      const timeLeft = (expirationTime - now) / 1000;
      return message.reply(
        `please wait ${timeLeft.toFixed(
          1
        )} more second(s) before reusing the \`${command.name}\` command.`
      );
    }
  }

  const rejectAfterTimeout = (timeout) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => reject(new Error('Request timed out')), timeout);
    });
  };
  if (command.race) {
    try {
      Promise.race([
        runCommand(command, message, args),
        rejectAfterTimeout(5000),
      ]);
    } catch (reason) {
      console.log(
        'A command just failed that is supposed to be raced because: '
      );
      console.log(reason);
      message.channel.send(botRestarting);
      accounts.relogAll().then((_) => {
        console.log('restarrting');
        runCommand(command, message, args);
      });
    }
  } else runCommand(command, message, args);
});

function runCommand(command, message, args) {
  try {
    command.execute(message, args, accounts);
  } catch (error) {
    console.error(error);
    client.users.cache.get('424969732932894721').send(error);
    message.channel.send(botRestarting);
    message.reply('there was an error trying to execute that command!');
  }
}

const botRestarting = new Discord.MessageEmbed()
  .setTitle('Bot restarting, your command will be rerun soon.')
  .setColor('YELLOW')
  .setTimestamp();

client.login(process.env.DISCORD_TOKEN);
