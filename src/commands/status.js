module.exports = {
  name: 'status',
  aliases: ['stats'],
  cooldown: 5,
  description: "Get's discord bot status",
  execute (message, args) {
    message.channel.send('Online! :rocket:');
  }
};
