pragma solidity ^0.4.26;

import "../../bancorContracts/solidity/contracts/token/ERC20Token.sol";
import "../../bancorContracts/solidity/contracts/utility/SafeMath.sol";

contract CTokenMock is ERC20Token {

	using SafeMath for uint;
	using SafeMath for uint256;

	ERC20Token public underlying;
	uint public underlyingDec;
	uint public exchangeRateCurrent= 15;

	constructor(string _name, string _symbol, uint8 _decimals, uint256 _totalSupply,address _underlying) 
	public 
	ERC20Token(_name,_symbol,_decimals,_totalSupply) {

		underlying = ERC20Token(_underlying);
		exchangeRateCurrent = 10000000000;
		underlyingDec = 10**uint(underlying.decimals());
	}


	function mint(uint mintAmount) public returns (uint) {
		underlying.transferFrom(msg.sender,this,mintAmount);
		uint ctokenAmount = mintAmount.mul(underlyingDec).div(exchangeRateCurrent);
		totalSupply = totalSupply.add(ctokenAmount);
		balanceOf[msg.sender]=balanceOf[msg.sender].add(ctokenAmount);
		return 0;
	}
	
	function redeemUnderlying(uint redeemAmount) public returns (uint) {
		uint ctokenAmount = redeemAmount.mul(underlyingDec).div(exchangeRateCurrent);
		balanceOf[msg.sender]=balanceOf[msg.sender].sub(ctokenAmount);
		totalSupply = totalSupply.sub(ctokenAmount);
		require(underlying.transfer(msg.sender,redeemAmount));
		return 0;
	}

	function balanceOfUnderlying(address account) public view returns (uint) {
		return balanceOf[account].mul(exchangeRateCurrent).div(underlyingDec);
	}
}