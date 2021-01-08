const Discord = require('discord.js')
const { sortArrayOfObjects, escapeMarkdown } = require('../../util/discord-helper')
const getalliancemembers = require('../../functions/getalliancemembers')
const getuserlevel = require('../../functions/getuserlevel')
const getuseralliance = require('../../functions/getuseralliance')

function renderCommand (accounts, identifier) {
  return new Promise((resolve, reject) => {
    asyncRunner(accounts, identifier).then(embed => resolve(embed))
  })
}

async function asyncRunner (accounts, identifier) {
  const timeNow = new Date(Date.now())
  const allianceMembers = await getalliancemembers(accounts, identifier)
  if (allianceMembers.length > 0) {
    let allianceMemberLevels = []
    for await (const member of allianceMembers) {
      const ign = member
      const level = await getuserlevel(accounts, ign)
      // if (level === null) level = await getuserlevel(accounts, ign)
      allianceMemberLevels.push({ ign: ign, level: level })
    }
    const allianceName = await getuseralliance(accounts, identifier)
    allianceMemberLevels = sortArrayOfObjects(allianceMemberLevels, 'level')
    const timePassed = ((new Date(Date.now()) - timeNow) / 1000)
      .toFixed(2)
      .toString()
    const embed = makeEmbed(allianceName, allianceMemberLevels, timePassed)
    return embed
  } else {
    return notAllianceEmbed
  }
}

function makeEmbed (identifier, data, timePassed) {
  const desc = data.map(player => {
    const ign = escapeMarkdown(player.ign)
    return `**·** **${ign}**: Level **${player.level}**`
  })
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
