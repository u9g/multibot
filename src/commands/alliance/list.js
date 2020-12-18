const Discord = require('discord.js');
const {} = require('../../util/discord-helper');

const regex = {
  startMessage: /-.+Alliance List \(\d+ \/ \d+\) -+/,
  alliance: /(.+) \((\d+) \/ (\d+) online\)/,
};

function renderCommand(accounts) {
  return new Promise((resolve, reject) => {
    const acc = accounts.takeOne();
    if (acc === null) {
      resolve(allAcountsBusy());
    }
    const bot = acc.bot;
    bot.chat('/a list');

    let showingPlayers = false;
    const players = [];

    bot.on('message', (msg) => {
      const ft = msg.toString();
      if (regex.startMessage.test(ft)) {
        showingPlayers = true;
      } else if (showingPlayers && regex.alliance.test(ft)) {
        const name = ft.match(regex.alliance)[1];
        const online = ft.match(regex.alliance)[2];
        const offline = ft.match(regex.alliance)[3];
        players.push([name, online, offline]);
      } else if (showingPlayers && !regex.alliance.test(ft)) {
        showingPlayers = false;
        acc.done();
        resolve(embed(players));
      }
    });
  });
}

const embed = (players) =>
  new Discord.MessageEmbed()
    .setTitle('Alliance List')
    .setDescription(
      players
        .map((elem, ix) => `(\`${elem[1]}/${elem[2]}\`) **${elem[0]}**`)
        .join('\n')
    )
    .setTimestamp();

module.exports = { renderCommand };
