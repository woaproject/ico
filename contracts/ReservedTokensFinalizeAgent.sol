/**
 * This smart contract code is Copyright 2017 TokenMarket Ltd. For more information see https://tokenmarket.net
 *
 * Licensed under the Apache License, version 2.0: https://github.com/TokenMarketNet/ico/blob/master/LICENSE.txt
 */

pragma solidity ^0.4.6;

import "./SafeMathLibExt.sol";
import "./CrowdsaleExt.sol";
import "./CrowdsaleTokenExt.sol";

/**
 * The default behavior for the crowdsale end.
 *
 * Unlock tokens.
 */
contract ReservedTokensFinalizeAgent is FinalizeAgent {
  using SafeMathLibExt for uint;
  CrowdsaleTokenExt public token;
  CrowdsaleExt public crowdsale;

  function ReservedTokensFinalizeAgent(CrowdsaleTokenExt _token, CrowdsaleExt _crowdsale) {
    token = _token;
    crowdsale = _crowdsale;
  }

  /** Check that we can release the token */
  function isSane() public constant returns (bool) {
    return (token.releaseAgent() == address(this));
  }

  /** Called once by crowdsale finalize() if the sale was success. */
  function finalizeCrowdsale() public {
    if(msg.sender != address(crowdsale)) {
      throw;
    }

    // How many % of tokens the founders and others get
    uint tokensSold = crowdsale.tokensSold();

    // move reserved tokens
    for (uint256 j = 0; j < token.reservedTokensDestinationsLen(); j++) {
      address reservedAddr = token.reservedTokensDestinations(j);
      uint allocatedBonusInPercentage;
      uint allocatedBonusInTokens = token.getReservedTokens(reservedAddr);
      uint percentsOfTokensUnit = token.getReservedPercentageUnit(reservedAddr);
      uint percentsOfTokensDecimals = token.getReservedPercentageDecimals(reservedAddr);

      if (percentsOfTokensUnit > 0) {
        allocatedBonusInPercentage = tokensSold * percentsOfTokensUnit / 10**percentsOfTokensDecimals / 100;
        token.mint(reservedAddr, allocatedBonusInPercentage);
      }

      if (allocatedBonusInTokens > 0) {
        token.mint(reservedAddr, allocatedBonusInTokens);
      }
    }

    token.releaseTokenTransfer();
  }

}
