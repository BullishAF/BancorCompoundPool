const BCConverter = artifacts.require("BCConverter")
const CTokenMock = artifacts.require("CTokenMock")

const SmartToken = artifacts.require("../bancorContracts/solidity/build/SmartToken")
const BancorNetwork = artifacts.require('../bancorContracts/solidity/build/BancorNetwork');
const BancorConverter = artifacts.require('../bancorContracts/solidity/build/BancorConverter');
const BancorFormula = artifacts.require('../bancorContracts/solidity/build/BancorFormula');
const ContractRegistry = artifacts.require('../bancorContracts/solidity/build/ContractRegistry');
const ContractFeatures = artifacts.require('../bancorContracts/solidity/build/ContractFeatures');
const ERC20Token = artifacts.require('../bancorContracts/solidity/build/ERC20Token');
const BancorConverterFactory = artifacts.require('../bancorContracts/solidity/build/BancorConverterFactory');
const BancorConverterUpgrader = artifacts.require('../bancorContracts/solidity/build/BancorConverterUpgrader');
const BancorConverterRegistry = artifacts.require('../bancorContracts/solidity/build/BancorConverterRegistry');
const BancorConverterRegistryData = artifacts.require('../bancorContracts/solidity/build/BancorConverterRegistryData');

const ContractRegistryClient = require('./helpers/ContractRegistryClient.js');

const chai = require('chai');

const {
  BN, 
  constants,
  expectEvent,
  expectRevert,
} = require('@openzeppelin/test-helpers');

const PREFIX = "VM Exception while processing transaction: ";

contract('BCConverter', (accounts) => {
  before(async () => {

    this.contractRegistry = await ContractRegistry.new();

    this.contractFeatures = await ContractFeatures.new();

    await this.contractRegistry.registerAddress(ContractRegistryClient.CONTRACT_FEATURES, this.contractFeatures.address);

    this.bancorFormula = await BancorFormula.new();
    await this.contractRegistry.registerAddress(ContractRegistryClient.BANCOR_FORMULA, this.bancorFormula.address);

    this.bancorNetwork = await BancorNetwork.new(this.contractRegistry.address);
    await this.contractRegistry.registerAddress(ContractRegistryClient.BANCOR_NETWORK, this.bancorNetwork.address);

    this.factory = await BancorConverterFactory.new();
    await this.contractRegistry.registerAddress(ContractRegistryClient.BANCOR_CONVERTER_FACTORY, this.factory.address);

    this.upgrader = await BancorConverterUpgrader.new(this.contractRegistry.address);
    await this.contractRegistry.registerAddress(ContractRegistryClient.BANCOR_CONVERTER_UPGRADER, this.upgrader.address);
  
    this.converterRegistry = await BancorConverterRegistry.new(this.contractRegistry.address);
    this.converterRegistryData = await BancorConverterRegistryData.new(this.contractRegistry.address);

    await this.contractRegistry.registerAddress(ContractRegistryClient.BANCOR_CONVERTER_REGISTRY, this.converterRegistry.address);
    await this.contractRegistry.registerAddress(ContractRegistryClient.BANCOR_CONVERTER_REGISTRY_DATA, this.converterRegistryData.address);
        
    this.uToken = await ERC20Token.new('multiColateral DAI mock', 'DAI', 18, web3.utils.toWei('2000'));
    this.cToken = await CTokenMock.new('compound DAI mock', 'cDAI', 8, web3.utils.toWei('100000000000000000'),this.uToken.address);
    this.bntToken = await ERC20Token.new('bancor token mock', 'BNT', 18, web3.utils.toWei('2000'));
    this.smartToken = await SmartToken.new("cDAI/DAI Smart Token Relay","DAIBNT",18);

    this.bcConverter = await BCConverter.new(
        this.smartToken.address, 
        this.contractRegistry.address, 
        30000, 
        this.bntToken.address, 
        "500000"
      )

    await this.bcConverter.addReserve(this.uToken.address,this.cToken.address,'500000') 

    await this.uToken.approve(this.bcConverter.address,web3.utils.toWei('20'))
    await this.bntToken.approve(this.bcConverter.address,web3.utils.toWei('200'))

    await this.bcConverter.addReserveBalance(this.uToken.address,web3.utils.toWei('20'))
    await this.bcConverter.addReserveBalance(this.bntToken.address,web3.utils.toWei('200'))

    await this.smartToken.transferOwnership(this.bcConverter.address)
    await this.smartToken.issue(accounts[0],web3.utils.toWei('40'))

    await this.bcConverter.setConversionFee(0)
    await this.bcConverter.acceptTokenOwnership()

    await this.converterRegistry.addConverter(this.bcConverter.address)
  })

  it('Adding liquidity to pool using underlying/BNT', async () => {

    _amount = web3.utils.toWei('20');

    var supply = await this.smartToken.totalSupply()
    var uTokenReserve = await this.bcConverter.getReserveBalance(this.uToken.address)
    var bntReserve = await this.bcConverter.getReserveBalance(this.bntToken.address)
    
    var uTokenVal = await this.bancorFormula.calculateFundCost(supply,uTokenReserve,"1000000",_amount)
    var bntTokenVal = await this.bancorFormula.calculateFundCost(supply,bntReserve,"1000000",_amount)

    await this.cToken.approve(this.bcConverter.address,0)
    await this.uToken.approve(this.bcConverter.address,0)
    await this.bntToken.approve(this.bcConverter.address,0)

    await this.uToken.approve(this.bcConverter.address,uTokenVal)
    await this.bntToken.approve(this.bcConverter.address,bntTokenVal)
    await this.bcConverter.fund(_amount)
  })

  it('Adding liquidity to pool using compound/BNT', async () => {

    _amount = web3.utils.toWei('20');

    var supply = await this.smartToken.totalSupply()
    var cTokenReserve = await this.bcConverter.getReserveBalance(this.cToken.address)
    var bntReserve = await this.bcConverter.getReserveBalance(this.bntToken.address)
    
    var cTokenVal = await this.bancorFormula.calculateFundCost(supply,cTokenReserve,"1000000",_amount)
    var bntTokenVal = await this.bancorFormula.calculateFundCost(supply,bntReserve,"1000000",_amount)

    await this.cToken.approve(this.bcConverter.address,0)
    await this.uToken.approve(this.bcConverter.address,0)
    await this.bntToken.approve(this.bcConverter.address,0)

    await this.cToken.approve(this.bcConverter.address,cTokenVal)
    await this.bntToken.approve(this.bcConverter.address,bntTokenVal)

    await this.bcConverter.fund(_amount)

  })

  it('removing liquidity from pool', async () => {
    await this.bcConverter.liquidate(web3.utils.toWei('5'))
  })

  it('Convert from underlying token to BNT token should fail since no allowance was approved', async () => {
    
    var balance1 = await this.uToken.balanceOf(accounts[0])
    var balance2 = await this.bntToken.balanceOf(accounts[0])

    await this.uToken.approve(this.bancorNetwork.address,'0')
    await expectRevert.unspecified(
        this.bancorNetwork.claimAndConvert2(
          [this.uToken.address, this.smartToken.address, this.bntToken.address],
          web3.utils.toWei('2'),1,
          "0x0000000000000000000000000000000000000000",0
        )
      )

    chai.expect(await this.uToken.balanceOf(accounts[0])).to.be.bignumber.equal(balance1)
    chai.expect(await this.bntToken.balanceOf(accounts[0])).to.be.bignumber.equal(balance2)
  })

  it('Convert from underlying token to BNT token should pass using BancorNetwork claimAndConvert2 function', async () => {
    
    var balance1 = await this.uToken.balanceOf(accounts[0])
    var balance2 = await this.bntToken.balanceOf(accounts[0])

    await this.uToken.approve(this.bancorNetwork.address,web3.utils.toWei('2'))
    await this.bancorNetwork.claimAndConvert2(
        [this.uToken.address, this.smartToken.address, this.bntToken.address],
        web3.utils.toWei('2'),1,
        "0x0000000000000000000000000000000000000000",0
      )

    chai.expect(await this.uToken.balanceOf(accounts[0])).to.be.bignumber.below(balance1)
    chai.expect(await this.bntToken.balanceOf(accounts[0])).to.be.bignumber.above(balance2)
  })

  it('Convert from compound token to BNT token should fail since no allowance was approved to BancorNetwork using claimAndConvert2', async () => {
    
    var balance1 = await this.cToken.balanceOf(accounts[0])
    var balance2 = await this.bntToken.balanceOf(accounts[0])

    await this.cToken.approve(this.bancorNetwork.address,'0')  
    await expectRevert.unspecified(
        this.bancorNetwork.claimAndConvert2(
          [this.cToken.address, this.smartToken.address, this.bntToken.address],
          web3.utils.toWei('2'),1,
          "0x0000000000000000000000000000000000000000",0
        )
      )

    chai.expect(await this.cToken.balanceOf(accounts[0])).to.be.bignumber.equal(balance1)
    chai.expect(await this.bntToken.balanceOf(accounts[0])).to.be.bignumber.equal(balance2)
  })
  
  it('Convert from compound token to BNT token should pass using BancorNetwork claimAndConvert2 function', async () => {
    
    var balance1 = await this.cToken.balanceOf(accounts[0])
    var balance2 = await this.bntToken.balanceOf(accounts[0])

    await this.cToken.approve(this.bancorNetwork.address,web3.utils.toWei('2'))
    await this.bancorNetwork.claimAndConvert2(
        [this.cToken.address, this.smartToken.address, this.bntToken.address],
        web3.utils.toWei('2'),1,
        "0x0000000000000000000000000000000000000000",0
      )

    chai.expect(await this.cToken.balanceOf(accounts[0])).to.be.bignumber.below(balance1)
    chai.expect(await this.bntToken.balanceOf(accounts[0])).to.be.bignumber.above(balance2)

  })

  it('Convert from BNT token to underlying token should fail since no allowance was approved to BancorNetwork using claimAndConvert2', async () => {
    var balance1 = await this.bntToken.balanceOf(accounts[0])
    var balance2 = await this.uToken.balanceOf(accounts[0])

    await this.bntToken.approve(this.bancorNetwork.address,'0')
    await expectRevert.unspecified(
        this.bancorNetwork.claimAndConvert2(
          [this.bntToken.address, this.smartToken.address, this.uToken.address],
          web3.utils.toWei('2'),1,
          "0x0000000000000000000000000000000000000000",0
        )
      )

    chai.expect(await this.bntToken.balanceOf(accounts[0])).to.be.bignumber.equal(balance1)
    chai.expect(await this.uToken.balanceOf(accounts[0])).to.be.bignumber.equal(balance2)
  })

  it('Convert from BNT token to underlying token should pass using BancorNetwork claimAndConvert2 function', async () => {  
    
    var balance1 = await this.bntToken.balanceOf(accounts[0])
    var balance2 = await this.uToken.balanceOf(accounts[0])

    await this.bntToken.approve(this.bancorNetwork.address,web3.utils.toWei('2'))
    await this.bancorNetwork.claimAndConvert2(
        [this.bntToken.address, this.smartToken.address, this.uToken.address],
        web3.utils.toWei('2'),1,
        "0x0000000000000000000000000000000000000000",0
      ) 

    chai.expect(await this.bntToken.balanceOf(accounts[0])).to.be.bignumber.below(balance1)
    chai.expect(await this.uToken.balanceOf(accounts[0])).to.be.bignumber.above(balance2)
  })

  it('Convert from BNT token to compound token should fail since no allowance was approved to BancorNetwork using claimAndConvert2', async () => {
    var balance1 = await this.bntToken.balanceOf(accounts[0])
    var balance2 = await this.cToken.balanceOf(accounts[0])

    await this.bntToken.approve(this.bancorNetwork.address,'0')
    await  expectRevert.unspecified(
        this.bancorNetwork.claimAndConvert2(
          [this.bntToken.address, this.smartToken.address, this.cToken.address],
          web3.utils.toWei('2'),1,
          "0x0000000000000000000000000000000000000000",0
        )
      ) 

    chai.expect(await this.bntToken.balanceOf(accounts[0])).to.be.bignumber.equal(balance1)
    chai.expect(await this.cToken.balanceOf(accounts[0])).to.be.bignumber.equal(balance2)
  })
  
  it('Convert from BNT token to compound token should pass using BancorNetwork claimAndConvert2 function', async () => {
    
    var balance1 = await this.bntToken.balanceOf(accounts[0])
    var balance2 = await this.cToken.balanceOf(accounts[0])

    await this.bntToken.approve(this.bancorNetwork.address,web3.utils.toWei('2'))
    await this.bancorNetwork.claimAndConvert2(
        [this.bntToken.address, this.smartToken.address, this.cToken.address],
        web3.utils.toWei('2'),1,
        "0x0000000000000000000000000000000000000000",0
      )   

    chai.expect(await this.bntToken.balanceOf(accounts[0])).to.be.bignumber.below(balance1)
    chai.expect(await this.cToken.balanceOf(accounts[0])).to.be.bignumber.above(balance2)
  })




  it('Convert from smart token to BNT token using BancorNetwork claimAndConvert2 function', async () => {

    var balance1 = await this.smartToken.balanceOf(accounts[0])
    var balance2 = await this.bntToken.balanceOf(accounts[0])

    await this.smartToken.approve(this.bancorNetwork.address,web3.utils.toWei('2'))
    await this.bancorNetwork.claimAndConvert2(
        [this.smartToken.address, this.smartToken.address, this.bntToken.address],
        web3.utils.toWei('2'),1,
        "0x0000000000000000000000000000000000000000",0
      ) 

    chai.expect(await this.smartToken.balanceOf(accounts[0])).to.be.bignumber.below(balance1)
    chai.expect(await this.bntToken.balanceOf(accounts[0])).to.be.bignumber.above(balance2)  
  })

  it('Convert from smart token to compound token using BancorNetwork claimAndConvert2 function', async () => {

    var balance1 = await this.smartToken.balanceOf(accounts[0])
    var balance2 = await this.cToken.balanceOf(accounts[0])

    await this.smartToken.approve(this.bancorNetwork.address,web3.utils.toWei('2'))
    await this.bancorNetwork.claimAndConvert2(
        [this.smartToken.address, this.smartToken.address, this.cToken.address],
        web3.utils.toWei('2'),1,
        "0x0000000000000000000000000000000000000000",0
      )

    chai.expect(await this.smartToken.balanceOf(accounts[0])).to.be.bignumber.below(balance1)
    chai.expect(await this.cToken.balanceOf(accounts[0])).to.be.bignumber.above(balance2)
  })

  it('Convert from smart token to underlying token using BancorNetwork claimAndConvert2 function', async () => {

    var balance1 = await this.smartToken.balanceOf(accounts[0])
    var balance2 = await this.uToken.balanceOf(accounts[0])

    await this.smartToken.approve(this.bancorNetwork.address,web3.utils.toWei('2'))
    await this.bancorNetwork.claimAndConvert2(
        [this.smartToken.address, this.smartToken.address, this.uToken.address],
        web3.utils.toWei('2'),1,
        "0x0000000000000000000000000000000000000000",0
      )

    chai.expect(await this.smartToken.balanceOf(accounts[0])).to.be.bignumber.below(balance1)
    chai.expect(await this.uToken.balanceOf(accounts[0])).to.be.bignumber.above(balance2) 
  })

  it('Convert from BNT to smart token using BancorNetwork claimAndConvert2 function', async () => {

    var balance1 = await this.bntToken.balanceOf(accounts[0])
    var balance2 = await this.smartToken.balanceOf(accounts[0])

    await this.bntToken.approve(this.bancorNetwork.address,web3.utils.toWei('2'))
    await this.bancorNetwork.claimAndConvert2(
        [this.bntToken.address, this.smartToken.address, this.smartToken.address],
        web3.utils.toWei('2'),1,
        "0x0000000000000000000000000000000000000000",0
      ) 

    chai.expect(await this.bntToken.balanceOf(accounts[0])).to.be.bignumber.below(balance1)
    chai.expect(await this.smartToken.balanceOf(accounts[0])).to.be.bignumber.above(balance2)  
  })

  it('Convert from compound token to smart token using BancorNetwork claimAndConvert2 function', async () => {

    var balance1 = await this.cToken.balanceOf(accounts[0])
    var balance2 = await this.smartToken.balanceOf(accounts[0])

    await this.cToken.approve(this.bancorNetwork.address,web3.utils.toWei('200000000'))
    await this.bancorNetwork.claimAndConvert2(
        [this.cToken.address, this.smartToken.address, this.smartToken.address],
        '200000000',1,
        "0x0000000000000000000000000000000000000000",0
      )   

    chai.expect(await this.cToken.balanceOf(accounts[0])).to.be.bignumber.below(balance1)
    chai.expect(await this.smartToken.balanceOf(accounts[0])).to.be.bignumber.above(balance2)  
  })

  it('Convert from underlying token to smart token using BancorNetwork claimAndConvert2 function', async () => {

    var balance1 = await this.uToken.balanceOf(accounts[0])
    var balance2 = await this.smartToken.balanceOf(accounts[0])

    await this.uToken.approve(this.bancorNetwork.address,web3.utils.toWei('2'))
    await this.bancorNetwork.claimAndConvert2(
        [this.uToken.address, this.smartToken.address, this.smartToken.address],
        web3.utils.toWei('2'),1,
        "0x0000000000000000000000000000000000000000",0
      )

    chai.expect(await this.uToken.balanceOf(accounts[0])).to.be.bignumber.below(balance1)
    chai.expect(await this.smartToken.balanceOf(accounts[0])).to.be.bignumber.above(balance2) 
  })



  it('Convert from underlying token to BNT token should pass using BCConverter convert function', async () => {
    
    var balance1 = await this.uToken.balanceOf(accounts[0])
    var balance2 = await this.bntToken.balanceOf(accounts[0])

    await this.uToken.approve(this.bcConverter.address,web3.utils.toWei('2'))
    await this.bcConverter.convert(
        this.uToken.address, this.bntToken.address,
        web3.utils.toWei('2'),1,
      )

    chai.expect(await this.uToken.balanceOf(accounts[0])).to.be.bignumber.below(balance1)
    chai.expect(await this.bntToken.balanceOf(accounts[0])).to.be.bignumber.above(balance2) 
  })
  
  it('Convert from compound token to BNT token should pass using BCConverter convert function', async () => {

    var balance1 = await this.cToken.balanceOf(accounts[0])
    var balance2 = await this.bntToken.balanceOf(accounts[0])
    
    await this.cToken.approve(this.bcConverter.address,web3.utils.toWei('2'))
    await this.bcConverter.convert(
        this.cToken.address, this.bntToken.address,
        web3.utils.toWei('2'),1
      ) 

    chai.expect(await this.cToken.balanceOf(accounts[0])).to.be.bignumber.below(balance1)
    chai.expect(await this.bntToken.balanceOf(accounts[0])).to.be.bignumber.above(balance2)  
  })

  it('Convert from BNT token to underlying token should pass using BCConverter convert function', async () => {  

    var balance1 = await this.bntToken.balanceOf(accounts[0])
    var balance2 = await this.uToken.balanceOf(accounts[0])

    await this.bntToken.approve(this.bcConverter.address,web3.utils.toWei('2'))
    await this.bcConverter.convert(
        this.bntToken.address, this.uToken.address,
        web3.utils.toWei('2'),1
      ) 

    chai.expect(await this.bntToken.balanceOf(accounts[0])).to.be.bignumber.below(balance1)
    chai.expect(await this.uToken.balanceOf(accounts[0])).to.be.bignumber.above(balance2)
  })

  
  it('Convert from BNT token to compound token should pass using BCConverter convert function', async () => {

    var balance1 = await this.bntToken.balanceOf(accounts[0])
    var balance2 = await this.cToken.balanceOf(accounts[0])

    await this.bntToken.approve(this.bcConverter.address,web3.utils.toWei('2'))
    await this.bcConverter.convert(
        this.bntToken.address, this.cToken.address,
        web3.utils.toWei('2'),1
      ) 

    chai.expect(await this.bntToken.balanceOf(accounts[0])).to.be.bignumber.below(balance1)
    chai.expect(await this.cToken.balanceOf(accounts[0])).to.be.bignumber.above(balance2)
  })

  it('Convert from smart token to BNT token using BCConverter convert function', async () => {

    var balance1 = await this.smartToken.balanceOf(accounts[0])
    var balance2 = await this.bntToken.balanceOf(accounts[0])

    await this.bcConverter.convert(
        this.smartToken.address, this.bntToken.address,
        web3.utils.toWei('2'),1
      ) 

    chai.expect(await this.smartToken.balanceOf(accounts[0])).to.be.bignumber.below(balance1)
    chai.expect(await this.bntToken.balanceOf(accounts[0])).to.be.bignumber.above(balance2)  
  })

  it('Convert from smart token to compound token using BCConverter convert function', async () => {

    var balance1 = await this.smartToken.balanceOf(accounts[0])
    var balance2 = await this.cToken.balanceOf(accounts[0])

    await this.bcConverter.convert(
        this.smartToken.address, this.cToken.address,
        web3.utils.toWei('2'),1
      )

    chai.expect(await this.smartToken.balanceOf(accounts[0])).to.be.bignumber.below(balance1)
    chai.expect(await this.cToken.balanceOf(accounts[0])).to.be.bignumber.above(balance2)   
  })

  it('Convert from smart token to underlying token using BCConverter convert function', async () => {

    var balance1 = await this.smartToken.balanceOf(accounts[0])
    var balance2 = await this.uToken.balanceOf(accounts[0])

    await this.bcConverter.convert(
        this.smartToken.address, this.uToken.address,
        web3.utils.toWei('2'),1
      )

    chai.expect(await this.smartToken.balanceOf(accounts[0])).to.be.bignumber.below(balance1)
    chai.expect(await this.uToken.balanceOf(accounts[0])).to.be.bignumber.above(balance2) 
  })

  it('Convert from BNT to smart token using BCConverter convert function', async () => {

    var balance1 = await this.bntToken.balanceOf(accounts[0])
    var balance2 = await this.smartToken.balanceOf(accounts[0])

    await this.bntToken.approve(this.bcConverter.address,web3.utils.toWei('2'))
    await this.bcConverter.convert(
        this.bntToken.address , this.smartToken.address,
        web3.utils.toWei('2'),1
      )

    chai.expect(await this.bntToken.balanceOf(accounts[0])).to.be.bignumber.below(balance1)
    chai.expect(await this.smartToken.balanceOf(accounts[0])).to.be.bignumber.above(balance2) 
  })

  it('Convert from compound token to smart token using BCConverter convert function', async () => {

    var balance1 = await this.cToken.balanceOf(accounts[0])
    var balance2 = await this.smartToken.balanceOf(accounts[0])

    await this.cToken.approve(this.bcConverter.address,web3.utils.toWei(web3.utils.toWei('2')))
    await this.bcConverter.convert(
        this.cToken.address, this.smartToken.address,
        web3.utils.toWei('2'),1
      )   

    chai.expect(await this.cToken.balanceOf(accounts[0])).to.be.bignumber.below(balance1)
    chai.expect(await this.smartToken.balanceOf(accounts[0])).to.be.bignumber.above(balance2) 
  })

  it('Convert from underlying token to smart token using BCConverter convert function', async () => {

    var balance1 = await this.uToken.balanceOf(accounts[0])
    var balance2 = await this.smartToken.balanceOf(accounts[0])

    await this.uToken.approve(this.bcConverter.address,web3.utils.toWei('2'))
    await this.bcConverter.convert(
        this.uToken.address, this.smartToken.address,
        web3.utils.toWei('2'),1
      )   

    chai.expect(await this.uToken.balanceOf(accounts[0])).to.be.bignumber.below(balance1)
    chai.expect(await this.smartToken.balanceOf(accounts[0])).to.be.bignumber.above(balance2) 
  })

  it('Convert from underlying token to compound using BCConverter convert function', async () => {

    var balance1 = await this.uToken.balanceOf(accounts[0])
    var balance2 = await this.cToken.balanceOf(accounts[0])

    await this.uToken.approve(this.bcConverter.address,web3.utils.toWei('2'))
    await this.bcConverter.convert(
        this.uToken.address, this.cToken.address,
        web3.utils.toWei('2'),1
      )   

    chai.expect(await this.uToken.balanceOf(accounts[0])).to.be.bignumber.below(balance1)
    chai.expect(await this.cToken.balanceOf(accounts[0])).to.be.bignumber.above(balance2) 
  })

  it('Convert from compound token to underlying using BCConverter convert function', async () => {

    var balance1 = await this.cToken.balanceOf(accounts[0])
    var balance2 = await this.uToken.balanceOf(accounts[0])

    await this.cToken.approve(this.bcConverter.address,web3.utils.toWei('0'))
    await this.cToken.approve(this.bcConverter.address,web3.utils.toWei('2'))
    await this.bcConverter.convert(
        this.cToken.address, this.uToken.address,
        web3.utils.toWei('2'),1
      )  
    chai.expect(await this.cToken.balanceOf(accounts[0])).to.be.bignumber.below(balance1)
    chai.expect(await this.uToken.balanceOf(accounts[0])).to.be.bignumber.above(balance2) 

  })
})