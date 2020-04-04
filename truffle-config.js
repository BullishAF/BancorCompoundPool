
const HDWalletProvider = require("@truffle/hdwallet-provider");

if(process.argv.indexOf('--network')!=-1) {
  providedNetwork = process.argv[process.argv.indexOf('--network')+1]
  if(providedNetwork==="external" ) {
    if( process.argv.indexOf('--privateKey')==-1 || 
        process.argv.indexOf('--httpProvider')==-1 ) {
        throw (Error("A mandatory argument is missing, please check project README for details"));
    }
    var privateKey = process.argv[process.argv.indexOf('--privateKey')+1]
    var httpProviderAddress = process.argv[process.argv.indexOf('--httpProvider')+1]
  }
}

options = {
  networks: {
    external: {
      skipDryRun: true,
      provider: () => new HDWalletProvider(privateKey, httpProviderAddress, 0, 1),
      network_id: "*", // match any network
      networkCheckTimeout: 200000,
    },
    test: {
      skipDryRun: true,
      host: "127.0.0.1",
      port: 8545,
      network_id: "*", // match any network
      gasPrice: 20000000000,
      networkCheckTimeout: 200000,
    }
  },
  compilers: {
    solc: {
      version: "0.4.26",
      settings: {
        optimizer: {
          enabled: true,
          runs: 2000
        }
      }
    }
  }
}

let reporterArg = process.argv.indexOf('--report');
if (reporterArg !== -1) {
  options['mocha'] = {
    reporter: 'eth-gas-reporter',
    reporterOptions : {
      currency: 'USD',
      excludeContracts: ['Migrations'],
      url: httpProviderAddress
    }
  }
}

module.exports = options;