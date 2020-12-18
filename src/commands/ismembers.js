const Discord = require('discord.js');
const {
  allAcountsBusy,
  escapeMarkdown,
  splitToChunks,
} = require('../util/discord-helper');

module.exports = {
  name: 'ison',
  cooldown: 5,
  aliases: ['ismembers'],
  race: true,
  description: "Get's a player's balance.",
  execute(message, args, accounts) {
    return new Promise((resolve, reject) => {
      const acc = accounts.takeMany();
      acc.forEach((x) => x.setBusy());

      if (acc === null) {
        resolve();
        return message.channel.send(allAcountsBusy());
      }
      if (!args[0]) {
        resolve();
        return message.channel.send(createHelpEmbed());
      }

      const timeNow = new Date(Date.now());
      asyncRunner(acc, args, message).then((x) => {
        const timePassed = ((new Date(Date.now()) - timeNow) / 1000)
          .toFixed(2)
          .toString();
        const embed = makeEmbed(x, timePassed);
        resolve();
        message.channel.send(embed);
        acc.forEach((acc) => acc.done());
      });
    });
  },
};

async function asyncRunner(acc, args, message) {
  // get is members
  const ix = Math.floor(Math.random() * (acc.length - 1)); // acc picked to warp
  const islandMembers = await getIslandPromise(acc[ix], args[0]).catch((_) => {
    // only goes here if alliance name is undefined
    acc.forEach((x) => x.done());
    return message.channel.send(createCantVisitEmbed());
  });
  message.channel.send(makeGrabbingEmbed(islandMembers[0][0]));
  // split members into chunks for individual accs
  const splitMembers = splitToChunks(islandMembers, acc.length);
  const proms = [];
  acc.forEach((elem, ix) => {
    proms.push(getOnlineMembers(elem, splitMembers[ix]));
  });
  const results = await Promise.allSettled(proms);
  // make all arrays into one
  const allPlayers = [];
  results
    .map((promiseResults) => promiseResults.value)
    .forEach((players) => allPlayers.push(...players));
  acc[ix].bot.chat('/is warp pv2');
  return allPlayers;
}

function makeGrabbingEmbed(islandLeader) {
  return new Discord.MessageEmbed()
    .setTitle(`⌛ ${islandLeader}'s island members are being check.`)
    .setColor('BLUE')
    .setTimestamp();
}

function getOnlineMembers(acc, members) {
  const getRank = (ign) => members.find((x) => x[0] === ign)[1];
  return new Promise((resolve, reject) => {
    const regex = {
      online: /\(!\) (.+) is currently online, playing on .+!/,
      offline: /\(!\) No online player found named '(.+)'!/,
    };
    const players = [];

    acc.bot.on('message', (msg) => {
      const ft = msg.toString();
      if (regex.online.test(ft)) {
        const ign = ft.match(regex.online)[1];
        players.push([ign, true, getRank(ign)]);
      } else if (regex.offline.test(ft)) {
        const ign = ft.match(regex.offline)[1];
        players.push([ign, false, getRank(ign)]);
      }
      if (players.length === members.length) {
        resolve(players);
        acc.bot.removeAllListeners(['message']);
      }
    });
    members.forEach((elem, ix) =>
      setTimeout(() => acc.bot.chat(`/find ${elem[0]}`), 250 * ix)
    );
  });
}

const makeDesc = (players) => {
  const str = [];
  const onlineMembers = players.filter((x) => x[1]);
  const offlineMembers = players.filter((x) => !x[1]);
  // online
  if (onlineMembers.length > 0) {
    str.push(`✅ **Online** (**${onlineMembers.length}**):`);
    const onlineStr =
      onlineMembers
        .map((elem) => `- **${escapeMarkdown(elem[0])}** (${elem[2]})`)
        .join('\n') + '\n';
    str.push(onlineStr);
  }

  // offline
  if (offlineMembers.length > 0) {
    str.push(`❎ **Offline** (**${offlineMembers.length}**):`);
    const offlineStr =
      offlineMembers
        .map((elem) => `- **${escapeMarkdown(elem[0])}** (${elem[2]})`)
        .join('\n') + '\n';
    str.push(offlineStr);
  }

  return str.join('\n');
};

function makeEmbed(players, timePassed) {
  const timeString = `✔️ in ${timePassed}s`;
  return new Discord.MessageEmbed()
    .setTitle('Island Info:')
    .setDescription(makeDesc(players))
    .setColor('GREEN')
    .setTimestamp()
    .setFooter(timeString);
}

function getIslandPromise(acc, islandWarpName) {
  const regex = {
    colorCodes: /§./g,
  };

  const botDidntMove = (members) =>
    members &&
    members[0] &&
    members[0].nbt &&
    JSON.parse(members[0].nbt.value.display.value.Name.value).text === 'Pv2';

  const getName = (member) =>
    JSON.parse(member.nbt.value.display.value.Name.value).text;

  const getRank = (item) =>
    item.nbt.value.display.value.Lore.value.value[2].replace(
      regex.colorCodes,
      ''
    );

  return new Promise((resolve, reject) => {
    acc.bot.once('windowOpen', (window) => {
      const didBotMove = botDidntMove(
        window.slots.filter(
          (item) => item != null && item.name === 'player_head'
        )
      );
      if (didBotMove) reject(new Error('Not a valid island.'));
      const members = window.slots
        .filter((item) => item != null && item.name === 'player_head')
        .map((x) => [getName(x), getRank(x)]);
      acc.bot.removeAllListeners(['message']);
      resolve(members);
    });
    acc.bot.chat(`/is warp ${islandWarpName}`);
    setTimeout(() => acc.bot.chat('/is members'), 500);
    // setTimeout(() => acc.bot.chat('/ah'), 600);
  });
}

function createHelpEmbed(Discord) {
  return new Discord.MessageEmbed()
    .setAuthor('The Cosmic Sky Bot', 'https://i.ibb.co/7WnrkH2/download.png')
    .setColor('RED')
    .setTitle('>whosonline [username of warp]');
}

function createCantVisitEmbed() {
  return new Discord.MessageEmbed()
    .setAuthor('The Cosmic Sky Bot', 'https://i.ibb.co/7WnrkH2/download.png')
    .setTitle(
      "❌ Either the person doesn't exist, the person doesn't have a public warp, or the bot is banned from the warp."
    )
    .setColor('RED');
}
