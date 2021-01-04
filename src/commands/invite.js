const Discord = require('discord.js')

module.exports = {
  name: 'invite',
  cooldown: 5,
  description: 'Invite the discord bot to your server!',
  execute (message, args, accounts) {
    // embed.addField("Field title", "Your text here: [link](http://example.com)")
    const embed = new Discord.MessageEmbed()
      .setAuthor('The Cosmic Sky Bot', 'https://i.ibb.co/7WnrkH2/download.png')
      .setDescription(
        `[Invite the bot to your own discord](${inviteLink})\n[Join the Official Discord](${discordLink})`
      )
      .setColor('AQUA')
    message.channel.send(embed)
  }
}

const inviteLink =
  'https://discord.com/api/oauth2/authorize?client_id=701684406229794877&permissions=67464256&scope=bot'
const discordLink = 'https://discord.gg/a3MNVSZatM'
