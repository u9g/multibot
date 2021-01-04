require('dotenv').config()
const db = require('monk')(process.env.MONGO_CONN_STR)
const Discord = require('discord.js')
const {
  allAcountsBusy,
  removeCommas,
  numberWithCommas,
  escapeMarkdown,
  splitToChunks,
  fetchEmoji
} = require('../util/discord-helper')
const INCREMENT = 20

const bosses = [
  'Bandit King',
  'Plague Doctor',
  "Yijki's Shadow",
  'The Nightmare'
]

let emojis = []
const emojiX = '❌'
const backArrowEmoji = '⬅'
const time = 60000 * 2 // time limit: 2 min

module.exports = {
  name: 'oldboss',
  cooldown: 5,
  description: 'Gets information about old bosses.',
  execute (message, args, accounts) {
    // make emojis arr
    emojis = generateEmojis(message)
    // send start message
    sendList(message.channel, message.author)
    // message.channel.send(embed);
  }
}
/* FROM AFTER NOW ON home page ONLY */
function filter (reaction, user) {
  return (
    !user.bot &&
    (emojis.map((x) => x.name).includes(reaction.emoji.name) ||
      emojiX === reaction.emoji.name)
  ) // check if the emoji is inside the list of emojis, and if the user is not a bot
}

function onCollect (emoji, message) {
  if (emoji.name === emojis[0].name) {
    makeEmbed(bosses[0].toLowerCase(), 1).then((embed) => message.edit(embed))
  } else if (emoji.name === emojis[1].name) {
    makeEmbed(bosses[1].toLowerCase(), 1).then((embed) => message.edit(embed))
  } else if (emoji.name === emojis[2].name) {
    makeEmbed(bosses[2].toLowerCase(), 1).then((embed) => message.edit(embed))
  } else if (emoji.name === emojis[3].name) {
    makeEmbed(bosses[3].toLowerCase(), 1).then((embed) => message.edit(embed))
  }
}

function createCollectorMessage (message, author) {
  const collector = message.createReactionCollector(filter, { time })
  collector.on('collect', (r) => {
    const reactingUser = r.users.cache.find((x) => !x.bot)
    if (reactingUser === author) {
      onCollect(r.emoji, message)
      message.reactions.removeAll()
      if (r.emoji.name == emojiX) {
        collector.stop()
        // do nothing after clearing emojis
      } else {
        collector.stop()
        message
          .react(backArrowEmoji)
          .then((msgReaction) => msgReaction.message.react(emojiX))
          .then((msgReaction) =>
            createCollectorMessageForPage(msgReaction.message, author)
          )
      }
    }
  })
  collector.on('end', (collected) => {
    message.reactions.removeAll()
  })
}

function generateEmojis (message) {
  return bosses.map((bossName) => getEmoji(bossName, message.client))
}

function sendList (channel, author) {
  channel
    .send(invalidBossEmbed())
    .then((msg) => msg.react(emojis[0])) // bk
    .then((msgReaction) => msgReaction.message.react(emojis[1])) // plague
    .then((msgReaction) => msgReaction.message.react(emojis[2])) // yijki
    .then((msgReaction) => msgReaction.message.react(emojis[3])) // nightmare
    .then((msgReaction) => msgReaction.message.react(emojiX)) // x
    .then((msgReaction) => createCollectorMessage(msgReaction.message, author))
}
/* FROM BEFORE NOW ON home page ONLY */

/* FROM AFTER NOW ON subpage ONLY */
function filterForPage (reaction, user) {
  return (
    !user.bot &&
    (backArrowEmoji === reaction.emoji.name || emojiX === reaction.emoji.name)
  )
}

function createCollectorMessageForPage (message, author) {
  const collector = message.createReactionCollector(filterForPage, { time })
  collector.on('collect', (r) => {
    const reactingUser = r.users.cache.find((x) => !x.bot)
    if (reactingUser === author) {
      message.reactions.removeAll()
      if (r.emoji.name == emojiX) {
        collector.stop()
        // do nothing after clearing emojis
      } else if (r.emoji.name === backArrowEmoji) {
        collector.stop()
        recreateHomePage(message, author)
      }
    }
  })
  collector.on('end', (collected) => {
    message.reactions.removeAll()
  })
}

function recreateHomePage (message, author) {
  message
    .edit(invalidBossEmbed())
    .then((msg) => msg.react(emojis[0])) // bk
    .then((msgReaction) => msgReaction.message.react(emojis[1])) // plague
    .then((msgReaction) => msgReaction.message.react(emojis[2])) // yijki
    .then((msgReaction) => msgReaction.message.react(emojis[3])) // nightmare
    .then((msgReaction) => msgReaction.message.react(emojiX)) // x
    .then((msgReaction) => createCollectorMessage(msgReaction.message, author))
}
/* FROM BEFORE NOW ON subpage ONLY */

async function makeEmbed (bossName, page) {
  if (bosses.map((x) => x.toLowerCase()).includes(bossName)) {
    const info = await getBossInfo(bossName, page)
    if (info.length === 0) return invalidPageEmbed
    const desc = info.map((x, ix) => {
      const killers = x.killers.map((x) => escapeMarkdown(x)).join(', ')
      const value = `Killed by: **${killers}** ${timeDifference(
        Date.now(),
        x.date
      )}`
      return `**${ix + 1}**. ${value}`
    })
    const embed = new Discord.MessageEmbed()
      .setTitle(`Previous ${bossName}s`)
      .setDescription(desc.join('\n'))
      .setColor('GREEN')
      .setTimestamp()
    return embed
  }
}

function timeDifference (current, previous) {
  const msPerMinute = 60 * 1000
  const msPerHour = msPerMinute * 60
  const msPerDay = msPerHour * 24
  const msPerMonth = msPerDay * 30
  const msPerYear = msPerDay * 365

  const elapsed = current - previous

  if (elapsed < msPerMinute) {
    return Math.round(elapsed / 1000) + ' seconds ago'
  } else if (elapsed < msPerHour) {
    return Math.round(elapsed / msPerMinute) + ' minutes ago'
  } else if (elapsed < msPerDay) {
    return Math.round(elapsed / msPerHour) + ' hours ago'
  } else if (elapsed < msPerMonth) {
    return 'approximately ' + Math.round(elapsed / msPerDay) + ' days ago'
  } else if (elapsed < msPerYear) {
    return 'approximately ' + Math.round(elapsed / msPerMonth) + ' months ago'
  } else {
    return 'approximately ' + Math.round(elapsed / msPerYear) + ' years ago'
  }
}

async function getBossInfo (bossName, page) {
  const index = bosses.map((x) => x.toLowerCase()).indexOf(bossName)
  const coll = db.get(bosses[index])
  const info = await coll.find(
    {},
    { limit: INCREMENT, skip: (page - 1) * INCREMENT, sort: { $natural: -1 } }
  )
  return info
}

const invalidBossEmbed = () =>
  new Discord.MessageEmbed()
    .setTitle('Previously Killed Bosses')
    .setDescription(
      'React with the emoji of the boss you would like information about.\n' +
        `${emojis[0].toString()}: Bandit King` +
        '\n' +
        `${emojis[1].toString()}: Plague Doctor` +
        '\n' +
        `${emojis[2].toString()}: Yijki's Shadow` +
        '\n' +
        `${emojis[3].toString()}: The Nightmare` +
        '\n'
    )
    .setColor('RED')

function getEmoji (bossName, client) {
  if (bossName === 'Bandit King') return fetchEmoji('bk', client)
  else if (bossName === 'Plague Doctor') return fetchEmoji('pd', client)
  else if (bossName === "Yijki's Shadow") return fetchEmoji('ys', client)
  else if (bossName === 'The Nightmare') return fetchEmoji('tn', client)
}

const invalidPageEmbed = new Discord.MessageEmbed()
  .setTitle('There are no records here.')
  .setColor('RED')
