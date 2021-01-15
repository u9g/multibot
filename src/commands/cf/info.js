require('dotenv').config()
const Discord = require('discord.js')
const { numberWithCommas } = require('../../util/discord-helper')

function renderCommand (accounts, name) {
  return new Promise((resolve, reject) => {
    displayData().then(res => {
      resolve(res)
    })
  })
}

async function displayData () {
  const MongoClient = require('mongodb').MongoClient
  const client = new MongoClient(process.env.MONGODB_CF_LOGIN, { useNewUrlParser: true, useUnifiedTopology: true })
  await client.connect()
  const collection = client.db('cfs').collection('s10')
  const countCursor = aggregateCount(collection)
  const count = (await countCursor)[0].winner
  const totalCursor = aggregateTotal(collection)
  const total = (await totalCursor)[0].amount
  client.close()
  const embed = makeEmbed(count, total)
  return embed
}

function aggregateCount (collection) {
  return collection.aggregate([
    { $count: 'winner' }
  ]).toArray()
}

function aggregateTotal (collection) {
  return collection.aggregate([
    {
      $group: {
        _id: '',
        amount: { $sum: '$amount' }
      }
    }, {
      $project: {
        _id: 0,
        amount: '$amount'
      }
    }
  ]).toArray()
}

function makeEmbed (count, total) {
  return new Discord.MessageEmbed()
    .setAuthor('The Cosmic Sky Bot', 'https://i.ibb.co/7WnrkH2/download.png')
    .setTitle('General CF Info')
    .setDescription(`The bot has **${count}** cf's logged.\nIn total, the coinflips were worth: **$${numberWithCommas(total)}**`)
    .setTimestamp()
    .setColor('AQUA')
}

module.exports = { renderCommand }
