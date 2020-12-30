const mineflayer = require('mineflayer');

class Account {
  constructor(options) {
    this.options = options;
    this.bot = mineflayer.createBot(options);
    this.busy = false;
    this.bot.once('spawn', () => {
      this.bot.chat('/join');
      this.busy = false;
    });
    this.bot.on('kicked', (reason) => {
      console.log(reason);
      setTimeout(() => {
        //gave a timeout to maybe fix crash on reboot
        this.relog();
      }, 3000);
    });
  }

  relog() {
    return new Promise((resolve, reject) => {
      this.busy = true;
      this.bot.end();
      setTimeout(() => {
        this.bot = mineflayer.createBot(this.options);
        this.bot.once('spawn', () => {
          this.bot.chat('/join');
          this.busy = false;
          resolve();
        });
      }, 5000);
    });
  }

  setBusy() {
    this.busy = true;
  }

  done() {
    this.bot.removeAllListeners(['message']);
    this.busy = false;
  }
}

class Accounts {
  constructor(logins) {
    this.accounts = logins.map((login) => {
      return new Account({
        username: login[0],
        password: login[1],
        host: 'cosmicsky.com',
      });
    });
  }

  takeOne() {
    const acc = this.accounts.find((x) => !x.busy);
    if (acc !== undefined) {
      acc.setBusy();
      return acc;
    } else return null;
  }

  take(x) {
    return this.accounts[x];
  }

  status() {
    const isBusy = (b) => (b ? 'is busy.' : 'is not busy.');
    return this.accounts
      .map(
        (elem, ix) =>
          `${ix}. ${elem.bot.username || elem.options.username}: ${isBusy(
            elem.busy
          )}`
      )
      .join('\n');
  }

  toggleBusy(ix) {
    this.accounts[ix].busy = !this.accounts[ix].busy;
  }

  relogAccount(ix) {
    this.accounts[ix].relog();
  }

  takeMany() {
    const SAFE_ACCOUNTS = 1; // # of accounts not used during mass account actions
    const availAccs = this.accounts.filter((x) => !x.busy); // accounts ready for mass use
    if (availAccs.length === 0) return null;
    return availAccs.slice(SAFE_ACCOUNTS);
  }

  relogAll() {
    return Promise.all(this.accounts.map((x) => x.relog()));
  }
}

module.exports = { Accounts };
