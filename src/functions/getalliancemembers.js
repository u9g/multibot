const regex = {
  onlineMembers: /Online Members: (.+)?/,
  offlineMembers: /Offline Members: (.+)?/,
  foundAlliance: /-+ \[ (.+) \] -+/,
  notFoundAlliance: /\(!\) Unable to find alliance from '.+'/,
  members: /Members: (.+)?/
}

module.exports = (accounts, identifier) => {
  // TODO: add something for if the alliance has the same name as the player's ign
  return new Promise((resolve, reject) => {
    const acc = accounts.takeOne()
    if (acc === null) resolve(null)
    acc.setBusy()
    const bot = acc.bot
    bot.chat(`/a who ${identifier}`)
    const allianceMembers = []
    const onlineMembers = []
    bot.on('message', (msg) => {
      const text = msg.toString()
      if (regex.onlineMembers.test(text)) {
        allianceMembers.push(...makeList(text, regex.onlineMembers))
        onlineMembers.push(...makeList(text, regex.onlineMembers))
      } else if (regex.offlineMembers.test(text)) {
        allianceMembers.push(...makeList(text, regex.offlineMembers))
      } else if (regex.notFoundAlliance.test(text) || text.trim() === 'Usage: /alliance info <alliance/player>') {
        acc.done()
        resolve([])
      } else if (regex.members.test(text)) {
        acc.done()
        resolve({
          all: allianceMembers,
          online: onlineMembers
        })
      }
    })
  })
}

function makeList (srcString, regex) {
  const toReturn = srcString.match(regex)[1]
  return toReturn ? toReturn.split(', ') : ''
}
