const fs = require('fs')
const Discord = require('discord.js')
const accountHelper = require('./account-handler')
require('dotenv').config()
const prefix = process.env.DISCORD_PREFIX

const client = new Discord.Client()
client.commands = new Discord.Collection()
// import commands
fs.readdirSync('./commands')
  .filter((file) => file.endsWith('.js'))
  .forEach((file) => {
    const command = require(`./commands/${file}`)
    client.commands.set(command.name, command)
  })

const cooldowns = new Discord.Collection()

const logins = require('../config/accounts.json').accounts
const accounts = new accountHelper.Accounts(logins)

client.once('ready', () => {
  console.log('Ready!')
})

process.on('unhandledRejection', (error) =>
  console.error('Uncaught Promise Rejection', error)
)

client.on('message', (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) return

  const args = message.content.slice(prefix.length).trim().split(/ +/)

  const commandName = args.shift().toLowerCase()

  const command =
    client.commands.get(commandName) ||
    client.commands.find(
      (cmd) => cmd.aliases && cmd.aliases.includes(commandName)
    )

  if (!command) return

  if (!cooldowns.has(message.author.id)) {
    cooldowns.set(message.author.id, new Discord.Collection())
  }

  const now = Date.now()
  const timestamps = cooldowns.get(message.author.id)
  let cooldownAmount = 10000
  if (process.env.DEV) {
    cooldownAmount = 0
  }

  if (timestamps.has(command.name)) {
    const expirationTime = timestamps.get(command.name) + cooldownAmount

    if (now < expirationTime) {
      timestamps.set(command.name, now)
      setTimeout(() => timestamps.delete(command.name), cooldownAmount)

      const timeLeft = (expirationTime - now) / 1000
      return message.reply(
        `please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`
      )
    }
  } else {
    timestamps.set(command.name, now)
    setTimeout(() => timestamps.delete(command.name), cooldownAmount)
  }

  const promiseTimeout = (ms, promise) => {
    // Create a promise that rejects in <ms> milliseconds
    const timeout = new Promise((resolve, reject) => {
      const id = setTimeout(() => {
        clearTimeout(id)
        reject(new Error('Timed out in ' + ms + 'ms.'))
      }, ms)
    })

    // Returns a race between our timeout and the passed in promise
    return Promise.race([
      promise,
      timeout
    ])
  }

  if (command.race) {
    const prom = command.execute(message, args, accounts)
    const timeoutHandler = promiseTimeout(2000, prom)
    timeoutHandler.catch(_ => {
      const embed = message.channel.send(botRestarting)
      accounts.relogAll().then(x => {
        embed.then(msg => msg.delete())
        console.log('bot restarted due to time limit exceeded.')
        setTimeout(() => {
          runCommand(command, message, args)
        }, 1000)
      })
    })
  } else runCommand(command, message, args)
})

function runCommand (command, message, args) {
  try {
    command.execute(message, args, accounts)
  } catch (error) {
    console.error(error)
    client.users.cache.get('424969732932894721').send(error)
    message.channel.send(botRestarting)
    message.reply('there was an error trying to execute that command!')
  }
}

const botRestarting = new Discord.MessageEmbed()
  .setTitle('Bot restarting, your command will be rerun soon.')
  .setColor('YELLOW')
  .setTimestamp()

client.login(process.env.DISCORD_TOKEN)
