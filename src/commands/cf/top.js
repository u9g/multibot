require('dotenv').config()
const { addWeeks } = require('date-fns')
const addDays = require('date-fns/addDays')
const Discord = require('discord.js')
const { numberWithCommas, escapeMarkdown } = require('../../util/discord-helper')

function renderCommand (message) {
  return new Promise((resolve, reject) => {
    sendList(message.channel, message.author)
    resolve()
  })
}

const emojiDaily = '💸'
const emojiWeekly = '💰'
const emojiAllTime = '🤑'
const backArrowEmoji = '⬅️'
const emojiX = '❌'
const reactionArrow = [emojiDaily, emojiWeekly, emojiAllTime, emojiX, backArrowEmoji]
const time = 60000 * 2 // time limit: 2 min

function sendList (channel, author) {
  channel
    .send(startEmbed)
    .then((msg) => msg.react(emojiDaily))
    .then((msgReaction) => msgReaction.message.react(emojiWeekly))
    .then((msgReaction) => msgReaction.message.react(emojiAllTime))
    .then((msgReaction) => msgReaction.message.react(emojiX))
    .then((msgReaction) => createCollectorMessage(msgReaction.message, author))
}

function filter (reaction, user) {
  return !user.bot && reactionArrow.includes(reaction.emoji.name) // check if the emoji is inside the list of emojis, and if the user is not a bot
}

function onCollect (emoji, message) {
  if (emoji.name === emojiDaily) {
    displayData('Daily').then((embed) => {
      message.edit(embed)
    })
  }
  if (emoji.name === emojiWeekly) {
    displayData('Weekly').then((embed) => {
      message.edit(embed)
    })
  }
  if (emoji.name === emojiAllTime) {
    displayData('All Time').then((embed) => {
      message.edit(embed)
    })
  }
}

function createCollectorMessage (message, author) {
  const collector = message.createReactionCollector(filter, { time })
  collector.on('collect', (r) => {
    const reactingUser = r.users.cache.find((x) => !x.bot)
    if (reactingUser === author) {
      onCollect(r.emoji, message)
      message.reactions.removeAll()
      if (r.emoji.name === emojiX) {
        collector.stop()
      // do nothing after clearing emojis
      } else if (r.emoji.name === backArrowEmoji) {
        message
          .edit(startEmbed)
          .then((msg) => msg.react(emojiDaily))
          .then((msgReaction) => msgReaction.message.react(emojiWeekly))
          .then((msgReaction) => msgReaction.message.react(emojiAllTime))
          .then((msgReaction) => msgReaction.message.react(emojiX))
      } else {
        message
          .react(backArrowEmoji)
          .then((msgReaction) => msgReaction.message.react(emojiX))
      }
    }
  })
  collector.on('end', (collected) => {
    message.reactions.removeAll()
  })
}

async function displayData (timeframe) {
  const MongoClient = require('mongodb').MongoClient
  const client = new MongoClient(process.env.MONGODB_CF_LOGIN, { useNewUrlParser: true, useUnifiedTopology: true })
  await client.connect()
  const collection = client.db('cfs').collection('s11')
  const dataCursor = aggregateTopWinners(collection, timeframe)
  const data = await dataCursor
  // done with db
  client.close()
  const embed = makeEmbed(data, timeframe)
  return embed
}

function aggregateTopWinners (collection, timeframe) {
  if (timeframe === 'All Time') {
    return collection.aggregate([
      { $sort: { amount: -1 } },
      { $limit: 5 }
    ]).toArray()
  } else if (timeframe === 'Weekly') {
    const weekAgo = addWeeks(new Date(Date.now()), 1)
    return collection.aggregate([
      { $match: { date: { $lte: weekAgo } } },
      { $sort: { amount: -1 } },
      { $limit: 5 }
    ]).toArray()
  } else if (timeframe === 'Daily') {
    const dayAgo = new Date(addDays(new Date(Date.now()), 1))
    return collection.aggregate([
      { $match: { date: { $lte: dayAgo } } },
      { $sort: { amount: -1 } },
      { $limit: 5 }
    ]).toArray()
  }
}

function makeEmbed (data, timeframe) {
  const desc = data.map((cf, ix) => `${ix + 1}. **${escapeMarkdown(cf.winner)}** beat ${escapeMarkdown(cf.loser)} in a **$${numberWithCommas(cf.amount)}**`)
  return new Discord.MessageEmbed()
    .setAuthor('The Cosmic Sky Bot', 'https://i.ibb.co/7WnrkH2/download.png')
    .setTitle('CF Top ' + timeframe)
    .setDescription(desc)
    .setTimestamp()
    .setColor('AQUA')
}

const startEmbed = new Discord.MessageEmbed()
  .setTitle('CF Top')
  .setDescription(
    'React with the emoji of the cf leaderboard you would like information about.\n' +
        `${emojiDaily.toString()}: Daily` +
        '\n' +
        `${emojiWeekly.toString()}: Weekly` +
        '\n' +
        `${emojiAllTime.toString()}: All Time` +
        '\n'
  )
  .setColor('RED')

module.exports = { renderCommand }
