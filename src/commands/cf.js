const Discord = require('discord.js')
const { renderCommand: renderInfoCommand } = require('./cf/info')
const { renderCommand: renderTopCommand } = require('./cf/top')
const { renderCommand: renderStatsCommand } = require('./cf/stats')

module.exports = {
  name: 'cf',
  cooldown: 5,
  race: false,
  description: 'Various alliance commands.',
  execute (message, args, accounts) {
    return new Promise((resolve, reject) => {
      const subcommand = args[0]
      const input = [args[1], args[2]]
      if (!subcommand) {
        resolve()
        message.channel.send(helpEmbed)
      }
      if (subcommand === 'info') {
        renderInfoCommand(accounts).then((embed) => {
          resolve()
          message.channel.send(embed)
        })
      } else if (subcommand === 'top') {
        renderTopCommand(message).then((_) => {
          resolve()
          // message.channel.send(embed)
        })
      } else if (subcommand === 'stats') {
        renderStatsCommand(message, input[0]).then((_) => {
          resolve()
          // message.channel.send(embed)
        })
      }
    })
  }
}

const helpEmbed = new Discord.MessageEmbed()
  .setAuthor('The Cosmic Sky Bot', 'https://i.ibb.co/7WnrkH2/download.png')
  .setTitle('You forgot a subcommand for the >a command, try these:')
  .setDescription(
    '\n**·** `>cf info` - basic info about the bot\'s cf database' +
    '\n**·** `>cf top` - top 5 cf\'s done today, this week, and all time' +
    '\n**·** `>cf stats` - basic info about a user\'s cfs'
  )
  .setColor('AQUA')
