const Discord = require('discord.js')
const { sortArrayOfObjects, escapeMarkdown, getTimePassed } = require('../../util/discord-helper')
const getalliancemembers = require('../../functions/getalliancemembers')
const getfriendlyalliances = require('../../functions/getfriendlyalliances')
const getuseralliance = require('../../functions/getuseralliance')

function renderCommand (accounts, identifier) {
  return new Promise((resolve, reject) => {
    asyncRunner(accounts, identifier).then(embed => resolve(embed))
  })
}

async function asyncRunner (accounts, identifier) {
  const timeNow = new Date(Date.now())
  const currAllianceName = await getuseralliance(accounts, identifier)
  if (currAllianceName !== 'N/A') { // 'N/A' if the alliance doesn't exist
    const friendlyAlliances = await getfriendlyalliances(accounts, identifier)
    const totalFrendlies = friendlyAlliances.truces.length + friendlyAlliances.allies.length
    if (totalFrendlies > 0) {
      // gather data about the friendly alliances
      let truces = await countFriendliesInList(accounts, friendlyAlliances, 'truces')
      let allies = await countFriendliesInList(accounts, friendlyAlliances, 'allies')
      // sort the friendly alliances by online players
      truces = sortArrayOfObjects(truces, 2)
      allies = sortArrayOfObjects(allies, 2)
      // get info about the alliance that the user gave
      const currAllianceInfo = await getalliancemembers(accounts, identifier)
      const currAlliance = [currAllianceName, [currAllianceInfo.all.length, currAllianceInfo.online.length]]
      const timePassed = getTimePassed(timeNow)
      const embed = makeEmbed(truces, allies, currAlliance, timePassed)
      return embed
    } else { // no truces / allies
      // get info about the alliance that the user gave
      const currAllianceInfo = await getalliancemembers(accounts, identifier)
      const currAlliance = [currAllianceName, [currAllianceInfo.all.length, currAllianceInfo.online.length]]
      const timePassed = getTimePassed(timeNow)
      const embed = makeEmbed([], [], currAlliance, timePassed)
      return embed
    }
  } else {
    return notAllianceEmbed
  }
}

async function countFriendliesInList (accounts, friendlies, type) {
  // type is allies/truces because frendlies item contains both and needs to be seperated
  // gets the # of online and total members of the alliance
  const arr = []
  for await (const alliance of friendlies[type]) {
    const allianceInfo = await getalliancemembers(accounts, alliance)
    arr.push([alliance, allianceInfo.all.length, allianceInfo.online.length])
  }
  return arr
}

function makeEmbed (truces, allies, currAlliance, timePassed) {
  const currAllianceDesc = `**·** **${currAlliance[0]}**: \`${currAlliance[1][1]} / ${currAlliance[1][0]}\``
  let trucesDesc = ''
  if (truces.length > 0) {
    trucesDesc = truces.map(alliance => {
      const name = escapeMarkdown(alliance[0])
      return `**·** **${name}**: \`${alliance[2]} / ${alliance[1]}\``
    }).join('\n')
    trucesDesc = '\n\n' + '**Truces**:' + '\n' + trucesDesc
  }
  let alliesDesc = ''
  if (allies.length > 0) {
    alliesDesc = allies.map(alliance => {
      const name = escapeMarkdown(alliance[0])
      return `**·** **${name}**: \`${alliance[2]} / ${alliance[1]}\``
    }).join('\n')
    alliesDesc = '\n\n' + '**Allies**:' + '\n' + alliesDesc
  }

  const totals = total(truces, allies, currAlliance)
  const totalDesc = `**TOTAL**: **__${totals[1]} / ${totals[0]}__**`
  const desc = currAllianceDesc + trucesDesc + alliesDesc + '\n\n' + totalDesc
  const timeString = `(online / total) | ✔️ in ${timePassed}s`
  return new Discord.MessageEmbed()
    .setAuthor('The Cosmic Sky Bot', 'https://i.ibb.co/7WnrkH2/download.png')
    .setTitle(`Number of players ${currAlliance[0]} has:`)
    .setColor('AQUA')
    .setDescription(desc)
    .setTimestamp()
    .setFooter(timeString)
}

const total = (truces, allies, currAlliance) => {
  // reduces makes the arrays go from [1,2,3] => 6
  const totalTruces = reduce(truces.map(alliance => alliance[1]))
  const totalOnlineTruces = reduce(truces.map(alliance => alliance[2]))
  const totalAllies = reduce(allies.map(alliance => alliance[1]))
  const totalOnlineAllies = reduce(allies.map(alliance => alliance[2]))
  // gets the number of players in total & alliance for the alliance given by user
  const curr = currAlliance[1][0]
  const currOnline = currAlliance[1][1]
  return [(totalTruces + totalAllies + curr), (totalOnlineTruces + totalOnlineAllies + currOnline)]
}

const reduce = (arr) => {
  const reducer = (accumulator, currentValue) => accumulator + currentValue
  const count = 0
  if (arr.length === 0) {
    return count
  } else {
    return arr.reduce(reducer)
  }
}

const notAllianceEmbed = new Discord.MessageEmbed()
  .setAuthor('The Cosmic Sky Bot', 'https://i.ibb.co/7WnrkH2/download.png')
  .setTitle("This alliance doesn't exist, that player doesn't have an alliance, or that player doesn't exist")
  .setColor('AQUA')
  .setTimestamp()

module.exports = { renderCommand }
