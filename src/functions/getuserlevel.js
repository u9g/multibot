const regex = {
  level: /Level: (\d+) \(\d+ Role Points\)/,
  playerNotFound: /\(!\) Unable to find online player .+!/
}

module.exports = (accounts, ign) => {
  return new Promise((resolve, reject) => {
    const acc = accounts.takeOne()
    if (acc === null) return null
    acc.setBusy()
    const bot = acc.bot
    bot.chat(`/roles ${ign}`)
    bot.on('message', (msg) => {
      const text = msg.toString()
      if (regex.playerNotFound.test(text)) {
        acc.done()
        return null
      }
    })
    bot.on('windowOpen', (window) => {
      const level = +(JSON.parse(window.title).text.match(regex.level)[1])
      resolve(level)
      acc.done()
    })
  })
}
