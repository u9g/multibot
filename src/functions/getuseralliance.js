const foundAlliance = /-+ \[ (.+) \] -+/
const notFoundAlliance = /\(!\) Unable to find alliance from '.+'/

module.exports = (accounts, identifier) => {
  // TODO: add something for if the alliance has the same name as the player's ign
  return new Promise((resolve, reject) => {
    const acc = accounts.takeOne()
    if (acc === null) resolve(null)
    acc.setBusy()
    const bot = acc.bot
    bot.chat(`/a who ${identifier}`)
    bot.on('message', (msg) => {
      const text = msg.toString()
      if (foundAlliance.test(text)) {
        acc.done()
        resolve(msg.toString().match(foundAlliance)[1])
      } else if (notFoundAlliance.test(text) || text.trim() === 'Usage: /alliance info <alliance/player>') {
        acc.done()
        resolve('N/A')
      }
    })
  })
}
