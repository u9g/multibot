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

const removeCommas = x => x.replace(/,/g, '');

const numberWithCommas = x => {
  return x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ',');
};

function splitToChunks (array, parts) {
  const result = [];
  for (let i = parts; i > 0; i--) {
    result.push(array.splice(0, Math.ceil(array.length / i)));
  }
  return result;
}

module.exports = {
  allAcountsBusy,
  escapeMarkdown,
  removeCommas,
  numberWithCommas,
  splitToChunks
};
