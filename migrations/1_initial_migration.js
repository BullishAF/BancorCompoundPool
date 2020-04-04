
const Migrations = artifacts.require("Migrations");

module.exports = function(deployer, network) {
  if(network === "ropsten")
  	deployer.deploy(Migrations);
};


