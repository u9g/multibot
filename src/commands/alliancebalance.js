const Discord = require('discord.js');
const {
  allAcountsBusy,
  removeCommas,
  numberWithCommas,
  escapeMarkdown,
  splitToChunks,
} = require('../util/discord-helper');

module.exports = {
  name: 'abal',
  cooldown: 5,
  aliases: ['abalance'],
  race: true,
  description: "Get's a player's balance.",
  execute(message, args, accounts) {
    return new Promise((resolve, reject) => {
      const acc = accounts.takeMany();
      acc.forEach((x) => x.setBusy());

      if (acc === null) {
        message.channel.send(allAcountsBusy());
        resolve();
      }
      if (!args[0]) {
        message.channel.send(createHelpEmbed());
        resolve();
      }
      asyncRunner(acc, args, message).then((embed) => {
        if (embed !== null) {
          message.channel.send(embed);
          resolve();
          acc.forEach((acc) => acc.done());
        } else {
          resolve();
        }
      });
    });
  },
};

function rejectAfterTimeout(timeout) {
  return new Promise((resolve, reject) =>
    setTimeout(() => reject(new Error('Request timed out')), timeout)
  );
}

async function asyncRunner(acc, args, message) {
  const timeNow = new Date(Date.now());
  let alliance;
  try {
    alliance = await getAlliancePromise(acc[0], args[0]);
  } catch (e) {
    // only goes here if alliance name is undefined which would happen if there are no accounts
    // acc.forEach((x) => x.done());
    return allAcountsBusy;
  }
  const approxTime = Math.ceil(alliance.members.length / acc.length) * 100;
  message.channel.send(`Please wait ${approxTime / 1000} seconds.`);
  // split the members into an array of members for each account
  const splitMembers = splitToChunks(alliance.members, acc.length);
  // request balances on alts
  const proms = [];
  acc.forEach((elem, ix) => {
    const acc = splitMembers[ix];
    try {
      proms.push(
        Promise.race([getBalances(elem, acc), rejectAfterTimeout(2000)])
      );
    } catch (err) {
      console.log(err);
    }
  });
  const results = await Promise.allSettled(proms);
  // make all arrays into one
  const allPlayers = [];
  results
    .map((promiseResults) => promiseResults.value)
    .forEach((players) => allPlayers.push(...players));
  // remove commas
  allPlayers.forEach((x) => (x.balance = removeCommas(x.balance)));
  const timePassed = ((new Date(Date.now()) - timeNow) / 1000)
    .toFixed(2)
    .toString();
  return makeEmbed(allPlayers, alliance.name, timePassed);
}

function makeEmbed(players, name, timePassed) {
  const sorted = sortBalances(players);
  const total = numberWithCommas(
    players.reduce((a, b) => a + +b.balance, 0).toFixed(2)
  );
  const desc = sorted
    .map((elem, ix) => {
      const ign = escapeMarkdown(elem.username);
      const bal = numberWithCommas(elem.balance);
      return `${ix + 1}. **${ign}**: $${bal}`;
    })
    .join('\n');
  const timeString = `✔️ in ${timePassed}s`;
  return new Discord.MessageEmbed()
    .setTitle(`${name}'s balance`)
    .setDescription(desc + `\n\n**Total**: $${total}`)
    .setColor('GREEN')
    .setTimestamp()
    .setFooter(timeString);
}

const sortBalances = (players) => players.sort((a, b) => b.balance - a.balance);

function getBalances(acc, splitMembers) {
  return new Promise((resolve, reject) => {
    if (splitMembers.length === 0) resolve([]);
    const balance = /(.+)'s Balance: \$(.+)/;
    const makePlayer = ([, username, balance]) => ({
      username,
      balance,
    });

    const players = [];

    acc.bot.on('message', (msg) => {
      const ft = msg.toString();
      if (balance.test(ft)) {
        const player = makePlayer(ft.match(balance));
        players.push(player);
        if (players.length === splitMembers.length) {
          resolve(players);
          acc.bot.removeAllListeners(['message']);
        }
      }
    });
    splitMembers.forEach((elem, ix) => {
      setTimeout(() => acc.bot.chat(`/bal ${elem}`), 100 * ix);
    });
  });
}
function createNotAllianceEmbed() {
  return new Discord.MessageEmbed()
    .setAuthor('The Cosmic Sky Bot', 'https://i.ibb.co/7WnrkH2/download.png')
    .setColor('RED')
    .setTitle(
      "❌ Either the alliance requested doesn't exist or the user doesn't have an alliance."
    );
}

function getAlliancePromise(acc, allianceName) {
  const getAllianceName = (fullText) => fullText.match(regex.allianceName)[1];
  const regex = {
    members: /.+ Members: (.+)/,
    allianceName: /----------- \[ (.+) \] -----------/,
  };

  let showingAllianceMembers = false;
  const alliance = {};

  return new Promise((resolve, reject) => {
    acc.bot.on('message', (msg) => {
      const ft = msg.toString();
      if (
        ft.startsWith('(!) Unable to find alliance from') ||
        ft === 'Usage: /alliance info <alliance/player>'
      ) {
        reject(new Error('Invalid alliance name.'));
      } else if (regex.allianceName.test(ft)) {
        // showing alliance name
        alliance.name = getAllianceName(ft);
        // about to list alliance members
        showingAllianceMembers = true;
        alliance.members = [];
      } else if (ft.includes('Enemies: ')) {
        // finished listing alliance members
        showingAllianceMembers = false;
        resolve(alliance);
        // ask for member balances
      } else if (showingAllianceMembers) {
        // listing alliance members (online/offline members)
        if (regex.members.test(ft)) {
          const membersList = ft.match(regex.members)[1].split(', ');
          alliance.members = alliance.members.concat(membersList);
        }
      }
    });
    acc.bot.chat(`/a who ${allianceName}`);
  });
}

function createHelpEmbed() {
  return new Discord.MessageEmbed()
    .setAuthor('The Cosmic Sky Bot', 'https://i.ibb.co/7WnrkH2/download.png')
    .setColor('RED')
    .setTitle('>abal [alliance name / username]');
}
