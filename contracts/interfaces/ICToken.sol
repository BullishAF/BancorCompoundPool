pragma solidity ^0.4.26;

import "../../bancorContracts/solidity/contracts/token/interfaces/IERC20Token.sol";

contract ICToken is IERC20Token {
	address public underlying;
	function mint(uint mintAmount) external returns (uint);
	function mint() external payable returns (uint);
	function exchangeRateCurrent() external view returns (uint);
	function redeem(uint redeemTokens) external returns (uint);
	function redeemUnderlying(uint redeemAmount) external returns (uint);
	function borrow(uint borrowAmount) external returns (uint);
	function balanceOfUnderlying(address account) external view returns (uint);
}