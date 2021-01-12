const Discord = require('discord.js')
const { allAcountsBusy, escapeMarkdown } = require('../util/discord-helper')

module.exports = {
  name: 'balance',
  cooldown: 5,
  aliases: ['bal'],
  race: true,
  description: "Get's a player's balance.",
  execute (message, args, accounts) {
    return new Promise((resolve, reject) => {
      const acc = accounts.takeOne()

      if (acc === null) {
        resolve()
        message.channel.send(allAcountsBusy)
      }
      if (!args[0]) {
        resolve()
        return message.channel.send(createHelpEmbed())
      }

      renderCommand(acc.bot, args[0]).then(embed => {
        resolve()
        message.channel.send(embed)
        acc.done()
      })
    })
  }
}

function createHelpEmbed () {
  return new Discord.MessageEmbed()
    .setAuthor('The Cosmic Sky Bot', 'https://i.ibb.co/7WnrkH2/download.png')
    .setColor('GREEN')
    .setTitle('>bal [username]')
}

function renderCommand (bot, ign) {
  return new Promise((resolve, reject) => {
    const regex = {
      balance: /(.+)'s Balance: \$(.+)/,
      playerNotFound: /\(!\) Unable to find online player .+!/
    }

    const createInfo = (ft) => ({
      ign: ft.match(regex.balance)[1],
      balance: ft.match(regex.balance)[2]
    })

    bot.on('message', (msg) => {
      const ft = msg.toString()
      if (regex.balance.test(ft)) {
        const info = createInfo(ft)
        resolve(CreateEmbed(info))
      } else if (regex.playerNotFound.test(ft)) {
        bot.removeAllListeners(['message'])
        resolve(CreateNotBalanceEmbed())
      }
    })
    bot.chat(`/bal ${ign}`)
  })

  function CreateNotBalanceEmbed () {
    return new Discord.MessageEmbed()
      .setAuthor('The Cosmic Sky Bot', 'https://i.ibb.co/7WnrkH2/download.png')
      .setColor('RED')
      .setTitle("❌ The user either doesn't exist or doesn't have a balance.")
  }
  function CreateEmbed (info) {
    return new Discord.MessageEmbed()
      .setAuthor('The Cosmic Sky Bot', 'https://i.ibb.co/7WnrkH2/download.png')
      .setColor('AQUA')
      .setTitle(`${escapeMarkdown(info.ign)} has $${info.balance}`)
  }
}
