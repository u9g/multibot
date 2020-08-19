const Discord = require('discord.js');

const allAcountsBusy = () => {
  return new Discord.MessageEmbed()
    .setTitle('All bots busy!')
    .setDescription('Please try again in a few moments!')
    .setColor('RED')
    .setTimestamp();
};

const escapeMarkdown = text => {
  var unescaped = text.replace(/\\(\*|_|`|~|\\)/g, '$1'); // unescape any "backslashed" character
  var escaped = unescaped.replace(/(\*|_|`|~|\\)/g, '\\$1'); // escape *, _, `, ~, \
  return escaped;
};

module.exports = { allAcountsBusy, escapeMarkdown };
