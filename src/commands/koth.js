module.exports = {
  name: 'koth',
  cooldown: 5,
  description: 'Gets discord bot status',
  execute (message, args, accounts) {
    message.channel.send('**>koth** is **permanently disabled** because it is bannable for me to have it.')
  }
}
