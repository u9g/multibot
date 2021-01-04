const Discord = require('discord.js')

const allAcountsBusy = new Discord.MessageEmbed()
  .setTitle('All bots busy!')
  .setDescription('Please try again in a few moments!')
  .setColor('RED')
  .setTimestamp()

const escapeMarkdown = (text) => {
  const unescaped = text.replace(/\\(\*|_|`|~|\\)/g, '$1') // unescape any "backslashed" character
  const escaped = unescaped.replace(/(\*|_|`|~|\\)/g, '\\$1') // escape *, _, `, ~, \
  return escaped
}

const removeCommas = (x) => x.replace(/,/g, '')

const numberWithCommas = (x) => {
  return x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ',')
}

function splitToChunks (array, parts) {
  const result = []
  for (let i = parts; i > 0; i--) {
    result.push(array.splice(0, Math.ceil(array.length / i)))
  }
  return result
}

const fetchEmoji = (emojiWanted, client) => {
  const myEmojiServer = '661701980036661308'
  const guild = client.guilds.cache.find((guild) => guild.id === myEmojiServer)
  const emoji = guild.emojis.cache.find((emoji) => emoji.name === emojiWanted)
  return emoji
}

module.exports = {
  allAcountsBusy,
  escapeMarkdown,
  removeCommas,
  numberWithCommas,
  splitToChunks,
  fetchEmoji
}
