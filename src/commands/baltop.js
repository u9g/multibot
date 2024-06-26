const Discord = require('discord.js')
const {
  allAcountsBusy,
  escapeMarkdown,
  getTimePassed
} = require('../util/discord-helper')

module.exports = {
  name: 'baltop',
  cooldown: 5,
  aliases: ['balancetop'],
  description: 'Gets either the top 15 players or the given page of level top.',
  race: true,
  async execute (message, args, accounts) {
    // x
    const emojiNext = '➡' // unicode emoji are identified by the emoji itself
    const emojiPrevious = '⬅'
    const emojiX = '❌'
    const reactionArrow = [emojiPrevious, emojiNext, emojiX]
    const time = 60000 * 2 // time limit: 2 min
    const boundaries = [1, 10]

    function filter (reaction, user) {
      return !user.bot && reactionArrow.includes(reaction.emoji.name) // check if the emoji is inside the list of emojis, and if the user is not a bot
    }

    function onCollect (emoji, message, i, bot) {
      if (emoji.name === emojiPrevious && i > boundaries[0]) {
        const newIx = i - 1
        renderCommand(bot, newIx).then((embed) => {
          message.edit(embed)
        })
        i--
      } else if (emoji.name === emojiNext && i < boundaries[1]) {
        const newIx = i + 1
        renderCommand(bot, newIx).then((embed) => {
          message.edit(embed)
        })
        i++
      }
      return i
    }

    function createCollectorMessage (message, author, acc, firstPageIx) {
      const bot = acc.bot
      let i = firstPageIx
      const collector = message.createReactionCollector(filter, { time })
      collector.on('collect', (r) => {
        const reactingUser = r.users.cache.find((x) => !x.bot)
        if (reactingUser === author) {
          i = onCollect(r.emoji, message, i, bot)
          try {
            message.reactions.removeAll()
          } catch (err) {

          }
          if (r.emoji.name === emojiX) {
            collector.stop()
            // do nothing after clearing emojis
          } else if (i === boundaries[0]) {
            message
              .react(emojiNext)
              .then((msgReaction) => msgReaction.message.react(emojiX))
          } else if (i === boundaries[1]) {
            message
              .react(emojiPrevious)
              .then((msgReaction) => msgReaction.message.react(emojiX))
          } else {
            message
              .react(emojiPrevious)
              .then((msgReaction) => msgReaction.message.react(emojiNext))
              .then((msgReaction) => msgReaction.message.react(emojiX))
          }
        }
      })
      collector.on('end', (collected) => {
        try {
          message.reactions.removeAll()
        } catch (err) {

        }
        acc.done()
      })
    }

    function sendList (channel, author, acc, firstPage) {
      getFirstPage(acc.bot, firstPage).then((embed) => {
        if (firstPage === boundaries[0]) {
          channel
            .send(embed)
            .then((msg) => msg.react(emojiNext))
            .then((msgReaction) => msgReaction.message.react(emojiX))
            .then((msgReaction) =>
              createCollectorMessage(
                msgReaction.message,
                author,
                acc,
                firstPage
              )
            )
        } else if (firstPage === boundaries[1]) {
          channel
            .send(embed)
            .then((msg) => msg.react(emojiPrevious))
            .then((msgReaction) => msgReaction.message.react(emojiX))
            .then((msgReaction) =>
              createCollectorMessage(
                msgReaction.message,
                author,
                acc,
                firstPage
              )
            )
        } else {
          channel
            .send(embed)
            .then((msg) => msg.react(emojiPrevious))
            .then((msgReaction) => msgReaction.message.react(emojiNext)) // last page so no next
            .then((msgReaction) => msgReaction.message.react(emojiX))
            .then((msgReaction) =>
              createCollectorMessage(
                msgReaction.message,
                author,
                acc,
                firstPage
              )
            )
        }
      })
    }

    // get account
    const acc = accounts.takeOne()
    // if there is no account
    if (acc === null) {
      message.channel.send(allAcountsBusy)
    } else if (isNaN(args[1])) {
      sendList(message.channel, message.author, acc, 1)
    } else {
      sendList(message.channel, message.author, acc, +args[1])
    }
  }
}

function getFirstPage (bot, i) {
  return new Promise((resolve, reject) => {
    renderCommand(bot, i).then((x) => resolve(x))
  })
}

function renderCommand (bot, page) {
  return new Promise((resolve, reject) => {
    const regex = {
      user: /\d+\. (.+): \$(.+)/,
      start: /Top Balances \(\d+\/\d+\)/
    }

    const timeNow = new Date(Date.now())
    const players = []
    let listening = false
    bot.chat(`/baltop ${page}`)
    bot.on('message', (msg) => {
      const ft = msg.toString()
      if (regex.start.test(ft)) listening = true
      else if (listening && regex.user.test(ft)) {
        const [, ign, money] = ft.match(regex.user)
        players.push([ign, money])
        if (players.length === 15) {
          listening = false
          const timePassed = getTimePassed(timeNow)
          const embed = createEmbed(players, page, timePassed)
          bot.removeAllListeners(['message'])
          resolve(embed)
        }
      }
    })
  })
}

function createEmbed (players, page, timePassed) {
  const desc = createDescription(players)
  const timeString = `✔️ in ${timePassed}s`
  const title =
    page > 1 ? `Top Balances (${page} / 10)` : 'Top Balances (1 / 10)'
  return new Discord.MessageEmbed()
    .setAuthor('The Cosmic Sky Bot', 'https://i.ibb.co/7WnrkH2/download.png')
    .setTitle(title)
    .setDescription(desc)
    .setColor('PURPLE')
    .setFooter(timeString)
    .setTimestamp()
}

const createDescription = (players) =>
  players
    .map((info, ix) => {
      const ign = escapeMarkdown(info[0])
      const balance = info[1]
      return `${ix + 1}. **${ign}**: $${balance}`
    })
    .join('\n')
