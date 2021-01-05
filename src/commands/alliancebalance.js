const Discord = require('discord.js')
const {
  allAcountsBusy,
  removeCommas,
  numberWithCommas,
  escapeMarkdown,
  splitToChunks
} = require('../util/discord-helper')

module.exports = {
  name: 'abal',
  cooldown: 5,
  aliases: ['abalance'],
  race: true,
  description: "Get's a player's balance.",
  execute (message, args, accounts) {
    return new Promise((resolve, reject) => {
      const acc = accounts.takeMany()

      acc.forEach((x) => x.setBusy())

      if (acc === null) {
        message.channel.send(allAcountsBusy)
        resolve('allAcountsBusy')
      }
      if (!args[0]) {
        message.channel.send(helpEmbed)
        resolve('helpEmbed')
      }

      asyncRunner(acc, args, message).then((embed) => {
        message.channel.send(embed)
        resolve('actualembed')
        acc.forEach((acc) => acc.done())
      })
    })
  }
}

async function asyncRunner (acc, args, message) {
  // could be username of a member OR the alliance's name
  const [allianceIdentifier] = args
  // start timer for execution time
  const timeNow = new Date(Date.now())
  // get alliance from user/alliance name
  let alliance
  try { // catches invalid alliances
    alliance = await getAlliancePromise(acc[0], allianceIdentifier)
  } catch (e) {
    // if the alliance isn't valid, return the invalid embed
    return notAllianceEmbed
  }
  // alliance name was valid
  // const approxTime = Math.ceil(alliance.members.length / acc.length) * 100
  // send a wait message
  // message.channel.send(`Please wait ${approxTime / 1000} seconds.`)
  // split the members into an array of members for each account
  const splitMembers = splitToChunks(alliance.members, acc.length)
  // map the alts to their set of users to check balances on
  const proms = acc.map((elem, ix) => getBalances(elem, splitMembers[ix]))
  const results = await Promise.allSettled(proms)
  // make all arrays into one
  const allPlayers = []
  results
    .map((promiseResults) => promiseResults.value)
    .forEach((players) => allPlayers.push(...players))
  // remove commas
  allPlayers.forEach((x) => (x.balance = removeCommas(x.balance)))
  const timePassed = ((new Date(Date.now()) - timeNow) / 1000)
    .toFixed(2)
    .toString()
  return makeEmbed(allPlayers, alliance.name, timePassed)
}

function makeEmbed (players, name, timePassed) {
  const sorted = sortBalances(players)
  const total = numberWithCommas(
    players.reduce((a, b) => a + +b.balance, 0).toFixed(2)
  )
  const desc = sorted
    .map((elem, ix) => {
      const ign = escapeMarkdown(elem.username)
      const bal = numberWithCommas(elem.balance)
      return `${ix + 1}. **${ign}**: $${bal}`
    })
    .join('\n')
  const timeString = `✔️ in ${timePassed}s`
  return new Discord.MessageEmbed()
    .setTitle(`${name}'s balance`)
    .setDescription(desc + `\n\n**Total**: $${total}`)
    .setColor('GREEN')
    .setTimestamp()
    .setFooter(timeString)
}

const sortBalances = (players) => players.sort((a, b) => b.balance - a.balance)

function getBalances (acc, splitMembers) {
  return new Promise((resolve, reject) => {
    if (splitMembers.length === 0) resolve([])
    const balance = /(.+)'s Balance: \$(.+)/
    const makePlayer = ([, username, balance]) => ({
      username,
      balance
    })

    const players = []

    acc.bot.on('message', (msg) => {
      const ft = msg.toString()
      if (balance.test(ft)) {
        const player = makePlayer(ft.match(balance))
        players.push(player)
        if (players.length === splitMembers.length) {
          resolve(players)
          acc.bot.removeAllListeners(['message'])
        }
      }
    })
    splitMembers.forEach((elem, ix) => {
      setTimeout(() => acc.bot.chat(`/bal ${elem}`), 100 * ix)
    })
  })
}
const notAllianceEmbed = new Discord.MessageEmbed()
  .setAuthor('The Cosmic Sky Bot', 'https://i.ibb.co/7WnrkH2/download.png')
  .setColor('RED')
  .setTitle(
    "❌ Either the alliance requested doesn't exist or the user doesn't have an alliance."
  )

function getAlliancePromise (acc, allianceName) {
  const getAllianceName = (fullText) => fullText.match(regex.allianceName)[1]
  const regex = {
    members: /.+ Members: (.+)/,
    allianceName: /----------- \[ (.+) \] -----------/
  }

  let showingAllianceMembers = false
  const alliance = {}

  return new Promise((resolve, reject) => {
    acc.bot.on('message', (msg) => {
      const ft = msg.toString()
      if (
        ft.startsWith('(!) Unable to find alliance from') ||
        ft === 'Usage: /alliance info <alliance/player>'
      ) {
        reject(new Error('Invalid alliance name.'))
      } else if (regex.allianceName.test(ft)) {
        // showing alliance name
        alliance.name = getAllianceName(ft)
        // about to list alliance members
        showingAllianceMembers = true
        alliance.members = []
      } else if (ft.includes('Enemies: ')) {
        // finished listing alliance members
        showingAllianceMembers = false
        resolve(alliance)
        // ask for member balances
      } else if (showingAllianceMembers) {
        // listing alliance members (online/offline members)
        if (regex.members.test(ft)) {
          const membersList = ft.match(regex.members)[1].split(', ')
          alliance.members = alliance.members.concat(membersList)
        }
      }
    })
    acc.bot.chat(`/a who ${allianceName}`)
  })
}

const helpEmbed = new Discord.MessageEmbed()
  .setAuthor('The Cosmic Sky Bot', 'https://i.ibb.co/7WnrkH2/download.png')
  .setColor('RED')
  .setTitle('>abal [alliance name / username]')
