const Discord = require('discord.js');
const {
  allAcountsBusy,
  removeCommas,
  numberWithCommas,
  escapeMarkdown
} = require('../util/discord-helper');

module.exports = {
  name: 'abalance',
  cooldown: 5,
  aliases: ['abal'],
  description: "Get's a player's balance.",
  execute (message, args, accounts) {
    const acc = accounts.takeMany();
    acc.forEach(x => x.setBusy());

    if (acc === null) {
      return message.channel.send(allAcountsBusy());
    }
    if (!args[0]) {
      return message.channel.send(createHelpEmbed());
    }

    asyncRunner(acc, args, message).then(embed => {
      message.channel.send(embed);
      acc.forEach(acc => acc.done());
    });
  }
};

async function asyncRunner (acc, args, message) {
  const alliance = await tryIslandInfo(acc, 0, args[0]).catch(_ => {
    // only goes here if alliance name is undefined
    acc.forEach(x => x.done());
    return message.channel.send(createNotAllianceEmbed());
  });
  const approxTime = Math.ceil(alliance.members.length / acc.length) * 100;
  message.channel.send(`Please wait ${approxTime / 1000} seconds.`);
  // split the members into an array of members for each account
  const splitMembers = splitToChunks(alliance.members, acc.length);
  // request balances on alts
  const proms = [];
  acc.forEach((acc, ix) => {
    proms.push(getBalances(acc, splitMembers[ix]));
  });
  const results = await Promise.allSettled(proms);
  // make all arrays into one
  const allPlayers = [];
  results
    .map(promiseResults => promiseResults.value)
    .forEach(players => allPlayers.push(...players));
  // remove commas
  allPlayers.forEach(x => (x.balance = removeCommas(x.balance)));
  return makeEmbed(allPlayers, alliance.name);
}

function makeEmbed (players, name) {
  const sorted = sortBalances(players);
  const total = players.reduce((a, b) => a + +b.balance, 0);
  console.log(`Total: ${total}`);
  const desc = sorted.map((elem, ix) => {
    const ign = escapeMarkdown(elem.username);
    const bal = numberWithCommas(elem.balance);
    return `${ix + 1}. **${ign}**: $${bal}`;
  });
  return new Discord.MessageEmbed()
    .setTitle(`${name}'s balance`)
    .setDescription(desc + `\n\n**Total**: $${total}`)
    .setColor('GREEN')
    .setTimestamp();
}

const sortBalances = players => players.sort((a, b) => b.balance - a.balance);

function getBalances (acc, splitMembers) {
  return new Promise((resolve, reject) => {
    const balance = /(.+)'s Balance: \$(.+)/;
    const makePlayer = ([, username, balance]) => ({
      username,
      balance
    });

    const players = [];

    acc.bot.on('message', msg => {
      const ft = msg.toString();
      if (balance.test(ft)) {
        const player = makePlayer(ft.match(balance));
        players.push(player);
        if (players.length === splitMembers.length) resolve(players);
      }
    });
    splitMembers.forEach((elem, ix) => {
      setTimeout(() => acc.bot.chat(`/bal ${elem}`), 100 * ix);
    });
  });
}
function createNotAllianceEmbed () {
  return new Discord.MessageEmbed()
    .setAuthor('The Cosmic Sky Bot', 'https://i.ibb.co/7WnrkH2/download.png')
    .setColor('PURPLE')
    .setTitle(
      "❌ Either the alliance requested doesn't exist or the user doesn't have an alliance."
    );
}

function rejectAfterTimeout (timeout) {
  return new Promise((resolve, reject) =>
    setTimeout(() => reject(new Error('Request timed out')), timeout)
  );
}

function tryIslandInfo (acc, ix, island) {
  return new Promise((resolve, reject) => {
    const firstAcc = acc[ix];
    raceAllianceName(firstAcc, island)
      .then(res => resolve(res))
      .catch(err => {
        if (err === 'Invalid alliance name.') {
          reject(err);
        } else {
          firstAcc.relog();
          if (acc.length === ix - 1) {
            tryIslandInfo(acc, 0, island);
          } else {
            tryIslandInfo(acc, ix + 1, island);
          }
        }
      });
  });
}

function raceAllianceName (acc, allianceName) {
  return new Promise((resolve, reject) => {
    Promise.race([
      getAlliancePromise(acc, allianceName),
      rejectAfterTimeout(5000)
    ])
      .then(res => resolve(res))
      .catch(reason => reject(reason.message));
  });
}

function splitToChunks (array, parts) {
  const result = [];
  for (let i = parts; i > 0; i--) {
    result.push(array.splice(0, Math.ceil(array.length / i)));
  }
  return result;
}

function getAlliancePromise (acc, allianceName) {
  const getAllianceName = fullText => fullText.match(regex.allianceName)[1];
  const regex = {
    members: /.+ Members: (.+)/,
    allianceName: /----------- \[ (.+) \] -----------/
  };

  let showingAllianceMembers = false;
  const alliance = {};

  return new Promise((resolve, reject) => {
    acc.bot.on('message', msg => {
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

function createHelpEmbed () {
  return new Discord.MessageEmbed()
    .setAuthor('The Cosmic Sky Bot', 'https://i.ibb.co/7WnrkH2/download.png')
    .setColor('PURPLE')
    .setTitle('>abal [alliance name / username]');
}
