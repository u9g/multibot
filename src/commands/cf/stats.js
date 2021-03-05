require('dotenv').config()
const Discord = require('discord.js')
const { numberWithCommas, escapeMarkdown, addReduce } = require('../../util/discord-helper')

async function renderCommand (message, ign) {
  const args = message.content.split(' ')
  if (!args[2]) message.channel.send('Command format: `>cf stats <name>`')
  else {
    const embed = await displayData(args[2])
    message.channel.send(embed)
  }
}

async function displayData (ign) {
  const MongoClient = require('mongodb').MongoClient
  const client = new MongoClient(process.env.MONGODB_CF_LOGIN, { useNewUrlParser: true, useUnifiedTopology: true })
  await client.connect()
  const collection = client.db('cfs').collection('s11')
  const recentDataCursor = aggregateUser(collection, ign)
  const recent = await recentDataCursor
  // done with db
  client.close()
  const embed = makeEmbed(recent, ign)
  return embed
}

function aggregateUser (collection, ign) {
  return collection.aggregate([
    {
      $match: {
        $or: [
          { winner: ign },
          { loser: ign }
        ]
      }
    }
  ]).toArray()
}

function makeEmbed (recent, ign) {
  const smallRecent = JSON.parse(JSON.stringify(recent)).splice(0, 5)
  if (smallRecent.length === 0) {
    return new Discord.MessageEmbed()
      .setAuthor('The Cosmic Sky Bot', 'https://i.ibb.co/7WnrkH2/download.png')
      .setTitle(`${ign}'s CF stats`)
      .setDescription('No data found')
      .setColor('AQUA')
      .setTimestamp()
  }
  const recentCfs = smallRecent.map(cf => {
    // decide if its a winning cf
    let won = false
    if (cf.winner === ign) {
      won = true
    }
    // consts
    const amt = numberWithCommas(cf.amount)
    ign = escapeMarkdown(ign)
    const other = escapeMarkdown((won ? cf.loser : cf.winner))
    // return
    if (won) {
      return `**${ign}** won **$${amt}** against **${other}**`
    } else {
      return `**${ign}** lost **$${amt}** against **${other}**`
    }
  }).join('\n')

  const desc = recentCfs // + '\n\n' + `**Average CF**: **__$${numberWithCommas(average)}__**`

  const average = getAverage(recent)
  const [winStreak, loseStreak] = getStreaks(recent, ign)
  const [wins, losses] = getWLRatio(recent, ign)
  const ratio = ((wins / (wins + losses)) * 100).toFixed(0) + '%'
  const [won, lost, change, sign] = getTotalAmountWonLost(recent, ign)

  const fields = [
    { name: 'Average CF', value: `$${numberWithCommas(average)}`, inline: true },
    { name: 'Win Streak', value: `${winStreak} wins`, inline: true },
    { name: 'Loss Streak', value: `${loseStreak} losses`, inline: true },
    { name: 'Wins to Losses', value: `${wins}:${losses} (${ratio})`, inline: true },
    { name: 'Money Gained', value: `$${numberWithCommas(won.toFixed(2))}`, inline: true },
    { name: 'Money Lost', value: `$${numberWithCommas(lost.toFixed(2))}`, inline: true },
    { name: 'Money Gained / Lost', value: `${sign}$${numberWithCommas(change.toFixed(2))}`, inline: true }
  ]

  return new Discord.MessageEmbed()
    .setAuthor('The Cosmic Sky Bot', 'https://i.ibb.co/7WnrkH2/download.png')
    .setTitle(`${ign}'s CF stats`)
    .setDescription(desc)
    .setColor('AQUA')
    .setTimestamp()
    .addFields(fields)
}

function getAverage (recent) {
  const amounts = recent.map(x => x.amount)
  return (addReduce(amounts) / recent.length).toFixed(2)
}

function getStreaks (recent, ign) {
  const decideWin = (winner, ign) => ign === winner

  let maxWinStreak = 0
  let maxLossStreak = 0
  let currStreak = 0
  let currStreakType = ''
  for (let i = 0; i < recent.length; i++) {
    const cf = recent[i]
    const win = decideWin(cf.winner, ign)
    if (currStreakType === '') currStreakType = win

    if (win && currStreakType) {
      // do nothing
    } else if (win && !currStreakType) {
      if (currStreak > maxLossStreak) {
        maxLossStreak = currStreak
      }
      currStreak = 0
      currStreakType = win
    } else if (!win && currStreakType) {
      if (currStreak > maxWinStreak) {
        maxWinStreak = currStreak
      }
      currStreak = 0
      currStreakType = win
    } else if (!win && !currStreakType) {
      // do nothing
    }
    currStreak++

    if (recent.length - 1 === i) {
      if (currStreakType) {
        if (currStreak > maxWinStreak) {
          maxWinStreak = currStreak
        }
      } else {
        if (currStreak > maxLossStreak) {
          maxLossStreak = currStreak
        }
      }
    }
  }
  return [maxWinStreak, maxLossStreak]
}

function getWLRatio (recent, ign) {
  let w = 0
  let l = 0
  const wins = recent.map(x => (x.winner === ign))
  wins.forEach(x => ((x) ? w++ : l++))
  return [w, l]
}

function getTotalAmountWonLost (recent, ign) {
  const wins = recent.map(x => {
    x.win = (x.winner === ign)
    return x
  })
  let amtWon = 0
  let amtLost = 0
  wins.forEach(x => {
    if (x.win) amtWon += x.amount
    else amtLost += x.amount
  })
  let change = amtWon - amtLost
  let sign = ''
  if (Math.sign(change) === -1) {
    sign = '-'
  } else {
    sign = '+'
  }
  change = Math.abs(change)
  return [amtWon, amtLost, change, sign]
}
module.exports = { renderCommand }
