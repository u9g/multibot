const Discord = require('discord.js')
const { allAcountsBusy, escapeMarkdown, sortArrayOfObjects } = require('../util/discord-helper')

module.exports = {
  name: 'iswho',
  cooldown: 5,
  race: true,
  description: "Get's a player's balance.",
  async execute (message, args, accounts) {
    const acc = accounts.takeOne()

    if (acc === null) {
      return message.channel.send(allAcountsBusy)
    }
    if (!args[0]) {
      return message.channel.send(createHelpEmbed())
    }
    
    const embed = await renderCommand(acc.bot, args[0])
    message.channel.send(embed)
    acc.bot.removeAllListeners()
    acc.done()
  }
}

function createHelpEmbed () {
  return new Discord.MessageEmbed()
    .setAuthor('The Cosmic Sky Bot', 'https://i.ibb.co/7WnrkH2/download.png')
    .setColor('GREEN')
    .setTitle('>iswho [username]')
}

function renderCommand (bot, ign) {
  return new Promise((resolve, reject) => {
    const regex = {
      start: /(.+)'s Island Memberships \(\d+\)/,
      island: / \* (?:\*?\*?\*?(.+) )?(.+): Island Level (\d+)/,
      noIslands: /.+ is not a member of any islands!/,
      notaPlayer: /\(!\) Unable to find online player .+!/
    }
    let showingIslands = false
    const islands = []
    bot.chat(`/is who ${ign}`)
    bot.on('message', (msg) => {
      const text = msg.toString()
      if (regex.noIslands.test(text) || regex.notaPlayer.test(text)) {
        resolve(noIslandsEmbed)
      } else if (regex.start.test(text)) {
        ign = text.match(regex.start)[1] // to get capitalization of name
        showingIslands = true
      } else if (showingIslands && regex.island.test(text)) {
        const [, alliance, playerIgn, islandLevel] = text.match(regex.island)
        islands.push({
          alliance: alliance,
          ign: playerIgn,
          islandLevel: islandLevel
        })
      } else if (showingIslands && !regex.island.test(text)) {
        const sortedIslands = sortArrayOfObjects(islands, 'islandLevel')
        const embed = makeEmbed(ign, sortedIslands)
        resolve(embed)
      }
    })
  })
}

function makeEmbed (ign, info) {
  const desc = info.map(player => {
    const alliance = (!player.alliance) ? '' : `[${player.alliance}] `
    const ign = escapeMarkdown(player.ign)
    return `**·** ${alliance}**${ign}**: Island Level **${player.islandLevel}**`
  }).join('\n')

  return new Discord.MessageEmbed()
    .setAuthor('The Cosmic Sky Bot', 'https://i.ibb.co/7WnrkH2/download.png')
    .setColor('AQUA')
    .setTitle(`${ign}'s islands`)
    .setDescription(desc)
}

const noIslandsEmbed = new Discord.MessageEmbed()
  .setAuthor('The Cosmic Sky Bot', 'https://i.ibb.co/7WnrkH2/download.png')
  .setColor('RED')
  .setTitle("❌ The user either doesn't exist or doesn't isn't on any islands.")
