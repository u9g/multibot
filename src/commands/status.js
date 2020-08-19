const Discord = require('discord.js');

module.exports = {
  name: 'status',
  aliases: ['stats'],
  cooldown: 5,
  description: 'Gets discord bot status',
  execute (message, args, accounts) {
    if (args.length === 0) {
      const status = accounts.status();
      message.channel.send(renderStatusCommand(status));
    } else if (args[0] === 'busy' && !isNaN(+args[1])) {
      accounts.toggleBusy(+args[1]);
      message.channel.send(renderOpDoneCommand());
    } else if (args[0] === 'relog' && !isNaN(+args[1])) {
      accounts.relogAccount(+args[1]);
      message.channel.send(renderOpDoneCommand());
    }
  }
};

function renderStatusCommand (status) {
  return new Discord.MessageEmbed()
    .setTitle('Online Accounts 🚀')
    .setDescription(status)
    .setColor('GREEN')
    .setTimestamp();
}

function renderOpDoneCommand () {
  return new Discord.MessageEmbed()
    .setTitle('Operation finished ✅')
    .setColor('GREEN')
    .setTimestamp();
}
