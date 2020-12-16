const Discord = require('discord.js');

module.exports = {
  name: 'status',
  aliases: ['stats'],
  cooldown: 5,
  description: 'Gets discord bot status',
  execute (message, args, accounts) {
    if(message.author.id !== "424969732932894721") return;
    console.log(args);
    const subcommand = args[0];
    if (args.length === 0) {
      const status = accounts.status();
      message.channel.send(renderStatusCommand(status));
    } else if (subcommand === 'busy' && !isNaN(+args[1])) {
      accounts.toggleBusy(+args[1]);
      message.channel.send(operationDone);
    } else if (subcommand === 'relog' && !isNaN(+args[1])) {
      sendFinishOnPromiseEnd(accounts.relogAccount(+args[1]), message);
    } else if (subcommand === 'relogall') {
      sendFinishOnPromiseEnd(accounts.relogAll(), message);
    } else if (subcommand === 'cmd' && !isNaN(+args[1])){
      const command = message.content.substring(message.content.indexOf('"') + 1, message.content.lastIndexOf('"')); //remove ""
      const account = accounts.take(+args[1]).bot;
      account.chat(command); 
      message.channel.send(operationDone);
    }
  }
};

const sendFinishOnPromiseEnd = (prom, msg) =>
  prom.then(_ => msg.channel.send(operationDone));

function renderStatusCommand (status) {
  return new Discord.MessageEmbed()
    .setTitle('Online Accounts 🚀')
    .setDescription(status)
    .setColor('GREEN')
    .setTimestamp();
}

const operationDone =
   new Discord.MessageEmbed()
    .setTitle('Operation finished ✅')
    .setColor('GREEN')
    .setTimestamp();
