require('dotenv').config()
const db = require('monk')(process.env.MONGO_CONN_STR)
const Discord = require('discord.js')
const { escapeMarkdown, fetchEmoji } = require('../util/discord-helper')
const dateEnabled = false

const bosses = [
  'Bandit King',
  'Plague Doctor',
  "Yijki's Shadow",
  'The Nightmare'
]

async function asyncRunner (client) {
  const embed = new Discord.MessageEmbed()
    .setTitle('Boss Top')
    .setColor('DARK_PURPLE')
    .setTimestamp()

  const fields = bosses.map((name) => bossMap(name, client))
  let values = await Promise.allSettled(fields)
  values = values.map((x) => x.value)
  embed.addFields(...values)
  return embed
}

function getEmoji (bossName, client) {
  if (bossName === 'Bandit King') return fetchEmoji('bk', client)
  else if (bossName === 'Plague Doctor') return fetchEmoji('pd', client)
  else if (bossName === "Yijki's Shadow") return fetchEmoji('ys', client)
  else if (bossName === 'The Nightmare') return fetchEmoji('tn', client)
}

async function bossMap (name, client) {
  const bossInfo = await getTopTen(name)
  if (bossInfo.length === 0) return { name, value: '?' }
  const field = bossInfo
    .map((elem, ix) => {
      const killerList = elem.killers
        .map((x) => escapeMarkdown(x))
        .map((x) => '**' + x + '**')
        .join(', ')
      const d = elem.duration
      const crown = ix + 1 === 1 ? '👑 ' : ''
      return `**${ix + 1}**. ${makeFormattedTime(d)} by ${crown}${killerList}${
          dateEnabled ? ` (${timeDifference(Date.now(), elem.date)})` : ''
        }`
    })
    .join('\n')
  return {
    name: `${getEmoji(name, client)} ${name}`,
    value: field
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
    return '≈ ' + Math.round(elapsed / msPerDay) + ' days ago'
  } else if (elapsed < msPerYear) {
    return '≈ ' + Math.round(elapsed / msPerMonth) + ' months ago'
  } else {
    return '≈ ' + Math.round(elapsed / msPerYear) + ' years ago'
  }
}

function makeFormattedTime (seconds) {
  return new Date(seconds * 1000).toISOString().substr(11, 8)
}

async function getTopTen (bossName) {
  try {
    const collection = db.get(bossName)
    const values = await collection.find(
      {},
      { limit: 5, fields: { _id: 0 }, sort: 'duration' }
    )
    return values
  } catch (err) {
    console.log(err)
  }
}

module.exports = { asyncRunner }
