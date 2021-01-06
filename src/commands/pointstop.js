const Discord = require('discord.js')
const { allAcountsBusy, removeCommas } = require('../util/discord-helper')

module.exports = {
  name: 'pointstop',
  cooldown: 5,
  aliases: ['ispointstop', 'ptop'],
  description: "Get's a player's balance.",
  execute (message, args, accounts) {
    const acc = accounts.takeOne()

    if (acc === null) {
      return message.channel.send(allAcountsBusy)
    }

    renderCommand(acc.bot, args[0]).then(embed => {
      message.channel.send(embed)
      acc.bot.removeAllListeners()
      acc.done()
    })
  }
}

const regex = {
  ign: /\d+. (?:\[.+] )?(.+) \(Level (\d+)\)/,
  pts: /Island Points: §b(.+)/,
  start: /Top Player Islands \(\d+\/\d+\)/
}

function renderCommand (bot, ign) {
  return new Promise((resolve, reject) => {
    let playersList = []
    let showingPeople = false

    repeatCommand(bot, '/is top', 5)

    bot.on('message', (msg) => {
      const text = msg.toString()
      if (regex.start.test(text)) showingPeople = true
      else if (showingPeople) {
        // parse data
        const ign = getIgn(text)
        const points = getIslandPoints(msg)
        playersList.push([ign, points])
        // once all data is collected
        if (playersList.length === 60) {
          const sortedPlayersList = sortArr(playersList)
          const embed = createEmbed(sortedPlayersList)
          bot.removeAllListeners(['message'])
          resolve(embed)
          playersList = []
        }
        // if a page has just been finished
        if (playersList.length % 15 === 0) showingPeople = false
      }
    })
    bot.chat(`/bal ${ign}`)
  })
}

const getIgn = (text) => text.match(regex.ign)[1]

const getIslandPoints = (text) => // get isl and points from lore from hover
  text.extra[0].hoverEvent.value.text.match(regex.pts)[1]

function createEmbed (players) {
  const desc = createDescription(players)
  return new Discord.MessageEmbed()
    .setAuthor('The Cosmic Sky Bot', 'https://i.ibb.co/7WnrkH2/download.png')
    .setTitle('Islands with most island points')
    .setDescription(desc)
    .setColor('AQUA')
    .setTimestamp()
    .setFooter(
      'The numbers in parentheses is the person compared to the person below.'
    )
}

function repeatCommand (bot, cmd, count) {
  for (let i = 0; i < count; i++) {
    setTimeout(() => bot.chat(`${cmd} ${i}`), 75 * (i + 1))
  }
}

const createDescription = (islands) =>
  '```md\n' +
  islands
    .slice(0, 10)
    .map((island, ix) => { // island: ['ign', # of points]
      const ign = island[0] // ign of the current island leader
      const points = island[1] // points the current island has
      const pointsPrevious = islands[ix + 1][1] // points the next island has
      const gain = parseCommaStr(points) - parseCommaStr(pointsPrevious) // island points over next island
      const total = parseCommaStr(points)
      const before = parseCommaStr(pointsPrevious) // island after this island on is top
      const percentGain = +(1 - before / total).toFixed(2) * 100
      return `${ix + 1}. <${ign}> ${points} <+${gain} or +${removeStringDecimal(percentGain)}%>`
    // return `${ix + 1}. \`\`\`${escapeMarkdown(ign)}\`\`\`: **${points}** (**+${gain}** or **+${removeStringDecimal(percentGain)}%**)`
    })
    .join('\n') +
  '```'

const parseCommaStr = (n) => +removeCommas(n)

const removeStringDecimal = (n) => n.toFixed(0)

const sortArr = (arr) =>
  arr.sort((a, b) => +removeCommas(a[1]) - +removeCommas(b[1])).reverse()
