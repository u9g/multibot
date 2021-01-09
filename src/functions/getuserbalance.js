const { removeCommas } = require('../util/discord-helper')

const regex = {
  balance: /(.+)'s Balance: \$(.+)/,
  playerNotFound: /\(!\) Unable to find online player .+!/
}

module.exports = (accounts, ign) => {
  return new Promise((resolve, reject) => {
    const acc = accounts.takeOne()
    if (acc === null) return null
    acc.setBusy()
    const bot = acc.bot
    bot.chat(`/bal ${ign}`)
    bot.on('message', (msg) => {
      const text = msg.toString()
      if (regex.playerNotFound.test(text)) {
        acc.done()
        return null
      } else if (regex.balance.test(text)) {
        acc.done()
        const [, username, balance] = text.match(regex.balance)
        const noCommasBalance = removeCommas(balance)
        resolve({
          fbalance: balance,
          balance: +noCommasBalance,
          username: username
        })
      }
    })
  })
}
