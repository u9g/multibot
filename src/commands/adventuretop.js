const Discord = require('discord.js')
const { allAcountsBusy, getLore } = require('../util/discord-helper')
const getuseralliance = require('../functions/getuseralliance')

module.exports = {
  name: 'adventuretop',
  cooldown: 5,
  aliases: ['advtop'],
  race: true,
  description: 'Shows the top adventure grinders in the given timeframe.',
  execute (message, args, accounts) {
    return new Promise((resolve, reject) => {
      const acc = accounts.takeOne()
      acc.setBusy()

      if (acc === null) {
        resolve()
        return message.channel.send(allAcountsBusy)
      }

      const subcommand = args[0]
      if (subcommand === 'daily') {
        runCommand('DAILY')
      } else if (subcommand === 'weekly') {
        runCommand('WEEKLY')
      } else if (subcommand === 'monthly') {
        runCommand('MONTHLY')
      } else {
        message.channel.send(helpEmbed)
        acc.done()
        resolve()
      }
      function runCommand (selection) {
        asyncRunner(acc, accounts, selection).then((embed) => {
          message.channel.send(embed)
          resolve()
          acc.done()
        })
      }
    })
  }
}

const helpEmbed = new Discord.MessageEmbed()
  .setTitle('You forgot a timeframe for the >advtop command')
  .setDescription('Command: `>advtop [timeframe]`' + '\nValid timeframes: `daily`, `weekly`, `monthly`')
  .setColor('AQUA')
  .setTimestamp()
const regex = /\d+\. (.+) - (.+) Adventure Points/

function asyncRunner (acc, accounts, timeFrame) {
  const time = {
    DAILY: 11,
    WEEKLY: 13,
    MONTHLY: 15
  }
  const wantedTime = time[timeFrame]

  return new Promise((resolve, reject) => {
    const { bot } = acc
    bot.chat('/top')

    bot.on('windowOpen', (window) => {
      if (JSON.parse(window.title).text === 'Leaderboards') {
        bot.clickWindow(14, 0, 0)
      } else if (JSON.parse(window.title).text === 'Adventure Points Gained') {
        const item = window.slots.find(item => item.slot === wantedTime)
        const lore = getLore(item).split('\n')
        lore.pop() // pop off the end an empty string
        const players = lore
          .map(line => {
            const [, ign, points] = line.match(regex)
            return { ign: ign, points: points }
          })
        getAlliancesFromUsernames(players, accounts).then(arr => {
          const embed = makeEmbed(arr, timeFrame)
          accounts.takeOne().relog() // relog the account after
          resolve(embed)
        })
      }
    })
  })

  async function getAlliancesFromUsernames (arr, accounts) {
    for await (const player of arr) {
      const alliance = await getuseralliance(accounts, player.ign)
      player.alliance = alliance
    }
    return arr
  }
}

function makeEmbed (data, timeFrame) {
  const desc = data.map((user, ix) => {
    const alliance = (user.alliance === 'N/A') ? '' : `[${user.alliance}] `
    return `${ix + 1}. ${alliance}**${user.ign}**: ${user.points}`
  })
  return new Discord.MessageEmbed()
    .setTitle('Most AP Gained in ' + timeFrame)
    .setDescription(desc)
    .setColor('AQUA')
    .setTimestamp()
}
