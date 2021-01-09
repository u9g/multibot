const Discord = require('discord.js')
const {
  sortArrayOfObjects,
  escapeMarkdown,
  getTimePassed,
  splitToChunks,
  addReduce
} = require('../../util/discord-helper')
const getalliancemembers = require('../../functions/getalliancemembers')
const getuserlevel = require('../../functions/getuserlevel')
const getuseralliance = require('../../functions/getuseralliance')

const THREADS = 3

function renderCommand (accounts, identifier) {
  return new Promise((resolve, reject) => {
    asyncRunner(accounts, identifier).then(embed => resolve(embed))
  })
}

async function asyncRunner (accounts, identifier) {
  const timeNow = new Date(Date.now())
  const allianceMembers = (await getalliancemembers(accounts, identifier)).all
  if (allianceMembers.length > 0) {
    let allianceMemberLevels = []
    const halfs = splitToChunks(allianceMembers, THREADS)
    const data = await Promise.all(halfs.map(x => doSection(accounts, x)))
    data.map(x => allianceMemberLevels.push(...x))
    allianceMemberLevels = sortArrayOfObjects(allianceMemberLevels, 'level')
    const allianceName = await getuseralliance(accounts, identifier)
    const timePassed = getTimePassed(timeNow)
    const embed = makeEmbed(allianceName, allianceMemberLevels, timePassed)
    return embed
  } else {
    return notAllianceEmbed
  }
}

async function doSection (accounts, usernames) {
  const allianceMemberLevels = []
  for await (const member of usernames) {
    const ign = member
    const level = await getuserlevel(accounts, ign)
    // if (level === null) level = await getuserlevel(accounts, ign)
    allianceMemberLevels.push({ ign: ign, level: level })
  }
  return allianceMemberLevels
}

function makeEmbed (identifier, data, timePassed) {
  const avg = addReduce(data.map(player => player.level)) / data.length
  const desc = data.map((player, ix) => {
    const ign = escapeMarkdown(player.ign)
    return `${ix + 1} **${ign}**: Level **${player.level}**`
  }).join('\n') + '\n\n' + `**Average Level**: **__${Math.floor(avg)}__**`
  const timeString = `✔️ in ${timePassed}s`
  return new Discord.MessageEmbed()
    .setAuthor('The Cosmic Sky Bot', 'https://i.ibb.co/7WnrkH2/download.png')
    .setTitle(`${identifier}'s Levels`)
    .setColor('AQUA')
    .setDescription(desc)
    .setTimestamp()
    .setFooter(timeString)
}

const notAllianceEmbed = new Discord.MessageEmbed()
  .setAuthor('The Cosmic Sky Bot', 'https://i.ibb.co/7WnrkH2/download.png')
  .setTitle("This alliance doesn't exist, that player doesn't have an alliance, or that player doesn't exist")
  .setColor('AQUA')
  .setTimestamp()

module.exports = { renderCommand }
