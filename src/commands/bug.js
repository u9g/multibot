const Discord = require('discord.js');

module.exports = {
  name: 'bug',
  cooldown: 5,
  aliases: ['bugs', 'report'],
  description: 'Invite the discord bot to your server!',
  execute(message, args, accounts) {
    //embed.addField("Field title", "Your text here: [link](http://example.com)")
    const embed = new Discord.MessageEmbed()
      .setAuthor('The Cosmic Sky Bot', 'https://i.ibb.co/7WnrkH2/download.png')
      .setTitle('Join the discord to report bugs!')
      .setDescription(`[Click to join](${discordLink})`)
      .setColor('AQUA');
    message.channel.send(embed);
  },
};
const discordLink = 'https://discord.gg/a3MNVSZatM';
