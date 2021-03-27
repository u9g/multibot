require('dotenv').config()
const Discord = require('discord.js')
const fetch = require('node-fetch')
const { asyncRunner: bossTop } = require('./getbosstophelper')
const { escapeMarkdown, fetchEmoji } = require('../util/discord-helper')

module.exports = {
  name: 'boss',
  cooldown: 5,
  aliases: ['bosses'],
  description: 'boss top lol',
  execute (message, args, accounts) {
    if (args[0] === 'top') {
      bossTop(message.client).then(o => message.channel.send(o))
    } else {
      asyncRunner(message.client).then(o => message.channel.send(o))
    }
    // message.channel.send(embed)
  }
}

async function getJSON () {
  const url = `http://${process.env.BOSS_API}:3000/boss`

  const response = await fetch(url)
  const res = await response.json()
  return res
}

async function asyncRunner (client) {
  try {
    const res = await getJSON()
    // make embed
    const str = []
    for (const boss of Object.entries(res)) {
      if (boss[1] !== null) {
        str.push(`${getEmoji(boss[0], client)} **${boss[0]}**:`)
        str.push(makeKilledLine(boss))
        str.push(makeNextSpawnTimeLine(boss))
        str.push(makeSpawnedTimeLine(boss))
        str.push(makeSpawnedDirectionLine(boss))
        str.push('\n')
      } else {
        str.push(`${getEmoji(boss[0], client)} **${boss[0]}**: ❓`)
      }
    }
    return new Discord.MessageEmbed()
      .setTitle('Boss Info')
      .setDescription(str.join('\n'))
      .setColor('GREEN')
      .setTimestamp()
  } catch (err) {
    console.log(err)
    client.users.cache.get('424969732932894721').send(failedEmbed)
    return failedEmbed
  }
}

function getEmoji (bossName, client) {
  if (bossName === 'Bandit King') return fetchEmoji('bk', client)
  else if (bossName === 'Plague Doctor') return fetchEmoji('pd', client)
  else if (bossName === "Yijki's Shadow") return fetchEmoji('ys', client)
  else if (bossName === 'The Nightmare') return fetchEmoji('tn', client)
}

function makeKilledLine (boss) {
  if (boss[1].killed === null) {
    return '❤️ **Is alive**: ✅!'
  } else {
    const killers = boss[1].killed.killers
      .map((x) => escapeMarkdown(x.name))
      .join(', ')
    return `💔 **Is alive**: ❌! killed by: ${killers}`
  }
}

function makeNextSpawnTimeLine (boss) {
  const { spawnTime } = boss[1]
  const twoHoursLater = new Date(spawnTime)
  twoHoursLater.setHours(twoHoursLater.getHours() + 2)
  const time = (twoHoursLater - new Date(Date.now())) / 1000 / 60
  const timePassedHrs = Math.floor(time / 60)
  const timePassedMins = Math.floor(time % 60)
  const hrs = timePassedHrs > 0 ? `${timePassedHrs} hours` : ''
  const mins = timePassedMins > 0 ? `${timePassedMins} minutes` : ''
  if (boss[0] === 'The Nightmare') {
    return '⌛ **Next Spawn**: ❌ Does not auto respawn!'
  } else if (mins < 1) {
    return '⌛ **Next Spawn**: <1 minute away'
  }
  return `⌛ **Next Spawn**: ${hrs} ${mins} away`
}

function makeSpawnedTimeLine (boss) {
  const { spawnTime } = boss[1]
  const timePassedHrs = Math.floor(
    (new Date(Date.now()) - new Date(spawnTime)) / 1000 / 60 / 60
  )
  const timePassedMins = Math.floor(
    ((new Date(Date.now()) - new Date(spawnTime)) / 1000 / 60) % 60
  )
  const hrs = timePassedHrs > 0 ? `${timePassedHrs} hours` : ''
  const mins = timePassedMins > 0 ? `${timePassedMins} minutes` : ''
  if (mins < 1) {
    return '⌛ **Time Since Last Spawn**: <1 minute ago'
  }
  return `⌛ **Time Since Last Spawn**: ${hrs} ${mins} ago`
}

function makeSpawnedDirectionLine (boss) {
  const { x, z } = boss[1].spawn
  const direction = getDirection(x, z)
  const signs = (r) => `${Math.sign(r) === 1 ? '+' : '-'}`
  return `🧭 **Spawned**: ${direction} (${signs(x)}${signs(z)})`
}

function getDirection (x, z) {
  x = Math.sign(x)
  z = Math.sign(z)
  if (x === -1 && z === -1) return 'North-West'
  if (x === 1 && z === -1) return 'North-East'
  if (x === -1 && z === 1) return 'South-West'
  if (x === 1 && z === 1) return 'South-East'
  return ''
}

const failedEmbed = new Discord.MessageEmbed()
  .setTitle('Boss API down :(')
  .setColor('RED')
  .setTimestamp()
