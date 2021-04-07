module.exports = {
  name: 'lvl',
  cooldown: 5,
  description: 'Gets discord bot status',
  execute (message, args, accounts) {
    message.channel.send('>lvl has been changed to /lvl, look at https://discord.com/channels/719580500997701684/788838078692851743/825170216501510194 for instructions')
  }
}
