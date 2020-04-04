const BCConverter = artifacts.require("BCConverter")
const SmartToken = artifacts.require("SmartToken")
const ContractRegistery = artifacts.require("IContractRegistry")
const IERC20Token = artifacts.require("IERC20Token")
const IBancorConverterRegistry = artifacts.require("IBancorConverterRegistry")
const IBancorNetwork = artifacts.require("IBancorNetwork")
const ICToken = artifacts.require("ICToken")

module.exports = async function(deployer, network, accounts) {
	if(network === "external") {

    if( process.argv.indexOf('--bancorContractRegistery')==-1 || 
      process.argv.indexOf('--uToken')==-1 ||
      process.argv.indexOf('--cToken')==-1 ||
      process.argv.indexOf('--bntReserveBalance')==-1 ||
      process.argv.indexOf('--bntReserveRatio')==-1 ||
      process.argv.indexOf('--underlyingReserveBalance')==-1 ||
      process.argv.indexOf('--underlyingReserveRatio')==-1 ||
      process.argv.indexOf('--conversionFee')==-1 ||
      process.argv.indexOf('--initialSmarTokenBalance')==-1 ) {
        throw (Error("  - A mandatory argument is missing, please check project README for moredetails."));
    }

    var contractRegisteryAddress = process.argv[process.argv.indexOf('--bancorContractRegistery')+1]
    var uTokenAddress = process.argv[process.argv.indexOf('--uToken')+1]
    var cTokenAddress = process.argv[process.argv.indexOf('--cToken')+1]
    var bntReserveBalance = process.argv[process.argv.indexOf('--bntReserveBalance')+1]
    var bntReserveRatio = process.argv[process.argv.indexOf('--bntReserveRatio')+1]
    var uReserveBalance = process.argv[process.argv.indexOf('--underlyingReserveBalance')+1]
    var uReserveRatio = process.argv[process.argv.indexOf('--underlyingReserveRatio')+1]
    var conversionFee = process.argv[process.argv.indexOf('--conversionFee')+1]
    var initialSmarTokenBalance = process.argv[process.argv.indexOf('--initialSmarTokenBalance')+1]

    var promisesArray = []
    var contractsList = {}
    var smartTokenSymbol

  	promisesArray.push(IERC20Token.at(uTokenAddress))
  	promisesArray.push(ICToken.at(cTokenAddress))

  	promisesValues = await Promise.all(promisesArray)

  	var uToken = promisesValues[0]
  	var cToken = promisesValues[1]

  	uTokenSymbol = await uToken.symbol()
  	cTokenSymbol = await cToken.symbol()

  	smartTokenSymbol = uTokenSymbol + "BNT" 
  	smartTokenName = cTokenSymbol + "/" + uTokenSymbol + " Smart Token Relay"

  	console.log("\t- Deploying SmartToken contract ...")
  	await deployer.deploy(SmartToken,smartTokenName,smartTokenSymbol,18).then(async () => {

  		console.log("\t- Loading ContractRegistery ...")
  		var contractRegistery = await ContractRegistery.at(contractRegisteryAddress)

  		console.log("\t- Querying contract addresses ...")
  		promisesArray = []
  		promisesArray.push(contractRegistery.addressOf(web3.utils.toHex("BNTToken")))
  		promisesArray.push(contractRegistery.addressOf(web3.utils.toHex("BancorConverterRegistry")))
  		promisesArray.push(contractRegistery.addressOf(web3.utils.toHex("BancorNetwork")))
  		promisesValues = await Promise.all(promisesArray)

  		console.log("\t- Loading necessary tokens and contracts ...")
  		promisesArray = []

  		promisesArray.push(IERC20Token.at(promisesValues[0]))
  		promisesArray.push(IBancorConverterRegistry.at(promisesValues[1]))
  		promisesArray.push(IBancorNetwork.at(promisesValues[2]))
  		promisesValues = await Promise.all(promisesArray)

  		var bntToken = promisesValues[0]
  		var bancorConverterRegistry = promisesValues[1]
  		var bancorNetwork = promisesValues[2]

  		console.log("\t- Deploying BCConverter contract ...")
  		var smartToken = await SmartToken.deployed()
	  	var deployerPromise = deployer.deploy(
	  		BCConverter, 
	  		smartToken.address, 
	  		contractRegisteryAddress, 
	  		conversionFee, 
	  		bntToken.address, 
	  		bntReserveRatio
	  	)
  		await deployerPromise

		  console.log("\t- Loading deployed contract ...")
  		var bcConverter = await BCConverter.deployed()
  		
  		console.log("\t- Adding underlying/compound token as reserve ...")
  		console.log("\t- Approving reserve balances ...")
  		console.log("\t- Transfer reserve balances to BCConverter contract ...")
  		console.log("\t- SmartToken ownership transfer ...")

  		promisesArray = []
  		promisesArray.push(bcConverter.addReserve(uToken.address,cToken.address,uReserveRatio))		
  		promisesArray.push(uToken.approve(bcConverter.address,uReserveBalance))
  		promisesArray.push(bntToken.approve(bcConverter.address,bntReserveBalance))
  		await Promise.all(promisesArray)

  		promisesArray = []
  		promisesArray.push(bcConverter.addReserveBalance(uToken.address,uReserveBalance))
  		promisesArray.push(bcConverter.addReserveBalance(bntToken.address,bntReserveBalance))
  		promisesArray.push(smartToken.transferOwnership(bcConverter.address))
    	await Promise.all(promisesArray)

  		console.log("\t- Issuing smart tokens ...")
  		console.log("\t- Setting conversion fee ...")
  		console.log("\t- SmartToken ownership approval ...")		

  		promisesArray = []
  		promisesArray.push(smartToken.issue(accounts[0],(initialSmarTokenBalance)))
  		promisesArray.push(bcConverter.setConversionFee(conversionFee))
  		await Promise.all(promisesArray)

  		promisesArray = []
  		promisesArray.push(bcConverter.acceptTokenOwnership(),{gasPrice:5000000000})

  		await Promise.all(promisesArray)

  		console.log("\t- Adding converter to registery ...")
  		await bancorConverterRegistry.addConverter(bcConverter.address,{gasPrice:5000000000})
  		console.log("\t- Deployment ended")

	  	return deployerPromise;
  	})
  }
};
