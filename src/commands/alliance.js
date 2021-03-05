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
  async execute (message, args, accounts) {
    const subcommand = args[0]
    const input = args[1]
    let embed
    switch (subcommand) {
      case 'list':
        embed = await renderListCommand(accounts)
        break
      case 'info':
      case 'who':
        if (!input) embed = infoNoAllianceEmbed()
        else embed = await renderInfoCommand(accounts, input)
        break
      case 'level':
        if (!input) embed = levelNoAllianceEmbed()
        else embed = await renderLevelCommand(accounts, input)
        break
      case 'numbers':
        if (!input) embed = numbersNoAllianceEmbed()
        else embed = await renderNumbersCommand(accounts, input)
        break
      default:
        embed = helpEmbed()
        break
    }
    message.channel.send(embed)
  }
}

const helpEmbed = () => new Discord.MessageEmbed()
  .setAuthor('The Cosmic Sky Bot', 'https://i.ibb.co/7WnrkH2/download.png')
  .setTitle('You forgot a subcommand for the >a command, try these:')
  .setDescription(
    '\n**·** `>a list` - alliances with the most players online' +
      '\n**·** `>a who [alliance/ign]` - get information about an alliance' +
      '\n **·** `>a level [alliance/ign]` - get level of all players in an alliance' +
      '\n **·** `>a numbers [alliance/ign]` - gets number of players in an alliance and their truces/allies'
  )
  .setColor('AQUA')
const infoNoAllianceEmbed = () => new Discord.MessageEmbed()
  .setAuthor('The Cosmic Sky Bot', 'https://i.ibb.co/7WnrkH2/download.png')
  .setTitle('You forgot an alliance. Follow the format `>a who [alliance/ign]`')
const levelNoAllianceEmbed = () => new Discord.MessageEmbed()
  .setAuthor('The Cosmic Sky Bot', 'https://i.ibb.co/7WnrkH2/download.png')
  .setTitle('You forgot an alliance. Follow the format `>a level [alliance/ign]`')
const numbersNoAllianceEmbed = () => new Discord.MessageEmbed()
  .setAuthor('The Cosmic Sky Bot', 'https://i.ibb.co/7WnrkH2/download.png')
  .setTitle('You forgot an alliance. Follow the format `>a numbers [alliance/ign]`')
