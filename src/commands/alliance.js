const Discord = require('discord.js')
const { renderCommand: renderListCommand } = require('./alliance/list')
const { renderCommand: renderInfoCommand } = require('./alliance/info')
const { renderCommand: renderLevelCommand } = require('./alliance/level')
const { renderCommand: renderNumbersCommand } = require('./alliance/numbers')

module.exports = {
  name: 'alliance',
  cooldown: 5,
  aliases: ['a'],
  race: true,
  description: 'Various alliance commands.',
  execute (message, args, accounts) {
    return new Promise((resolve, reject) => {
      const subcommand = args[0]
      const input = [args[1], args[2]]
      if (!subcommand) {
        resolve()
        message.channel.send(helpEmbed)
      }
      if (subcommand === 'list') {
        renderListCommand(accounts).then((embed) => {
          resolve()
          message.channel.send(embed)
        })
      } else if (subcommand === 'info' || subcommand === 'who') {
        if (!input[0]) {
          resolve()
          message.channel.send(infoNoAllianceEmbed)
        } else {
          renderInfoCommand(accounts, input[0]).then((embed) => {
            resolve()
            message.channel.send(embed)
          })
        }
      } else if (subcommand === 'level') {
        if (!input[0]) {
          resolve()
          message.channel.send(levelNoAllianceEmbed)
        } else {
          renderLevelCommand(accounts, input[0]).then((embed) => {
            resolve()
            message.channel.send(embed)
          })
        }
      } else if (subcommand === 'numbers') {
        if (!input[0]) {
          resolve()
          message.channel.send(numbersNoAllianceEmbed)
        } else {
          resolve()
          renderNumbersCommand(accounts, input[0]).then((embed) => {
            message.channel.send(embed)
          })
        }
      }
    })
  }
}

const helpEmbed = new Discord.MessageEmbed()
  .setAuthor('The Cosmic Sky Bot', 'https://i.ibb.co/7WnrkH2/download.png')
  .setTitle('You forgot a subcommand for the >a command, try these:')
  .setDescription(
    '\n**·** `>a list` - alliances with the most players online' +
      '\n**·** `>a who [alliance/ign]` - get information about an alliance' +
      '\n **·** `>a level [alliance/ign]` - get level of all players in an alliance' +
      '\n **·** `>a numbers [alliance/ign]` - gets number of players in an alliance and their truces/allies'
  )
  .setColor('AQUA')
const infoNoAllianceEmbed = new Discord.MessageEmbed()
  .setAuthor('The Cosmic Sky Bot', 'https://i.ibb.co/7WnrkH2/download.png')
  .setTitle('You forgot an alliance. Follow the format `>a who [alliance/ign]`')
const levelNoAllianceEmbed = new Discord.MessageEmbed()
  .setAuthor('The Cosmic Sky Bot', 'https://i.ibb.co/7WnrkH2/download.png')
  .setTitle('You forgot an alliance. Follow the format `>a level [alliance/ign]`')
const numbersNoAllianceEmbed = new Discord.MessageEmbed()
  .setAuthor('The Cosmic Sky Bot', 'https://i.ibb.co/7WnrkH2/download.png')
  .setTitle('You forgot an alliance. Follow the format `>a numbers [alliance/ign]`')
