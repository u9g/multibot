const mineflayer = require('mineflayer');

class Account {
  constructor (options) {
    this.options = options;
    this.bot = mineflayer.createBot(options);
    this.busy = false;
    this.bot.once('spawn', () => {
      this.bot.chat('/join');
      this.busy = false;
    });
  }

  relog () {
    this.busy = true;
    this.bot.end();
    setTimeout(() => {
      this.bot = mineflayer.createBot(this.options);
      this.bot.once('spawn', () => {
        this.bot.chat('/join');
        this.busy = false;
      });
    }, 5000);
  }

  setBusy () {
    this.busy = true;
  }

  done () {
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
  }

  takeOne () {
    const acc = this.accounts.find(x => x.busy === false);
    if (acc !== undefined) {
      acc.busy = true;
      return acc;
    } else return null;
  }

  status () {
    const isBusy = b => (b ? 'is busy.' : 'is not busy.');
    return this.accounts
      .map((elem, ix) => `${ix}. ${elem.bot.username}: ${isBusy(elem.busy)}`)
      .join('\n');
  }

  toggleBusy (ix) {
    this.accounts[ix].busy = !this.accounts[ix].busy;
  }

  relogAccount (ix) {
    this.accounts[ix].relog();
  }

  takeMany () {
    const SAFE_ACCOUNTS = 1; // # of accounts not used during mass account actions
    const availAccs = this.accounts.filter(x => !x.busy); // accounts ready for mass use
    if (availAccs.length === 0) return null;
    return availAccs.slice(SAFE_ACCOUNTS);
  }
}

module.exports = { Accounts };
