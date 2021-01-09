const Discord = require('discord.js')
const getuseralliance = require('../functions/getuseralliance')
const getalliancemembers = require('../functions/getalliancemembers')
const getuserbalance = require('../functions/getuserbalance')
const {
  sortArrayOfObjects,
  escapeMarkdown,
  numberWithCommas,
  getTimePassed,
  splitToChunks,
  addReduce
} = require('../util/discord-helper')
module.exports = {
  name: 'abal',
  cooldown: 5,
  race: true,
  aliases: ['abalance'],
  description: "Get's a player's balance.",
  execute (message, args, accounts) {
    return new Promise((resolve, reject) => {
      const input = args[0]
      if (input) {
        asyncRunner(accounts, input).then(embed => {
          message.channel.send(embed)
          resolve()
        })
      } else {
        resolve(helpEmbed)
      }
    })
  }
}

async function asyncRunner (accounts, identifier) {
  const timeNow = new Date(Date.now())
  const allianceName = await getuseralliance(accounts, identifier)
  const members = (await getalliancemembers(accounts, allianceName)).all
  const balances = []
  const halfs = splitToChunks(members, 3)
  const data = await Promise.all(halfs.map(x => doSection(accounts, x)))
  data.map(x => balances.push(...x))
  let sorted = sortArrayOfObjects(balances, 1)
  sorted = sorted.map(balance => [balance[0], numberWithCommas(balance[1]), balance[1]])
  const timePassed = getTimePassed(timeNow)
  return makeEmbed(allianceName, sorted, timePassed)
}

async function doSection (accounts, usernames) {
  const balances = []
  for await (const ign of usernames) {
    const balance = await getuserbalance(accounts, ign)
    balances.push([balance.username, balance.balance])
  }
  return balances
}

function makeEmbed (title, data, timePassed) {
  let desc = data.map((user, ix) => `${ix + 1}. **${escapeMarkdown(user[0])}**: $${user[1]}`).join('\n')
  const total = getTotal(data).toFixed(2)
  desc += '\n\n' + `**Total**: **__$${numberWithCommas(total)}__**`
  const timeString = `✔️ in ${timePassed}s`
  return new Discord.MessageEmbed()
    .setTitle(title)
    .setDescription(desc)
    .setFooter(timeString)
    .setColor('AQUA')
    .setTimestamp()
}

function getTotal (data) {
  const balances = data.map(user => user[2])
  return addReduce(balances)
}

const helpEmbed = new Discord.MessageEmbed()
  .setAuthor('The Cosmic Sky Bot', 'https://i.ibb.co/7WnrkH2/download.png')
  .setColor('RED')
  .setTitle('>abal [alliance name / username]')
