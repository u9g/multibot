const Discord = require('discord.js')
const { renderCommand: renderListCommand } = require('./alliance/list')
const { renderCommand: renderInfoCommand } = require('./alliance/info')
const { renderCommand: renderLevelCommand } = require('./alliance/level')

module.exports = {
  name: 'alliance',
  cooldown: 5,
  aliases: ['a'],
  description: 'Various alliance commands.',
  execute (message, args, accounts) {
    const subcommand = args[0]
    const input = [args[1], args[2]]
    if (!subcommand) {
      return message.channel.send(helpEmbed)
    }
    if (subcommand === 'list') {
      renderListCommand(accounts).then((embed) => {
        message.channel.send(embed)
      })
    } else if (subcommand === 'info' || subcommand === 'who') {
      if (!input[0]) {
        message.channel.send(infoNoAllianceEmbed)
      } else {
        renderInfoCommand(accounts, input[0]).then((embed) => {
          message.channel.send(embed)
        })
      }
    } else if (subcommand === 'level') {
      if (!input[0]) {
        message.channel.send(levelNoAllianceEmbed)
      } else {
        renderLevelCommand(accounts, input[0]).then((embed) => {
          message.channel.send(embed)
        })
      }
    } else {
      return message.channel.send(helpEmbed)
    }
  }
}

const helpEmbed = new Discord.MessageEmbed()
  .setAuthor('The Cosmic Sky Bot', 'https://i.ibb.co/7WnrkH2/download.png')
  .setTitle('You forgot a subcommand for the >a command, try these:')
  .setDescription(
    '\n**·** `>a list` - alliances with the most players online' +
      '\n**·** `>a who [alliance/ign]` - get information about an alliance' +
      '\n **·** `>a level [alliance/ign]` - get level of all players in an alliance'
  )
const infoNoAllianceEmbed = new Discord.MessageEmbed()
  .setAuthor('The Cosmic Sky Bot', 'https://i.ibb.co/7WnrkH2/download.png')
  .setTitle('You forgot an alliance. Follow the format `>a who [alliance/ign]`')
const levelNoAllianceEmbed = new Discord.MessageEmbed()
  .setAuthor('The Cosmic Sky Bot', 'https://i.ibb.co/7WnrkH2/download.png')
  .setTitle('You forgot an alliance. Follow the format `>a level [alliance/ign]`')
