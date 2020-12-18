const Discord = require('discord.js');
const {
  allAcountsBusy,
  removeCommas,
  numberWithCommas,
  escapeMarkdown,
  splitToChunks,
} = require('../util/discord-helper');

module.exports = {
  name: 'istop',
  cooldown: 5,
  race: true,
  description: 'Gets either the top 15 players or the given page of level top.',
  execute(message, args, accounts) {
    //x
    const emojiNext = '➡'; // unicode emoji are identified by the emoji itself
    const emojiPrevious = '⬅';
    const emojiX = '❌';
    const reactionArrow = [emojiPrevious, emojiNext, emojiX];
    const time = 60000 * 2; // time limit: 2 min
    const boundaries = [1, 20];

    function filter(reaction, user) {
      return !user.bot && reactionArrow.includes(reaction.emoji.name); // check if the emoji is inside the list of emojis, and if the user is not a bot
    }

    function onCollect(emoji, message, i, bot) {
      if (emoji.name === emojiPrevious && i > boundaries[0]) {
        const newIx = i - 1;
        renderCommand(bot, newIx).then((embed) => {
          message.edit(embed);
        });
        i--;
      } else if (emoji.name === emojiNext && i < boundaries[1]) {
        const newIx = i + 1;
        renderCommand(bot, newIx).then((embed) => {
          message.edit(embed);
        });
        i++;
      }
      return i;
    }

    function createCollectorMessage(message, author, acc, firstPageIx) {
      const bot = acc.bot;
      let i = firstPageIx;
      const collector = message.createReactionCollector(filter, { time });
      collector.on('collect', (r) => {
        const reactingUser = r.users.cache.find((x) => !x.bot);
        if (reactingUser === author) {
          i = onCollect(r.emoji, message, i, bot);
          message.reactions.removeAll();
          if (r.emoji.name == emojiX) {
            collector.stop();
            //do nothing after clearing emojis
          } else if (i === boundaries[0]) {
            message
              .react(emojiNext)
              .then((msgReaction) => msgReaction.message.react(emojiX));
          } else if (i === boundaries[1]) {
            message
              .react(emojiPrevious)
              .then((msgReaction) => msgReaction.message.react(emojiX));
          } else {
            message
              .react(emojiPrevious)
              .then((msgReaction) => msgReaction.message.react(emojiNext))
              .then((msgReaction) => msgReaction.message.react(emojiX));
          }
        }
      });
      collector.on('end', (collected) => {
        message.reactions.removeAll();
        acc.done();
      });
    }

    function sendList(channel, author, acc, firstPage) {
      getFirstPage(acc.bot, firstPage).then((embed) => {
        if (firstPage === boundaries[0]) {
          channel
            .send(embed)
            .then((msg) => msg.react(emojiNext))
            .then((msgReaction) => msgReaction.message.react(emojiX))
            .then((msgReaction) =>
              createCollectorMessage(
                msgReaction.message,
                author,
                acc,
                firstPage
              )
            );
        } else if (firstPage === boundaries[1]) {
          channel
            .send(embed)
            .then((msg) => msg.react(emojiPrevious))
            .then((msgReaction) => msgReaction.message.react(emojiX))
            .then((msgReaction) =>
              createCollectorMessage(
                msgReaction.message,
                author,
                acc,
                firstPage
              )
            );
        } else {
          channel
            .send(embed)
            .then((msg) => msg.react(emojiPrevious))
            .then((msgReaction) => msgReaction.message.react(emojiNext)) //last page so no next
            .then((msgReaction) => msgReaction.message.react(emojiX))
            .then((msgReaction) =>
              createCollectorMessage(
                msgReaction.message,
                author,
                acc,
                firstPage
              )
            );
        }
      });
    }

    return new Promise((resolve, reject) => {
      //get account
      const acc = accounts.takeOne();
      //if there is no account
      if (acc === null) {
        message.channel.send(allAcountsBusy());
        resolve();
      } else if (isNaN(args[1])) {
        sendList(message.channel, message.author, acc, 1);
      } else {
        sendList(message.channel, message.author, acc, +args[1]);
      }
    });
  },
};

function getFirstPage(bot, i) {
  return new Promise((resolve, reject) => {
    renderCommand(bot, i).then((x) => resolve(x));
  });
}

function renderCommand(bot, page) {
  return new Promise((resolve, reject) => {
    const regex = {
      start: /Top Player Islands \(\d+\/\d+\)/,
      user: /\d+. (?:\[.+] )?(.+) \(Level (\d+)\)/,
    };

    const timeNow = new Date(Date.now());
    const players = [];
    let showingPeople = false;
    bot.chat(`/is top ${page}`);

    bot.on('message', (msg) => {
      const ft = msg.toString();
      if (regex.start.test(ft)) {
        showingPeople = true;
      } else if (showingPeople && regex.user.test(ft)) {
        const [, ign, level] = ft.match(regex.user);
        players.push([ign, level]);
        if (players.length === 15) {
          showingPeople = false;
          const timePassed = ((new Date(Date.now()) - timeNow) / 1000)
            .toFixed(2)
            .toString();
          const embed = createEmbed(players, page, timePassed);
          bot.removeAllListeners(['message']);
          resolve(embed);
        }
      }
    });
  });
}

function createEmbed(info, page, timePassed) {
  const desc = createDescription(info, page);
  const timeString = `✔️ in ${timePassed}s`;
  const title =
    page > 1
      ? `Top Player Islands (${page} / 20)`
      : 'Top Player Islands (1 / 20)';
  return new Discord.MessageEmbed()
    .setAuthor('The Cosmic Sky Bot', 'https://i.ibb.co/7WnrkH2/download.png')
    .setTitle(title)
    .setDescription(desc)
    .setColor('PURPLE')
    .setFooter(timeString)
    .setTimestamp();
}

const createDescription = (players, page) => {
  return players
    .map((user, ix) => {
      let [ign, lvl] = user;
      ign = escapeMarkdown(ign);
      if (page == 1) {
        page = 0;
      }
      return `${15 * page + ix + 1}. **${ign}** has island level **${lvl}**`;
    })
    .join('\n');
};
