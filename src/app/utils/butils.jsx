
import ContractRegistry  from '../../../build/contracts/ContractRegistry.json';
import BancorConverterRegistry from  '../../../build/contracts/BancorConverterRegistry.json';
import ERC20Token  from  '../../../build/contracts/ERC20Token.json';
import BCConverter from '../../../build/contracts/BCConverter.json';
import BancorFormula from '../../../build/contracts/BancorFormula.json';
import BancorNetwork from '../../../build/contracts/BancorNetwork.json';
import SmartToken from '../../../build/contracts/SmartToken.json';
import BigNumber from 'bignumber.js'

import {
  fromDecimals,
  toDecimals,
} from "../utils/eth.jsx";


const MAX_UINT = BigNumber(2).pow(256).minus(1).toString(10);
const CONTRACT_REGISTRY_ADDRESS = "0x2A545c759EB23eA13A1b3354EB76e76cD51ABC72";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";


async function getContractAddress(contractName) {
  let ContractRegistryContract = new window.web3.eth.Contract(ContractRegistry.abi, CONTRACT_REGISTRY_ADDRESS);
  return await ContractRegistryContract.methods.addressOf(window.web3.utils.utf8ToHex(contractName)).call();
}

async function getTokenLightDetails(tokenAddress) {
  return fetchTokenLightData(tokenAddress);
}
  
async function getReturn( path, amount) {
  const web3 = window.web3;
  let bancorNetwork = new web3.eth.Contract(BancorNetwork.abi, await getContractAddress("BancorNetwork"));
  let decimals = await getDecimalsOfToken(path[0])
  // to be updated later to allow all returns.
  let converter = new web3.eth.Contract(BCConverter.abi,"0xFD7b87dCBa411c27417957Aa384F4797abe71ee6");
  amount = toDecimals(amount, await getDecimalsOfToken(path[0]))
  let output = await converter.methods.getReturn(path[0],path[2], amount).call();
  return fromDecimals(output[0], await getDecimalsOfToken(path[path.length-1]))
}

async function getDecimalsOfToken(tokenAddress) {
  const web3 = window.web3;
  const erc20Contract = new web3.eth.Contract(ERC20Token.abi, tokenAddress);
  return await erc20Contract.methods.decimals().call();
}

async function fetchTokenLightData(tokenAddress) {
  const web3 = window.web3;
  let tokenData = {};
  let CurrentToken = new web3.eth.Contract(ERC20Token, tokenAddress);
  tokenData["tokenName"] = await CurrentToken.methods.name().call();
  tokenData["tokenSymbol"] = await CurrentToken.methods.symbol().call();
  tokenData["totalSupply"] = await CurrentToken.methods.totalSupply().call();
  tokenData["tokenDecimals"] = await CurrentToken.methods.decimals().call()
  return tokenData;
}

async function getBalanceOfTokenAndDecimals(tokenAddress) {
  const web3 = window.web3;
  const senderAddress = web3.currentProvider.selectedAddress;
  const erc20Contract = new web3.eth.Contract(ERC20Token.abi, tokenAddress);
  let results= [];
  results[0] = await erc20Contract.methods.balanceOf(senderAddress).call();
  results[1] = await erc20Contract.methods.decimals().call();
  return results;
}

async function convert(path, amount,props) {
  let web3 = window.web3;
  let senderAddress = web3.currentProvider.selectedAddress;

  let erc20from = new web3.eth.Contract(ERC20Token.abi, path[0]);
  let erc20to = new web3.eth.Contract(ERC20Token.abi, path[path.length-1]);

  let decimalsFrom = await erc20from.methods.decimals().call();
  let decimalsTo = await erc20to.methods.decimals().call();

  amount = toDecimals(amount,decimalsFrom)

  let bancorNetworkAddress = await getContractAddress("BancorNetwork");
  let allowance = await erc20from.methods.allowance(senderAddress,bancorNetworkAddress).call();

  if(amount - allowance > 0) {
    if(allowance > 0) try {
      props.convertUpdateAlertMessage("The approved allowance of "+ props.convertReducer.fromToken + " is not enough, it has to be set to zero first.")
      await erc20from.methods.approve(bancorNetworkAddress,0).send({from:senderAddress,gasPrice:20000000000})
    } catch {
      props.convertUpdateAlertMessage("");
      return 0;
    }
    try {
      props.convertUpdateAlertMessage("Please approve the necessary allowance to be spent for "+ props.convertReducer.fromToken + " token.")
      await erc20from.methods.approve(bancorNetworkAddress,MAX_UINT).send({from:senderAddress,gasPrice:20000000000})
    } catch {
      props.convertUpdateAlertMessage("");
      return 0;
    }
  }
  props.convertUpdateAlertMessage("Please confirm the convert transaction");
  let bancorNetwork = new web3.eth.Contract(BancorNetwork.abi, bancorNetworkAddress);
  let output = await bancorNetwork.methods.claimAndConvert2(path, amount, 1, ZERO_ADDRESS, 0).send({from: senderAddress,gasPrice:20000000000})
  props.convertUpdateAlertMessage("");
  return true;
}   

async function isBalanceEnough(token, amount) {
  let web3 = window.web3;
  let senderAddress = web3.currentProvider.selectedAddress;
  let erc20 = new web3.eth.Contract(ERC20Token.abi, token);
  let decimals = await erc20.methods.decimals().call();
  let amountdec = toDecimals(amount,decimals);
  let balance = await erc20.methods.balanceOf(senderAddress).call();

  if(balance-amountdec>=0) return true;
  else return false;
}

async function getInvestOutputs(sm,amount,token1,token2) {
  let web3 = window.web3;
  let senderAddress = web3.currentProvider.selectedAddress;
  let erc20sm = new web3.eth.Contract(SmartToken.abi, sm);
  let erc201 = new web3.eth.Contract(ERC20Token.abi, token1);
  let erc202 = new web3.eth.Contract(ERC20Token.abi, token2);
  let decimalsSm = await erc20sm.methods.decimals().call();
  let smSupply = await erc20sm.methods.totalSupply().call();
  let smAmount = toDecimals(amount,decimalsSm);
  let converter = new web3.eth.Contract(BCConverter.abi, await erc20sm.methods.owner().call())
  let reserveBalance1 = await converter.methods.getReserveBalance(token1).call();
  let reserveBalance2 = await converter.methods.getReserveBalance(token2).call();
  let formula = new web3.eth.Contract(BancorFormula.abi, await getContractAddress("BancorFormula"))
  let reserveAmount1 = await formula.methods.calculateFundCost(smSupply, reserveBalance1,"1000000", smAmount).call();
  let reserveAmount2 = await formula.methods.calculateFundCost(smSupply, reserveBalance2, "1000000", smAmount).call();
  let decimals1 = await erc201.methods.decimals().call();
  let decimals2 = await erc202.methods.decimals().call();
  return [fromDecimals(reserveAmount1,decimals1),fromDecimals(reserveAmount2,decimals2)]
}

async function invest(props) {

  let sm = props.investReducer.poolAddress;
  let amount = props.investReducer.inputVal;
  let token1 = props.investReducer.token1Address;
  let token2 = props.investReducer.token2Address;


  let web3 = window.web3;
  let senderAddress = web3.currentProvider.selectedAddress;

  let erc20sm = new web3.eth.Contract(SmartToken.abi, sm);
  let erc201 = new web3.eth.Contract(ERC20Token.abi, token1);
  let erc202 = new web3.eth.Contract(ERC20Token.abi, token2);

  let decimalsSm = await erc20sm.methods.decimals().call();
  let smSupply = await erc20sm.methods.totalSupply().call();
  let smAmount = toDecimals(amount,decimalsSm);
  let converterAddress = await erc20sm.methods.owner().call();
  let converter = new web3.eth.Contract(BCConverter.abi, converterAddress)
  let reserveBalance1 = await converter.methods.getReserveBalance(token1).call();
  let reserveBalance2 = await converter.methods.getReserveBalance(token2).call();
  let formula = new web3.eth.Contract(BancorFormula.abi, await getContractAddress("BancorFormula"))

  let reserveAmount1 = await formula.methods.calculateFundCost(smSupply, reserveBalance1,"1000000", smAmount).call();
  let reserveAmount2 = await formula.methods.calculateFundCost(smSupply, reserveBalance2, "1000000", smAmount).call();

  let allowance1 = await erc201.methods.allowance(senderAddress,converterAddress).call();
  let allowance2 = await erc202.methods.allowance(senderAddress,converterAddress).call();


  if(reserveAmount1 - allowance1 > 0) {
    if(allowance1 > 0) try {
      props.investUpdateAlertMessage("The approved allowance of "+ props.investReducer.token1 + " is not enough, it has to be set to zero first.")
      await erc201.methods.approve(converterAddress,0).send({from:senderAddress,gasPrice:20000000000})
    } catch {
      props.investUpdateAlertMessage("")
      return 0;
    }
    try {
      props.investUpdateAlertMessage("Please approve the necessary allowance to be spent for "+ props.investReducer.token1 + " token.")
      await erc201.methods.approve(converterAddress,reserveAmount1).send({from:senderAddress,gasPrice:20000000000})
    } catch {
      props.investUpdateAlertMessage("")
      return 0;
    }
  }


  if(reserveAmount2 - allowance2 > 0) {
     if(allowance2 > 0) try {
      props.investUpdateAlertMessage("The approved allowance of "+ props.investReducer.token2 + " is not enough, it has to be set to zero first.")
      await erc202.methods.approve(converterAddress,0).send({from:senderAddress,gasPrice:20000000000})
    } catch {
      props.investUpdateAlertMessage("")
      return 0;
    }
    try {
      props.investUpdateAlertMessage("Please approve the necessary allowance to be spent for "+ props.investReducer.token2 + " token.")
      await erc202.methods.approve(converterAddress,reserveAmount2).send({from:senderAddress,gasPrice:20000000000})
    } catch {
      props.investUpdateAlertMessage("")
      return 0;
    }
  }
  props.investUpdateAlertMessage("Please confirm the invest transaction")
  await converter.methods.fund(smAmount).send({from:senderAddress,gasPrice:20000000000});
  props.investUpdateAlertMessage("")
  return true;
}

async function getLiquidateOutputs(sm,amount,token1,token2) {
  let web3 = window.web3;
  let senderAddress = web3.currentProvider.selectedAddress;
  let erc20sm = new web3.eth.Contract(SmartToken.abi, sm);
  let erc201 = new web3.eth.Contract(ERC20Token.abi, token1);
  let erc202 = new web3.eth.Contract(ERC20Token.abi, token2);
  let decimalsSm = await erc20sm.methods.decimals().call();
  let smSupply = await erc20sm.methods.totalSupply().call();
  let smAmount = toDecimals(amount,decimalsSm);
  let converter = new web3.eth.Contract(BCConverter.abi, await erc20sm.methods.owner().call())
  let reserveBalance1 = await converter.methods.getReserveBalance(token1).call();
  let reserveBalance2 = await converter.methods.getReserveBalance(token2).call();
  let formula = new web3.eth.Contract(BancorFormula.abi, await getContractAddress("BancorFormula"))
  let reserveAmount1 = await formula.methods.calculateLiquidateReturn(smSupply, reserveBalance1,"1000000", smAmount).call();
  let reserveAmount2 = await formula.methods.calculateLiquidateReturn(smSupply, reserveBalance2, "1000000", smAmount).call();
  let decimals1 = await erc201.methods.decimals().call();
  let decimals2 = await erc202.methods.decimals().call();
  return [fromDecimals(reserveAmount1,decimals1),fromDecimals(reserveAmount2,decimals2)]
}

async function liquidate(sm,amount) {

  let web3 = window.web3;
  let senderAddress = web3.currentProvider.selectedAddress;
  let erc20sm = new web3.eth.Contract(SmartToken.abi, sm);
  let decimalsSm = await erc20sm.methods.decimals().call();
  let smAmount = toDecimals(amount,decimalsSm);
  let converterAddress = await erc20sm.methods.owner().call();
  let converter = new web3.eth.Contract(BCConverter.abi, converterAddress);
  await converter.methods.liquidate(smAmount).send({from:senderAddress,gasPrice:20000000000});
  return true;
}

function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

export {
  isEmpty,
  liquidate,
  getLiquidateOutputs,
  invest,
  getInvestOutputs,
  convert,
  isBalanceEnough,
  getContractAddress,
  getBalanceOfTokenAndDecimals,
  getDecimalsOfToken,
  getTokenLightDetails,
  getReturn
}