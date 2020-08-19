require('dotenv').config();
const prefix = process.env.DISCORD_PREFIX;
const { MessageEmbed } = require('discord.js');

module.exports = {
  name: 'help',
  description: 'List all of my commands or info about a specific command.',
  aliases: ['commands'],
  usage: '[command name]',
  cooldown: 5,
  execute (message, args) {
    const { commands } = message.client;

    if (!args.length) {
      const embed = renderGeneralHelpCommand(commands);

      return message.author
        .send(embed)
        .then(() => {
          if (message.channel.type === 'dm') return;
          message.reply("I've sent you a DM with all my commands!");
        })
        .catch(error => {
          console.error(
            `Could not send help DM to ${message.author.tag}.\n`,
            error
          );
          message.reply(
            "it seems like I can't DM you! Do you have DMs disabled?"
          );
        });
    }
    const name = args[0].toLowerCase();
    const command =
      commands.get(name) ||
      commands.find(c => c.aliases && c.aliases.includes(name));

    if (!command) {
      return message.reply("that's not a valid command!");
    }

    const embed = renderSpecificHelpCommand(command);

    message.channel.send(embed);
  }
};

function renderSpecificHelpCommand (command) {
  const string = [];
  string.push(`**Name:** ${command.name}`);

  if (command.aliases) {
    string.push(`**Aliases:** ${command.aliases.join(', ')}`);
  }
  if (command.description) {
    string.push(`**Description:** ${command.description}`);
  }
  if (command.usage) {
    string.push(`**Usage:** ${prefix}${command.name} ${command.usage}`);
  }

  string.push(`**Cooldown:** ${command.cooldown || 3} second(s)`);
  return new MessageEmbed()
    .setTitle(`Information about ${prefix}${command.name}`)
    .setDescription(string.join('\n'))
    .setColor('GREEN');
}

function renderGeneralHelpCommand (commands) {
  const desc = commands => {
    return (
      commands
        .map(cmd => `**${prefix}${cmd.name}**: ${cmd.description}`)
        .join('\n') +
      `\n\nYou can send **${prefix}help [command name]** to get info on a specific command!`
    );
  };
  return new MessageEmbed()
    .setAuthor('The Cosmic Sky Bot', 'https://i.ibb.co/7WnrkH2/download.png')
    .setDescription(desc(commands))
    .setTitle("Here's a list of all my commands:")
    .setTimestamp()
    .setColor('PURPLE');
}
