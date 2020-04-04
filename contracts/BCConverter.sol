
pragma solidity ^0.4.26;

import "../bancorContracts/solidity/contracts/token/interfaces/IERC20Token.sol";
import "../bancorContracts/solidity/contracts/converter/BancorConverter.sol";

import "./interfaces/ICToken.sol";


contract BCConverter is BancorConverter {

    uint constant MAX_UINT = 2**256 - 1;

    mapping(address => ICToken) public uTokens2cTokens;
    mapping(address => IERC20Token) public cTokens2uTokens;

    constructor(
        ISmartToken _token,
        IContractRegistry _registry,
        uint32 _maxConversionFee,
        IERC20Token _reserveToken,
        uint32 _reserveRatio
    ) 
        BancorConverter(
            _token,
            _registry,
            _maxConversionFee,
            _reserveToken,
            _reserveRatio
        )
        public
    {

    }

    // Overloading the addReseve function to add the compound token for a given underlying token

    /**
      * @dev all compound tokens going to be listed should be passed through this function with their underlying token.
      * 
      * @param _uToken    undelying token used by compound cToken
      * @param _cToken    compound token contract address of the underlying token
      * @param _ratio     constant reserve ratio, represented in ppm, 1-1000000
      * 
    */

    function addReserve(IERC20Token _uToken ,IERC20Token _cToken, uint32 _ratio)
        public
        ownerOnly
        inactive
        validAddress(_cToken)
        notThis(_cToken)
        validReserveRatio(_ratio)
    {
        addReserve(_cToken,_ratio);

        // adding uToken to reserve without adding its ratio to the total ratio amount 
        // since both tokens are represented by the same asset at any time
        // allowing both tokens to be swapped
        ICToken cToken = ICToken(_cToken);
        IERC20Token uToken = IERC20Token(cToken.underlying());
        require(uToken == _uToken);

        cTokens2uTokens[cToken] = uToken;
        uTokens2cTokens[uToken] = cToken;

        require(address(uToken) != address(token) && !reserves[uToken].isSet); // validate input
        reserves[uToken].ratio = _ratio;
        reserves[uToken].isVirtualBalanceEnabled = false;
        reserves[uToken].virtualBalance = 0;
        reserves[uToken].isSaleEnabled = true;
        reserves[uToken].isSet = true;
        uToken.approve(address(cToken),MAX_UINT);
    }

    /**
      * @dev This function approves the underlying token used as reserve to be spent by the compound tokens contracts
      * it is most likely to not be called, since apporval of the underlying token is set max_uint for the compound token
      * it is just a safety measure.
      * 
    */

    function approveTokensToCompound() public {
        for (uint16 i = 0; i < reserveTokens.length; i++) {
            IERC20Token reserveToken = reserveTokens[i];
            IERC20Token uToken = cTokens2uTokens[reserveToken];
            if(address(uToken) != address(0x0)) uToken.approve(reserveToken,MAX_UINT);
        }
    } 

    /**
      * @dev This function aims to automate the minting of coumpound tokens when adding its underlying tokens to the reserve
      * It allow also the deposit of any reserve token, user should first approve the ERC20 transer.
      * 
      * @param _reserveToken  token address
      * @param _amount    token amount to be deposited
      * 
    */

    function addReserveBalance(IERC20Token _reserveToken, uint _amount) 
        public
        ownerOnly
        validReserve(_reserveToken)
        inactive
    {
        ensureTransferFrom(_reserveToken, msg.sender, this, _amount);
    }

    /**
      * @dev returns the converted value of an underlying amount in compound to compound tokens value
      * 
      * @param _uToken    underlying token address used as asset in compound token contract
      * @param _cToken    compound token contract address of the underlying token
      * @param _uAmount   underlying amount to convert
      * 
      * @return converted underlying amount
    */

    function uAmount2cAmount(IERC20Token _uToken, ICToken _cToken, uint _uAmount) public view returns(uint) {
        return _uAmount.mul(10**uint(_uToken.decimals())).div(_cToken.exchangeRateCurrent());
    }

    /**
      * @dev returns the converted value of a compound token to its underlying token value
      * 
      * @param _cToken    compound token contract address of the underlying token 
      * @param _uToken    underlying token address used as asset in compound token contract
      * @param _cAmount   compound token amount to convert
      * 
      * @return converted compound token amount
    */

    function cAmount2uAmount(ICToken _cToken, IERC20Token _uToken, uint _cAmount) public view returns(uint) {
        return _cAmount.mul(_cToken.exchangeRateCurrent()).div(10**uint(_uToken.decimals()));
    }

    /**
      * @dev returns the reserve's balance following the token address, if the token is an underlying token
      * is hold by compound ctoken contract.
      * note that prior to version 17, you should use 'getConnectorBalance' instead
      * 
      * @param _reserveToken    reserve token contract address
      * 
      * @return reserve balance
    */
    function getReserveBalance(IERC20Token _reserveToken)
        public
        view
        validReserve(_reserveToken)
        returns (uint256)
    {
        ICToken cToken = uTokens2cTokens[_reserveToken];

        if (address(cToken) == address(0x0))  {
            return _reserveToken.balanceOf(this);
        }
        else {
            return cToken.balanceOfUnderlying(this);        
        }
    }
     
    // ensureTransferFrom was modified to mint or redeem compound tokens balance in some specific cases: 
    // - If _token is an underlying token, with its compound token set in uTokens2cTokens mapping:
    //   - When transfering it outside of the contract, the needed value should be first redeemed then transfered.
    //   - Following bancor flow, if someone calls any conversion functions implemented in this contract the tokens should 
    //     be transfered to BancorNetwork without no minting or redeem.
    //   - When the underlying tokens are deposited to the contract, that same balance is converted to compound through "mint"
    // - If _token is not an underlying token but its compound token or another token listed in the reserve the reimplemented 
    //   function will behave the same as the implemented function in the inherited contract.

    // The function was changed to return a value that is being transfered due to "Truncation-Related Issues" as mentioned in 
    // https://blog.openzeppelin.com/compound-audit/, a truncation always happens when minting/redeeming tokens due to compound
    // implementation, meaning that if you mint x amount and redeem the total amount in the same transaction the value returned
    // is slightly lower than the initial amount used to mint cTokens. This issue is making the amount return by compound when
    // redeeming tokens not predictable (by a very small value)

    function ensureTransferFrom(IERC20Token _token, address _from, address _to, uint256 _amount) private {

        // We must assume that functions `transfer` and `transferFrom` do not return anything,
        // because not all tokens abide the requirement of the ERC20 standard to return success or failure.
        // This is because in the current compiler version, the calling contract can handle more returned data than expected but not less.
        // This may change in the future, so that the calling contract will revert if the size of the data is not exactly what it expects.

        uint prevBalance = _token.balanceOf(_to);
        uint nextBalance;
        ICToken cToken = uTokens2cTokens[_token];

        if(cToken==address(0))
        {
            if (_from == address(this)) INonStandardERC20(_token).transfer(_to, _amount);
            else INonStandardERC20(_token).transferFrom(_from, _to, _amount);
            nextBalance = _token.balanceOf(_to);
        } 
        else 
        {
            if (_from == address(this)) 
            {
                require(cToken.redeemUnderlying(_amount)==0,"compound redeem error"); 
                INonStandardERC20(_token).transfer(_to,_amount);
                nextBalance = _token.balanceOf(_to);
               
            }
            else 
            {
                INonStandardERC20(_token).transferFrom(_from, _to, _amount);
                nextBalance = _token.balanceOf(_to);
                if(_to == address(this)) require(cToken.mint(_amount)==0,"compound mint error");
            }
        }

        require(nextBalance.sub(prevBalance)>0,"transfe error");
        
    }

    // Disable upgrade since this converter contract is different than normal bancorConverter
    // to enable it bancor upgrader contract has to take this logic into account, please note
    // that this procedure was done to avoid any possible issue with the asset held by the contract.

    function upgrade() public ownerOnly {

    }

    // Funding will accept underlying tokens or their corresponding compound tokens plus any other token listed as a reserve

    function fund(uint256 _amount)
        public
        multipleReservesOnly
    {
        uint256 supply = token.totalSupply();
        IBancorFormula formula = IBancorFormula(addressOf(BANCOR_FORMULA));

        // iterate through the reserve tokens and transfer a percentage equal to the ratio between _amount
        // and the total supply in each reserve from the caller to the converter
        for (uint16 i = 0; i < reserveTokens.length; i++) {

            IERC20Token reserveToken;
            
            uint256 reserveBalance;
            uint256 reserveAmount;
            
            reserveToken = reserveTokens[i];
            
            // ---------------------------------------------------------------------//
            // changed reserveToken.balanceOf(this) to getReserveBalance(reserveToken)
            // ---------------------------------------------------------------------//
            reserveBalance = getReserveBalance(reserveToken);
            reserveAmount = formula.calculateFundCost(supply, reserveBalance, totalReserveRatio, _amount);

            // ---------------------------------------------------------------------//
            // first check of the user approve enough compound tokens to the contract
            // if not we switch to the underlying token since a user can aprove either
            // ones-----------------------------------------------------------------//
            // ---------------------------------------------------------------------//
            IERC20Token uToken = cTokens2uTokens[reserveToken];
            if( uToken != address(0) ) 
            {
                if( reserveToken.allowance(msg.sender,this) < reserveAmount || reserveToken.balanceOf(msg.sender) < reserveAmount) {
                    reserveToken = uToken;
                    reserveBalance = getReserveBalance(reserveToken);
                    reserveAmount = formula.calculateFundCost(supply, reserveBalance, totalReserveRatio, _amount);
                }
            }

            Reserve storage reserve = reserves[reserveToken];
            // transfer funds from the caller in the reserve token
            ensureTransferFrom(reserveToken, msg.sender, this, reserveAmount);

            // dispatch price data update for the smart token/reserve
            emit PriceDataUpdate(reserveToken, supply + _amount, reserveBalance +reserveAmount, reserve.ratio);
        }

        // issue new funds to the caller in the smart token
        token.issue(msg.sender, _amount);
    }

    // Liquidate will only return underlying tokens, in the opposite of funding function that accepts both underlying and 
    // compound tokens

    function liquidate(uint256 _amount)
        public
        multipleReservesOnly
    {
        uint256 supply = token.totalSupply();
        IBancorFormula formula = IBancorFormula(addressOf(BANCOR_FORMULA));

        // destroy _amount from the caller's balance in the smart token
        token.destroy(msg.sender, _amount);

        // iterate through the reserve tokens and send a percentage equal to the ratio between _amount
        // and the total supply from each reserve balance to the caller
        IERC20Token reserveToken;
        uint256 reserveBalance;
        uint256 reserveAmount;
        for (uint16 i = 0; i < reserveTokens.length; i++) {
            reserveToken = reserveTokens[i];

            // ---------------------------------------------------------------------//
            // if the reserve token is cToken switch it to its corresponding underlying
            // ---------------------------------------------------------------------//
            IERC20Token uToken = cTokens2uTokens[reserveToken];
            if(uToken != address(0)) reserveToken = uToken;

            // ---------------------------------------------------------------------//
            // changed reserveToken.balanceOf(this) to getReserveBalance(reserveToken)
            // ---------------------------------------------------------------------//
            reserveBalance = getReserveBalance(reserveToken);
            reserveAmount = formula.calculateLiquidateReturn(supply, reserveBalance, totalReserveRatio, _amount);

            Reserve storage reserve = reserves[reserveToken];

            // transfer funds to the caller in the reserve token
            ensureTransferFrom(reserveToken, this, msg.sender, reserveAmount);

            // dispatch price data update for the smart token/reserve
            emit PriceDataUpdate(reserveToken, supply - _amount, reserveBalance - reserveAmount, reserve.ratio);
        }
    }


    // ----------------------------------------------------------------------------------------------------------------- //
    // ----------------------------------------------------------------------------------------------------------------- //
    // ----------------------------------------------------------------------------------------------------------------- //
    // Minimal changes have been done to the functions below, mainly the XXXX.balanceOf(this) was replaced with  ------- //
    // getReserveBalance(XXXX) since the underlying balance has to be converted from the compound balance--------------- //
    // The changes can be submited as PR on the main repo BancorConverter without risk since this contract-------------- //
    // ----------------------------------------------------------------------------------------------------------------- //
    // ----------------------------------------------------------------------------------------------------------------- //
    // ----------------------------------------------------------------------------------------------------------------- //



    function convertInternal(IERC20Token _fromToken, IERC20Token _toToken, uint256 _amount, uint256 _minReturn)
        public
        only(BANCOR_NETWORK)
        greaterThanZero(_minReturn)
        returns (uint256)
    {
        require(_fromToken != _toToken); // validate input

        // conversion between the token and one of its reserves
        if (_toToken == token)
            return buy(_fromToken, _amount, _minReturn);
        else if (_fromToken == token)
            return sell(_toToken, _amount, _minReturn);

        uint256 amount;
        uint256 feeAmount;

        // conversion between 2 reserves
        (amount, feeAmount) = getCrossReserveReturn(_fromToken, _toToken, _amount);
        // ensure the trade gives something in return and meets the minimum requested amount
        require(amount != 0 && amount >= _minReturn);

        Reserve storage fromReserve = reserves[_fromToken];
        Reserve storage toReserve = reserves[_toToken];

        // ensure that the trade won't deplete the reserve balance
        // ---------------------------------------------------------------------//
        // changed _toToken.balanceOf(this) to getReserveBalance(_toToken)
        // ---------------------------------------------------------------------//
        uint256 toReserveBalance = getReserveBalance(_toToken);
        assert(amount < toReserveBalance);

        // transfer funds from the caller in the from reserve token
        ensureTransferFrom(_fromToken, msg.sender, this, _amount);
        // transfer funds to the caller in the to reserve token
        ensureTransferFrom(_toToken, this, msg.sender, amount);

        // dispatch the conversion event
        // the fee is higher (magnitude = 2) since cross reserve conversion equals 2 conversions (from / to the smart token)
        dispatchConversionEvent(_fromToken, _toToken, _amount, amount, feeAmount);

        // dispatch price data updates for the smart token / both reserves
        // ---------------------------------------------------------------------//
        // changed _fromToken.balanceOf(this) to getReserveBalance(_fromToken)
        // ---------------------------------------------------------------------//
        emit PriceDataUpdate(_fromToken, token.totalSupply(), getReserveBalance(_fromToken), fromReserve.ratio);
        // ---------------------------------------------------------------------//
        // changed _toToken.balanceOf(this) to getReserveBalance(_toToken)
        // ---------------------------------------------------------------------//
        emit PriceDataUpdate(_toToken, token.totalSupply(), getReserveBalance(_toToken), toReserve.ratio);
        return amount;
    }

    function buy(IERC20Token _reserveToken, uint256 _depositAmount, uint256 _minReturn) internal returns (uint256) {
        uint256 amount;
        uint256 feeAmount;
        (amount, feeAmount) = getPurchaseReturn(_reserveToken, _depositAmount);
        // ensure the trade gives something in return and meets the minimum requested amount
        require(amount != 0 && amount >= _minReturn);

        Reserve storage reserve = reserves[_reserveToken];

        // transfer funds from the caller in the reserve token
        ensureTransferFrom(_reserveToken, msg.sender, this, _depositAmount);
        // issue new funds to the caller in the smart token
        token.issue(msg.sender, amount);

        // dispatch the conversion event
        dispatchConversionEvent(_reserveToken, token, _depositAmount, amount, feeAmount);

        // dispatch price data update for the smart token/reserve
        // -----------------------------------------------------------------------//
        // changed _reserveToken.balanceOf(this) to getReserveBalance(_reserveToken)
        // -----------------------------------------------------------------------//
        emit PriceDataUpdate(_reserveToken, token.totalSupply(), getReserveBalance(_reserveToken), reserve.ratio);
        return amount;
    }

    function sell(IERC20Token _reserveToken, uint256 _sellAmount, uint256 _minReturn) internal returns (uint256) {
        require(_sellAmount <= token.balanceOf(msg.sender)); // validate input
        uint256 amount;
        uint256 feeAmount;
        (amount, feeAmount) = getSaleReturn(_reserveToken, _sellAmount);
        // ensure the trade gives something in return and meets the minimum requested amount
        require(amount != 0 && amount >= _minReturn);

        // ensure that the trade will only deplete the reserve balance if the total supply is depleted as well
        uint256 tokenSupply = token.totalSupply();
        // ---------------------------------------------------------------------//
        // changed reserveToken.balanceOf(this) to getReserveBalance(reserveToken)
        // ---------------------------------------------------------------------//
        uint256 reserveBalance = getReserveBalance(_reserveToken);
        assert(amount < reserveBalance || (amount == reserveBalance && _sellAmount == tokenSupply));

        Reserve storage reserve = reserves[_reserveToken];

        // destroy _sellAmount from the caller's balance in the smart token
        token.destroy(msg.sender, _sellAmount);
        // transfer funds to the caller in the reserve token
        ensureTransferFrom(_reserveToken, this, msg.sender, amount);

        // dispatch the conversion event
        dispatchConversionEvent(token, _reserveToken, _sellAmount, amount, feeAmount);

        // dispatch price data update for the smart token/reserve
        // -----------------------------------------------------------------------//
        // changed _reserveToken.balanceOf(this) to getReserveBalance(_reserveToken)
        // -----------------------------------------------------------------------//
        emit PriceDataUpdate(_reserveToken, token.totalSupply(), getReserveBalance(_reserveToken), reserve.ratio);
        return amount;
    }

    function getPurchaseReturn(IERC20Token _reserveToken, uint256 _depositAmount)
        public
        view
        active
        validReserve(_reserveToken)
        returns (uint256, uint256)
    {
        Reserve storage reserve = reserves[_reserveToken];

        uint256 tokenSupply = token.totalSupply();
        // ---------------------------------------------------------------------//
        // changed _reserveToken.balanceOf(this) to getReserveBalance(_reserveToken)
        // ---------------------------------------------------------------------//
        uint256 reserveBalance = getReserveBalance(_reserveToken);
        IBancorFormula formula = IBancorFormula(addressOf(BANCOR_FORMULA));
        uint256 amount = formula.calculatePurchaseReturn(tokenSupply, reserveBalance, reserve.ratio, _depositAmount);
        uint256 finalAmount = getFinalAmount(amount, 1);

        // return the amount minus the conversion fee and the conversion fee
        return (finalAmount, amount - finalAmount);
    }

    function getSaleReturn(IERC20Token _reserveToken, uint256 _sellAmount)
        public
        view
        active
        validReserve(_reserveToken)
        returns (uint256, uint256)
    {
        Reserve storage reserve = reserves[_reserveToken];
        uint256 tokenSupply = token.totalSupply();
        // -----------------------------------------------------------------------//
        // changed _reserveToken.balanceOf(this) to getReserveBalance(_reserveToken)
        // -----------------------------------------------------------------------//
        uint256 reserveBalance = getReserveBalance(_reserveToken); 
        IBancorFormula formula = IBancorFormula(addressOf(BANCOR_FORMULA));
        uint256 amount = formula.calculateSaleReturn(tokenSupply, reserveBalance, reserve.ratio, _sellAmount);
        uint256 finalAmount = getFinalAmount(amount, 1);

        // return the amount minus the conversion fee and the conversion fee
        return (finalAmount, amount - finalAmount);
    }

    //---------------------------------------------------------------------------------------------------------------//
    // no changes were applied to dispatchConversionEvent , it was ported here because it was marked as private, meaning 
    // that it cannot be inherited ----------------------------------------------------------------------------------//
    //---------------------------------------------------------------------------------------------------------------//

    function dispatchConversionEvent(IERC20Token _fromToken, IERC20Token _toToken, uint256 _amount, uint256 _returnAmount, uint256 _feeAmount) private {
        // fee amount is converted to 255 bits -
        // negative amount means the fee is taken from the source token, positive amount means its taken from the target token
        // currently the fee is always taken from the target token
        // since we convert it to a signed number, we first ensure that it's capped at 255 bits to prevent overflow
        assert(_feeAmount < 2 ** 255);
        emit Conversion(_fromToken, _toToken, msg.sender, _amount, _returnAmount, int256(_feeAmount));
    }

    function getCrossReserveReturn(IERC20Token _fromReserveToken, IERC20Token _toReserveToken, uint256 _amount)
        public
        view
        active
        validReserve(_fromReserveToken)
        validReserve(_toReserveToken)
        returns (uint256, uint256)
    {
        Reserve storage fromReserve = reserves[_fromReserveToken];
        Reserve storage toReserve = reserves[_toReserveToken];

        // ---------------------------------------------------------------------//
        // changed reserveToken.balanceOf(this) to getReserveBalance(xxxxxxxxx)
        // ---------------------------------------------------------------------//
        IBancorFormula formula = IBancorFormula(addressOf(BANCOR_FORMULA));
        uint256 amount = formula.calculateCrossReserveReturn(
            getReserveBalance(_fromReserveToken), 
            fromReserve.ratio, 
            getReserveBalance(_toReserveToken), 
            toReserve.ratio, 
            _amount);
        uint256 finalAmount = getFinalAmount(amount, 2);

        // return the amount minus the conversion fee and the conversion fee
        // the fee is higher (magnitude = 2) since cross reserve conversion equals 2 conversions (from / to the smart token)
        return (finalAmount, amount - finalAmount);
    }

    function quickConvert2(IERC20Token[] _path, uint256 _amount, uint256 _minReturn, address _affiliateAccount, uint256 _affiliateFee)
        public
        payable
        returns (uint256)
    {
        IBancorNetwork bancorNetwork = IBancorNetwork(addressOf(BANCOR_NETWORK));

        // we need to transfer the source tokens from the caller to the BancorNetwork contract,
        // so it can execute the conversion on behalf of the caller
        if (msg.value == 0) {
            // not ETH, send the source tokens to the BancorNetwork contract
            // if the token is the smart token, no allowance is required - destroy the tokens
            // from the caller and issue them to the BancorNetwork contract
            if (_path[0] == token) {
                token.destroy(msg.sender, _amount); // destroy _amount tokens from the caller's balance in the smart token
                token.issue(bancorNetwork, _amount); // issue _amount new tokens to the BancorNetwork contract
            } else {
                // otherwise, we assume we already have allowance, transfer the tokens directly to the BancorNetwork contract
                ensureTransferFrom(_path[0], msg.sender, bancorNetwork, _amount);
            }
        }

        // execute the conversion and pass on the ETH with the call
        return bancorNetwork.convertFor2.value(msg.value)(_path, _amount, _minReturn, msg.sender, _affiliateAccount, _affiliateFee);
    }
}
