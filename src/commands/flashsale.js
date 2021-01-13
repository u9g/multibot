const Discord = require('discord.js')
const { allAcountsBusy, getLore, getTitle } = require('../util/discord-helper')

module.exports = {
  name: 'flashsale',
  cooldown: 5,
  race: true,
  aliases: ['slotsleft', 'fs'],
  description: "Get's a player's balance.",
  execute (message, args, accounts) {
    const acc = accounts.takeOne()

    if (acc === null) {
      return message.channel.send(allAcountsBusy)
    }

    renderCommand(acc.bot).then(embed => {
      message.channel.send(embed)
      acc.done()
    })
  }
}

const regex = {
  rollsLeft: /Spins Left: (\d+).+/
}

function renderCommand (bot) {
  return new Promise((resolve, reject) => {
    bot.chat('/slot')
    bot.on('windowOpen', (window) => {
      const infoItem = window.slots.find(x => x.slot === 18)
      const lore = getLore(infoItem)
      const slotbotItem = window.slots.find(x => x.slot === 27)
      const itemTitle = getTitle(slotbotItem)
      const itemCount = slotbotItem.count
      if (infoItem.name === 'lime_stained_glass_pane') {
        const rollsLeft = getSlotRollsLeft(lore)
        resolve(createActiveEmbed(itemTitle, rollsLeft, itemCount))
      } else if (infoItem.name === 'red_stained_glass_pane') {
        resolve(createInactiveEmbed(itemTitle))
      }
      bot.chat('/bma')
    })
  })
}

function createActiveEmbed (itemName, rollsLeft, itemCount) {
  const item = (itemCount > 1) ? `${itemName} (${itemCount}x)` : itemName
  const desc = `**${item}** has **${rollsLeft}** slot spins left.`
  return new Discord.MessageEmbed()
    .setAuthor('The Cosmic Sky Bot', 'https://i.ibb.co/7WnrkH2/download.png')
    .setColor('AQUA')
    .setTitle('Flashsale: :white_check_mark:')
    .setDescription(desc)
}

function createInactiveEmbed (nextTime) {
  return new Discord.MessageEmbed()
    .setAuthor('The Cosmic Sky Bot', 'https://i.ibb.co/7WnrkH2/download.png')
    .setColor('AQUA')
    .setTitle('Flashsale: ❌')
    .setDescription('**' + nextTime + '**')
}

function getSlotRollsLeft (lore) {
  return lore.match(regex.rollsLeft)[1]
}
