const regex = {
  allies: /Allies: (.+)?/,
  truces: /Truces: (.+)?/,
  foundAlliance: /-+ \[ (.+) \] -+/,
  notFoundAlliance: /\(!\) Unable to find alliance from '.+'/,
  members: /Members: (.+)?/
}

module.exports = (accounts, identifier) => {
  // TODO: add something for if the alliance has the same name as the player's ign
  return new Promise((resolve, reject) => {
    const acc = accounts.takeOne()
    if (acc === null) return null
    acc.setBusy()
    const bot = acc.bot
    bot.chat(`/a who ${identifier}`)
    const truces = []
    const allies = []
    bot.on('message', (msg) => {
      const text = msg.toString()
      if (regex.truces.test(text) && !text.includes('Pending')) {
        truces.push(...makeList(text, regex.truces))
      } else if (regex.allies.test(text) && !text.includes('Pending')) {
        allies.push(...makeList(text, regex.allies))
      } else if (regex.notFoundAlliance.test(text) || text.trim() === 'Usage: /alliance info <alliance/player>') {
        acc.done()
        resolve([])
      } else if (regex.members.test(text)) {
        if (!text.includes('Online') && !text.includes('Offline')) {
          acc.done()
          resolve({
            truces: truces,
            allies: allies
          })
        }
      }
    })
  })
}

function makeList (srcString, regex) {
  const toReturn = srcString.match(regex)[1]
  return toReturn ? toReturn.split(', ') : ''
}
