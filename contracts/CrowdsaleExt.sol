/**
 * This smart contract code is Copyright 2017 TokenMarket Ltd. For more information see https://tokenmarket.net
 *
 * Licensed under the Apache License, version 2.0: https://github.com/TokenMarketNet/ico/blob/master/LICENSE.txt
 */

pragma solidity ^0.4.8;

import "./SafeMathLibExt.sol";
import "./Haltable.sol";
import "./PricingStrategy.sol";
import "./FinalizeAgent.sol";
import "./FractionalERC20Ext.sol";


/**
 * Abstract base contract for token sales.
 *
 * Handle
 * - start and end dates
 * - accepting investments
 * - minimum funding goal and refund
 * - various statistics during the crowdfund
 * - different pricing strategies
 * - different investment policies (require server side customer id, allow only whitelisted addresses)
 *
 */
contract CrowdsaleExt is Haltable {

  /* Max investment count when we are still allowed to change the multisig address */
  uint public MAX_INVESTMENTS_BEFORE_MULTISIG_CHANGE = 5;

  using SafeMathLibExt for uint;

  /* The token we are selling */
  FractionalERC20Ext public token;

  /* How we are going to price our offering */
  PricingStrategy public pricingStrategy;

  /* Post-success callback */
  FinalizeAgent public finalizeAgent;

  /* name of the crowdsale tier */
  string public name;

  /* tokens will be transfered from this address */
  address public multisigWallet;

  /* if the funding goal is not reached, investors may withdraw their funds */
  uint public minimumFundingGoal;

  /* the UNIX timestamp start date of the crowdsale */
  uint public startsAt;

  /* the UNIX timestamp end date of the crowdsale */
  uint public endsAt;

  /* the number of tokens already sold through this contract*/
  uint public tokensSold = 0;

  /* How many wei of funding we have raised */
  uint public weiRaised = 0;

  /* Calculate incoming funds from presale contracts and addresses */
  uint public presaleWeiRaised = 0;

  /* How many distinct addresses have invested */
  uint public investorCount = 0;

  /* Has this crowdsale been finalized */
  bool public finalized;

  bool public isWhiteListed;

  address[] public joinedCrowdsales;
  uint public joinedCrowdsalesLen = 0;

  address public lastTier = address(0);

  /**
    * Do we verify that contributor has been cleared on the server side (accredited investors only).
    * This method was first used in FirstBlood crowdsale to ensure all contributors have accepted terms on sale (on the web).
    */
  bool public requiredSignedAddress;

  /* Server side address that signed allowed contributors (Ethereum addresses) that can participate the crowdsale */
  address public signerAddress;

  /** How much ETH each address has invested to this crowdsale */
  mapping (address => uint256) public investedAmountOf;

  /** How much tokens this crowdsale has credited for each investor address */
  mapping (address => uint256) public tokenAmountOf;

  struct WhiteListData {
    bool status;
    uint minCap;
    uint maxCap;
  }

  //is crowdsale updatable
  bool public isUpdatable;

  /** Addresses that are allowed to invest even before ICO offical opens. For testing, for ICO partners, etc. */
  mapping (address => WhiteListData) public earlyParticipantWhitelist;

  /** List of whitelisted addresses */
  address[] public whitelistedParticipants;

  /** This is for manul testing for the interaction from owner wallet. You can set it to any value and inspect this in blockchain explorer to see that crowdsale interaction works. */
  uint public ownerTestValue;

  /** State machine
   *
   * - Preparing: All contract initialization calls and variables have not been set yet
   * - Prefunding: We have not passed start time yet
   * - Funding: Active crowdsale
   * - Success: Minimum funding goal reached
   * - Failure: Minimum funding goal not reached before ending time
   * - Finalized: The finalized has been called and succesfully executed
   */
  enum State{Unknown, Preparing, PreFunding, Funding, Success, Failure, Finalized}

  // A new investment was made
  event Invested(address investor, uint weiAmount, uint tokenAmount, uint128 customerId);

  // Address early participation whitelist status changed
  event Whitelisted(address addr, bool status);

  // Crowdsale start time has been changed
  event StartsAtChanged(uint newStartsAt);

  // Crowdsale end time has been changed
  event EndsAtChanged(uint newEndsAt);

  function CrowdsaleExt(string _name, address _token, PricingStrategy _pricingStrategy, address _multisigWallet, uint _start, uint _end, uint _minimumFundingGoal, bool _isUpdatable, bool _isWhiteListed) {

    owner = msg.sender;

    name = _name;

    token = FractionalERC20Ext(_token);

    setPricingStrategy(_pricingStrategy);

    multisigWallet = _multisigWallet;
    if(multisigWallet == 0) {
        throw;
    }

    if(_start == 0) {
        throw;
    }

    startsAt = _start;

    if(_end == 0) {
        throw;
    }

    endsAt = _end;

    // Don't mess the dates
    if(startsAt >= endsAt) {
        throw;
    }

    // Minimum funding goal can be zero
    minimumFundingGoal = _minimumFundingGoal;

    isUpdatable = _isUpdatable;

    isWhiteListed = _isWhiteListed;
  }

  /**
   * Don't expect to just send in money and get tokens.
   */
  function() payable {
    throw;
  }

  /**
   * Make an investment.
   *
   * Crowdsale must be running for one to invest.
   * We must have not pressed the emergency brake.
   *
   * @param receiver The Ethereum address who receives the tokens
   * @param customerId (optional) UUID v4 to track the successful payments on the server side
   *
   */
  function investInternal(address receiver, uint128 customerId) stopInEmergency private {

    // Determine if it's a good time to accept investment from this participant
    if(getState() == State.PreFunding) {
      // Are we whitelisted for early deposit
      throw;
    } else if(getState() == State.Funding) {
      // Retail participants can only come in when the crowdsale is running
      // pass
      if(isWhiteListed) {
        if(!earlyParticipantWhitelist[receiver].status) {
          throw;
        }
      }
    } else {
      // Unwanted state
      throw;
    }

    uint weiAmount = msg.value;

    // Account presale sales separately, so that they do not count against pricing tranches
    uint tokenAmount = pricingStrategy.calculatePrice(weiAmount, weiRaised - presaleWeiRaised, tokensSold, msg.sender, token.decimals());

    if(tokenAmount == 0) {
      // Dust transaction
      throw;
    }

    if(isWhiteListed) {
      if(tokenAmount < earlyParticipantWhitelist[receiver].minCap && tokenAmountOf[receiver] == 0) {
        // tokenAmount < minCap for investor
        throw;
      }
      if(tokenAmount > earlyParticipantWhitelist[receiver].maxCap) {
        // tokenAmount > maxCap for investor
        throw;
      }

      // Check that we did not bust the investor's cap
      if (isBreakingInvestorCap(receiver, tokenAmount)) {
        throw;
      }
    } else {
      if(tokenAmount < token.minCap() && tokenAmountOf[receiver] == 0) {
        throw;
      }
    }

    if(investedAmountOf[receiver] == 0) {
       // A new investor
       investorCount++;
    }

    // Update investor
    investedAmountOf[receiver] = investedAmountOf[receiver].plus(weiAmount);
    tokenAmountOf[receiver] = tokenAmountOf[receiver].plus(tokenAmount);

    // Update totals
    weiRaised = weiRaised.plus(weiAmount);
    tokensSold = tokensSold.plus(tokenAmount);

    if(pricingStrategy.isPresalePurchase(receiver)) {
        presaleWeiRaised = presaleWeiRaised.plus(weiAmount);
    }

    // Check that we did not bust the cap
    if(isBreakingCap(weiAmount, tokenAmount, weiRaised, tokensSold)) {
      throw;
    }

    assignTokens(receiver, tokenAmount);

    // Pocket the money
    if(!multisigWallet.send(weiAmount)) throw;

    if (isWhiteListed) {
      uint num = 0;
      for (var i = 0; i < joinedCrowdsalesLen; i++) {
        if (this == joinedCrowdsales[i])
          num = i;
      }

      if (num + 1 < joinedCrowdsalesLen) {
        for (var j = num + 1; j < joinedCrowdsalesLen; j++) {
          CrowdsaleExt crowdsale = CrowdsaleExt(joinedCrowdsales[j]);
          crowdsale.updateEarlyParticipantWhitelist(msg.sender, this, tokenAmount);
        }
      }
    }

    // Tell us invest was success
    Invested(receiver, weiAmount, tokenAmount, customerId);
  }

  /**
   * Allow anonymous contributions to this crowdsale.
   */
  function invest(address addr) public payable {
    investInternal(addr, 0);
  }

  /**
   * The basic entry point to participate the crowdsale process.
   *
   * Pay for funding, get invested tokens back in the sender address.
   */
  function buy() public payable {
    invest(msg.sender);
  }

  function distributeReservedTokens(uint reservedTokensDistributionBatch) public inState(State.Success) onlyOwner stopInEmergency {
    // Already finalized
    if(finalized) {
      throw;
    }

    // Finalizing is optional. We only call it if we are given a finalizing agent.
    if(address(finalizeAgent) != 0) {
      finalizeAgent.distributeReservedTokens(reservedTokensDistributionBatch);
    }
  }

  /**
   * Finalize a succcesful crowdsale.
   *
   * The owner can triggre a call the contract that provides post-crowdsale actions, like releasing the tokens.
   */
  function finalize() public inState(State.Success) onlyOwner stopInEmergency {

    // Already finalized
    if(finalized) {
      throw;
    }

    // Finalizing is optional. We only call it if we are given a finalizing agent.
    if(address(finalizeAgent) != 0) {
      finalizeAgent.finalizeCrowdsale();
    }

    finalized = true;
  }

  /**
   * Allow to (re)set finalize agent.
   *
   * Design choice: no state restrictions on setting this, so that we can fix fat finger mistakes.
   */
  function setFinalizeAgent(FinalizeAgent addr) onlyOwner {
    finalizeAgent = addr;

    // Don't allow setting bad agent
    if(!finalizeAgent.isFinalizeAgent()) {
      throw;
    }
  }

  /**
   * Allow addresses to do early participation.
   */
  function setEarlyParticipantWhitelist(address addr, bool status, uint minCap, uint maxCap) onlyOwner {
    if (!isWhiteListed) throw;
    assert(addr != address(0));
    assert(maxCap > 0);
    assert(minCap <= maxCap);

    if (earlyParticipantWhitelist[addr].maxCap == 0) {
      earlyParticipantWhitelist[addr] = WhiteListData({status:status, minCap:minCap, maxCap:maxCap});
      whitelistedParticipants.push(addr);
      Whitelisted(addr, status);
    }
  }

  function setEarlyParticipantsWhitelist(address[] addrs, bool[] statuses, uint[] minCaps, uint[] maxCaps) onlyOwner {
    if (!isWhiteListed) throw;
    for (uint iterator = 0; iterator < addrs.length; iterator++) {
      setEarlyParticipantWhitelist(addrs[iterator], statuses[iterator], minCaps[iterator], maxCaps[iterator]);
    }
  }

  function updateEarlyParticipantWhitelist(address addr, address contractAddr, uint tokensBought) {
    if (tokensBought < earlyParticipantWhitelist[addr].minCap) throw;
    if (!isWhiteListed) throw;
    if (addr != msg.sender && contractAddr != msg.sender) throw;
    uint newMaxCap = earlyParticipantWhitelist[addr].maxCap;
    newMaxCap = newMaxCap.minus(tokensBought);
    earlyParticipantWhitelist[addr] = WhiteListData({status:earlyParticipantWhitelist[addr].status, minCap:0, maxCap:newMaxCap});
  }

  function whitelistedParticipantsLength() public constant returns (uint) {
    return whitelistedParticipants.length;
  }

  function updateJoinedCrowdsales(address addr) private onlyOwner {
    joinedCrowdsales[joinedCrowdsalesLen++] = addr;
  }

  function setLastTier(address addr) private onlyOwner {
    assert(addr != address(0));
    assert(address(lastTier) == address(0));
    lastTier = addr;
  }

  function updateJoinedCrowdsalesMultiple(address[] addrs) onlyOwner {
    assert(addrs.length != 0);
    assert(joinedCrowdsales.length == 0);
    assert(joinedCrowdsalesLen == 0);
    for (uint iter = 0; iter < addrs.length; iter++) {
      if(joinedCrowdsalesLen == joinedCrowdsales.length) {
          joinedCrowdsales.length += 1;
      }
      joinedCrowdsales[joinedCrowdsalesLen++] = addrs[iter];
      if (iter == addrs.length - 1)
        setLastTier(addrs[iter]);
    }
  }

  function setStartsAt(uint time) onlyOwner {
    if (finalized) throw;

    if (!isUpdatable) throw;

    if(now > time) {
      throw; // Don't change past
    }

    if(time > endsAt) {
      throw;
    }

    CrowdsaleExt lastTierCntrct = CrowdsaleExt(lastTier);
    if (lastTierCntrct.finalized()) throw;

    startsAt = time;
    StartsAtChanged(startsAt);
  }

  /**
   * Allow crowdsale owner to close early or extend the crowdsale.
   *
   * This is useful e.g. for a manual soft cap implementation:
   * - after X amount is reached determine manual closing
   *
   * This may put the crowdsale to an invalid state,
   * but we trust owners know what they are doing.
   *
   */
  function setEndsAt(uint time) onlyOwner {
    if (finalized) throw;

    if (!isUpdatable) throw;

    if(now > time) {
      throw; // Don't change past
    }

    if(startsAt > time) {
      throw;
    }

    CrowdsaleExt lastTierCntrct = CrowdsaleExt(lastTier);
    if (lastTierCntrct.finalized()) throw;

    uint num = 0;
    for (var i = 0; i < joinedCrowdsalesLen; i++) {
      if (this == joinedCrowdsales[i])
        num = i;
    }

    if (num + 1 < joinedCrowdsalesLen) {
      for (var j = num + 1; j < joinedCrowdsalesLen; j++) {
        CrowdsaleExt crowdsale = CrowdsaleExt(joinedCrowdsales[j]);
        if (time > crowdsale.startsAt()) throw;
      }
    }

    endsAt = time;
    EndsAtChanged(endsAt);
  }

  /**
   * Allow to (re)set pricing strategy.
   *
   * Design choice: no state restrictions on the set, so that we can fix fat finger mistakes.
   */
  function setPricingStrategy(PricingStrategy _pricingStrategy) onlyOwner {
    pricingStrategy = _pricingStrategy;

    // Don't allow setting bad agent
    if(!pricingStrategy.isPricingStrategy()) {
      throw;
    }
  }

  /**
   * Allow to change the team multisig address in the case of emergency.
   *
   * This allows to save a deployed crowdsale wallet in the case the crowdsale has not yet begun
   * (we have done only few test transactions). After the crowdsale is going
   * then multisig address stays locked for the safety reasons.
   */
  function setMultisig(address addr) public onlyOwner {

    // Change
    if(investorCount > MAX_INVESTMENTS_BEFORE_MULTISIG_CHANGE) {
      throw;
    }

    multisigWallet = addr;
  }

  /**
   * @return true if the crowdsale has raised enough money to be a successful.
   */
  function isMinimumGoalReached() public constant returns (bool reached) {
    return weiRaised >= minimumFundingGoal;
  }

  /**
   * Check if the contract relationship looks good.
   */
  function isFinalizerSane() public constant returns (bool sane) {
    return finalizeAgent.isSane();
  }

  /**
   * Check if the contract relationship looks good.
   */
  function isPricingSane() public constant returns (bool sane) {
    return pricingStrategy.isSane(address(this));
  }

  /**
   * Crowdfund state machine management.
   *
   * We make it a function and do not assign the result to a variable, so there is no chance of the variable being stale.
   */
  function getState() public constant returns (State) {
    if(finalized) return State.Finalized;
    else if (address(finalizeAgent) == 0) return State.Preparing;
    else if (!finalizeAgent.isSane()) return State.Preparing;
    else if (!pricingStrategy.isSane(address(this))) return State.Preparing;
    else if (block.timestamp < startsAt) return State.PreFunding;
    else if (block.timestamp <= endsAt && !isCrowdsaleFull()) return State.Funding;
    else if (isMinimumGoalReached()) return State.Success;
    else return State.Failure;
  }

  /** This is for manual testing of multisig wallet interaction */
  function setOwnerTestValue(uint val) onlyOwner {
    ownerTestValue = val;
  }

  /** Interface marker. */
  function isCrowdsale() public constant returns (bool) {
    return true;
  }

  //
  // Modifiers
  //

  /** Modified allowing execution only if the crowdsale is currently running.  */
  modifier inState(State state) {
    if(getState() != state) throw;
    _;
  }


  //
  // Abstract functions
  //

  /**
   * Check if the current invested breaks our cap rules.
   *
   *
   * The child contract must define their own cap setting rules.
   * We allow a lot of flexibility through different capping strategies (ETH, token count)
   * Called from invest().
   *
   * @param weiAmount The amount of wei the investor tries to invest in the current transaction
   * @param tokenAmount The amount of tokens we try to give to the investor in the current transaction
   * @param weiRaisedTotal What would be our total raised balance after this transaction
   * @param tokensSoldTotal What would be our total sold tokens count after this transaction
   *
   * @return true if taking this investment would break our cap rules
   */
  function isBreakingCap(uint weiAmount, uint tokenAmount, uint weiRaisedTotal, uint tokensSoldTotal) constant returns (bool limitBroken);

  function isBreakingInvestorCap(address receiver, uint tokenAmount) constant returns (bool limitBroken);

  /**
   * Check if the current crowdsale is full and we can no longer sell any tokens.
   */
  function isCrowdsaleFull() public constant returns (bool);

  /**
   * Create new tokens or transfer issued tokens to the investor depending on the cap model.
   */
  function assignTokens(address receiver, uint tokenAmount) private;
}
