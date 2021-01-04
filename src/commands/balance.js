const Discord = require('discord.js')
const { allAcountsBusy, escapeMarkdown } = require('../util/discord-helper')

// module.exports = {
//   name: 'balance',
//   cooldown: 5,
//   aliases: ['bal'],
//   description: "Get's a player's balance.",
//   execute (message, args, accounts) {
//     const acc = accounts.takeOne();

//     if (acc === null) {
//       return message.channel.send(allAcountsBusy;
//     }
//     if (!args[0]) {
//       return message.channel.send(createHelpEmbed());
//     }

//     renderCommand(acc.bot, args[0]).then(embed => {
//       message.channel.send(embed);
//       acc.bot.removeAllListeners();
//       acc.done();
//     });
//   }
// };

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
      .setTitle("❌ The user either doesn't exist or doesn't have a ballance.")
  }
  function CreateEmbed (info) {
    return new Discord.MessageEmbed()
      .setAuthor('The Cosmic Sky Bot', 'https://i.ibb.co/7WnrkH2/download.png')
      .setColor('RED')
      .setTitle(`${escapeMarkdown(info.ign)} has $${info.balance}`)
  }
}
