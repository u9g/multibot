const mineflayer = require('mineflayer');

const join = bot => bot.once('spawn', () => bot.chat('/join'));

class Account {
  constructor (options) {
    this.options = options;
    this.bot = mineflayer.createBot(options);
    this.busy = false;
    join(this.bot);
    console.log();
  }

  relog () {
    this.busy = true;
    this.bot.end();
    setTimeout(() => {
      this.bot = mineflayer.createBot(this.options);
      join(this.bot);
      this.busy = false;
    }, 5000);
  }

  return () {
    this.busy = false;
  }
}

class Accounts {
  constructor (logins) {
    this.accounts = logins.map(login => {
      return new Account({
        username: login[0],
        password: login[1],
        host: 'cosmicsky.com'
      });
    });
    console.log('');
  }

  takeOne () {
    const acc = this.accounts.find(x => x.busy === false);
    if (acc !== undefined) {
      acc.busy = true;
      return acc;
    } else return null;
  }
}

module.exports = { Accounts };
