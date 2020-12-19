const Discord = require('discord.js');
const { allAcountsBusy, escapeMarkdown } = require('../../util/discord-helper');

const regex = {
  allianceName: /-+ \[ (.+) \] -+/,
  onlineMembers: /Online Members: (.+)?/,
  offlineMembers: /Offline Members: (.+)?/,
  allies: /Allies: (.+)?/,
  truces: /Truces: (.+)?/,
  notAlliance: /\(\!\) Unable to find alliance from '.+'/,
};

function renderCommand(accounts, name) {
  return new Promise((resolve, reject) => {
    const acc = accounts.takeOne();
    if (acc === null) {
      resolve(allAcountsBusy());
    }
    const bot = acc.bot;
    bot.chat('/a who ' + name);

    const alliance = {};

    bot.on('message', (msg) => {
      const ft = msg.toString();
      console.log(ft);
      if (regex.allianceName.test(ft)) {
        alliance.name = ft.match(regex.allianceName)[1];
      } else if (regex.onlineMembers.test(ft)) {
        alliance.online = makeList(ft, regex.onlineMembers);
      } else if (regex.offlineMembers.test(ft)) {
        alliance.offline = makeList(ft, regex.offlineMembers);
      } else if (regex.truces.test(ft)) {
        alliance.truces = makeList(ft, regex.truces);
      } else if (regex.allies.test(ft)) {
        alliance.allies = makeList(ft, regex.allies);
        acc.done();
        resolve(embed(alliance));
      } else if (
        regex.notAlliance.test(ft) ||
        ft.trim() === 'Usage: /alliance info <alliance/player>'
      ) {
        acc.done();
        resolve(notAllianceEmbed);
      }
    });
  });
}

function makeList(srcString, regex) {
  const toReturn = srcString.match(regex)[1];
  return toReturn ? toReturn.split(', ') : '';
}

const embed = (alliance) => {
  const desc =
    '**Online Members**: ' +
    makeString(alliance.online) +
    '\n\n**Offline Members**: ' +
    makeString(alliance.offline) +
    '\n\n**Allies**: ' +
    makeString(alliance.allies) +
    '\n\n**Truces**: ' +
    makeString(alliance.truces);
  return new Discord.MessageEmbed()
    .setTitle(`${alliance.name} Info`)
    .setAuthor('The Cosmic Sky Bot', 'https://i.ibb.co/7WnrkH2/download.png')
    .setDescription(desc)
    .setColor('AQUA')
    .setTimestamp();
};

const notAllianceEmbed = new Discord.MessageEmbed()
  .setAuthor('The Cosmic Sky Bot', 'https://i.ibb.co/7WnrkH2/download.png')
  .setColor('AQUA')
  .setTitle("That alliance doesn't exist.")
  .setTimestamp();

function makeString(list) {
  let string = '';
  if (list && list.length >= 1) {
    string = list.map((x) => escapeMarkdown(x)).join(', ');
  } else {
    string = '';
  }
  return string;
}

module.exports = { renderCommand };
