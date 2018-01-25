const CrowdsaleTokenExt = artifacts.require("./CrowdsaleTokenExt.sol");
const MintedTokenCappedCrowdsaleExt = artifacts.require("./MintedTokenCappedCrowdsaleExt.sol");
const ReservedTokensFinalizeAgent = artifacts.require("./ReservedTokensFinalizeAgent.sol");
const FlatPricingExt = artifacts.require("./FlatPricingExt.sol");
const constants = require("../constants");
const utils = require("../utils");
const ERROR_MSG = 'VM Exception while processing transaction: invalid opcode';

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(web3.BigNumber))
  .should();

let balanceOfMultisigInitial = 0;
let weiToSend1 = 0; //weiToSend in 1st success investment;
let weiToSend2 = 0; //weiToSend in 2nd success investment;
let weiToSend3 = 0; //weiToSend in 3d success investment;

contract('MintedTokenCappedCrowdsaleExt', function(accounts) {
	it("shouldn't set finalize agent once more", async () => {
    	let mintedTokenCappedCrowdsaleExt = await MintedTokenCappedCrowdsaleExt.deployed();
    	let reservedTokensFinalizeAgent = await ReservedTokensFinalizeAgent.deployed();
    	await mintedTokenCappedCrowdsaleExt.setFinalizeAgent(reservedTokensFinalizeAgent.address).should.be.rejectedWith(ERROR_MSG);
	});

	it("shouldn't set pricing strategy once more", async () => {
    	let mintedTokenCappedCrowdsaleExt = await MintedTokenCappedCrowdsaleExt.deployed();
    	let flatPricingExt = await FlatPricingExt.deployed();
    	await mintedTokenCappedCrowdsaleExt.setPricingStrategy(flatPricingExt.address).should.be.rejectedWith(ERROR_MSG);
	});

	it("shouldn't update rate", async () => {
    	let newRate = 10**18 / 2000;
    	let mintedTokenCappedCrowdsaleExt = await MintedTokenCappedCrowdsaleExt.deployed();
    	let flatPricingExt = await FlatPricingExt.deployed();
    	await mintedTokenCappedCrowdsaleExt.updateRate(newRate).should.be.rejectedWith(ERROR_MSG);
	});

	it("shouldn't update max cap", async () => {
    	let newMaxCap = 200000000 * 10**18;
    	let mintedTokenCappedCrowdsaleExt = await MintedTokenCappedCrowdsaleExt.deployed();
    	await mintedTokenCappedCrowdsaleExt.setMaximumSellableTokens(newMaxCap).should.be.rejectedWith(ERROR_MSG);
	});

	it("shouldn't set startsAt", async () => {
		let newStartsAt = parseInt(new Date().getTime()/1000);
    	let mintedTokenCappedCrowdsaleExt = await MintedTokenCappedCrowdsaleExt.deployed();
    	await mintedTokenCappedCrowdsaleExt.setStartsAt(newStartsAt).should.be.rejectedWith(ERROR_MSG);
	});

	it("should get last tier tier for crowdsale contract", async () => {
		let mintedTokenCappedCrowdsaleExt = await MintedTokenCappedCrowdsaleExt.deployed();
		let lastCrowdsale = await mintedTokenCappedCrowdsaleExt.getLastTier.call();
		mintedTokenCappedCrowdsaleExt.address.should.be.bignumber.equal(lastCrowdsale);
	});

	it("should get name of crowdsale", async () => {
		let mintedTokenCappedCrowdsaleExt = await MintedTokenCappedCrowdsaleExt.deployed();
		let name = await mintedTokenCappedCrowdsaleExt.name.call();
		name.should.be.equal("Test Crowdsale");
	});

	/*it("should update rate", async () => {
    	let newRate = 10**18 / 2000;
    	let mintedTokenCappedCrowdsaleExt = await MintedTokenCappedCrowdsaleExt.deployed();
    	let flatPricingExt = await FlatPricingExt.deployed();
    	await mintedTokenCappedCrowdsaleExt.updateRate(newRate);
    	let rate = await flatPricingExt.oneTokenInWei.call();
    	rate.should.be.bignumber.equal(newRate);
	});

	it("should update max cap", async () => {
    	let newMaxCap = 200000000 * 10**18;
    	let mintedTokenCappedCrowdsaleExt = await MintedTokenCappedCrowdsaleExt.deployed();
    	await mintedTokenCappedCrowdsaleExt.setMaximumSellableTokens(newMaxCap);
    	let maxCap = await mintedTokenCappedCrowdsaleExt.maximumSellableTokens.call();
    	maxCap.should.be.bignumber.equal(newMaxCap);
	});

	it("should update startsAt", async () => {
		let newStartsAt = parseInt(new Date().getTime()/1000);
    	let mintedTokenCappedCrowdsaleExt = await MintedTokenCappedCrowdsaleExt.deployed();
    	await mintedTokenCappedCrowdsaleExt.setStartsAt(newStartsAt);
    	let startsAt = await mintedTokenCappedCrowdsaleExt.startsAt.call();
    	startsAt.should.be.bignumber.equal(newStartsAt);
	});*/

	it("should get finalize agent", async () => {
		let mintedTokenCappedCrowdsaleExt = await MintedTokenCappedCrowdsaleExt.deployed();
		let finalizeAgent = await mintedTokenCappedCrowdsaleExt.finalizeAgent.call();
		ReservedTokensFinalizeAgent.address.should.be.bignumber.equal(finalizeAgent);
	});

	it("should get pricing strategy", async () => {
		let mintedTokenCappedCrowdsaleExt = await MintedTokenCappedCrowdsaleExt.deployed();
		let flatPricingExt = await mintedTokenCappedCrowdsaleExt.pricingStrategy.call();
		FlatPricingExt.address.should.be.equal(flatPricingExt);
	});

	it("should get isTierJoined", async () => {
		let mintedTokenCappedCrowdsaleExt = await MintedTokenCappedCrowdsaleExt.deployed();
		let isTierJoined = await mintedTokenCappedCrowdsaleExt.isTierJoined.call(mintedTokenCappedCrowdsaleExt.address);
		true.should.be.equal(isTierJoined);
	});

	it("should get tier position", async () => {
		let mintedTokenCappedCrowdsaleExt = await MintedTokenCappedCrowdsaleExt.deployed();
		let isTierJoined = await mintedTokenCappedCrowdsaleExt.getTierPosition.call(mintedTokenCappedCrowdsaleExt.address);
		isTierJoined.should.be.bignumber.equal(0);
	});

	it("should get early participant white list", function() {
		return MintedTokenCappedCrowdsaleExt.deployed().then(function(instance) {
	    	return instance.earlyParticipantWhitelist.call(accounts[2]);
	    }).then(function(res) {
	    	assert.equal(res[0], true, "white list item should be switched on (status should be `true`)");
	    });
	});

	it("should get early participant white list minCap", function() {
		return MintedTokenCappedCrowdsaleExt.deployed().then(function(instance) {
	    	return instance.earlyParticipantWhitelist.call(accounts[2]);
	    }).then(function(res) {
	    	assert.equal(res[1], constants.whiteListItem.minCap, "white list item minCap should return value we inserted before at deploying stage");
	    });
	});

	it("should get early participant white list maxCap", function() {
		return MintedTokenCappedCrowdsaleExt.deployed().then(function(instance) {
	    	return instance.earlyParticipantWhitelist.call(accounts[2]);
	    }).then(function(res) {
	    	assert.equal(res[2], constants.whiteListItem.maxCap, "white list item maxCap should return value we inserted before at deploying stage");
	    });
	});

	it("shouldn't accept investment from not whitelisted user", async () => {
    	let weiToSend = parseInt(constants.investments[0]*constants.rate, 10);
    	let mintedTokenCappedCrowdsaleExt = await MintedTokenCappedCrowdsaleExt.deployed();
    	await mintedTokenCappedCrowdsaleExt.buy({from: accounts[1], value: weiToSend}).should.be.rejectedWith(ERROR_MSG);
	});

	it("shouldn't accept investment from whitelisted user less than minCap", async () => {
    	let weiToSend = parseInt(constants.investments[0]*constants.rate, 10);
		let mintedTokenCappedCrowdsaleExt = await MintedTokenCappedCrowdsaleExt.deployed();
    	await mintedTokenCappedCrowdsaleExt.buy({from: accounts[2], value: weiToSend}).should.be.rejectedWith(ERROR_MSG);
	});

	it("shouldn't accept investment from whitelisted user more than maxCap", async () => {
    	let weiToSend = parseInt(constants.investments[1]*constants.rate, 10);
		let mintedTokenCappedCrowdsaleExt = await MintedTokenCappedCrowdsaleExt.deployed();
    	await mintedTokenCappedCrowdsaleExt.buy({from: accounts[2], value: weiToSend}).should.be.rejectedWith(ERROR_MSG);
	});

	balanceOfMultisigInitial = web3.eth.getBalance(accounts[3]);

	it("should accept buy from whitelisted user 1 within cap range", async () => {
    	weiToSend1 = parseInt(constants.investments[2]*constants.rate, 10);
		let mintedTokenCappedCrowdsaleExt = await MintedTokenCappedCrowdsaleExt.deployed();
    	await mintedTokenCappedCrowdsaleExt.buy({from: accounts[2], value: weiToSend1}).should.be.fulfilled;
	});

	it("should return updated balance of multisig", function() {
		let balanceOfMultisigUpdated = web3.eth.getBalance(accounts[3]);
		let invested = parseInt(balanceOfMultisigInitial, 10) + parseInt(weiToSend1, 10);
		balanceOfMultisigUpdated.should.be.bignumber.equal(invested);
	});

	it("should accept buy from whitelisted user 2 within cap range", async () => {
    	weiToSend1 = parseInt(constants.investments[2]*constants.rate, 10);
		let mintedTokenCappedCrowdsaleExt = await MintedTokenCappedCrowdsaleExt.deployed();
    	await mintedTokenCappedCrowdsaleExt.buy({from: accounts[4], value: weiToSend1}).should.be.fulfilled;
	});

	it("should return updated balance of multisig", function() {
		let balanceOfMultisigUpdated = web3.eth.getBalance(accounts[3]);
		let invested = parseInt(balanceOfMultisigInitial, 10) + 2 * parseInt(weiToSend1, 10);
		balanceOfMultisigUpdated.should.be.bignumber.equal(invested);
	});

	it("should return token's balance we have bought in previous step", async () => {
		let crowdsaleTokenExt = await CrowdsaleTokenExt.deployed();
		let balance = await crowdsaleTokenExt.balanceOf.call(accounts[2]);
		balance.should.be.bignumber.equal(constants.investments[2]*10**constants.token.decimals);
	});

	it("should accept buy less than minCap at second buy", async () => {
    	weiToSend2 = parseInt(constants.investments[3]*constants.rate, 10);
		let mintedTokenCappedCrowdsaleExt = await MintedTokenCappedCrowdsaleExt.deployed();
    	await mintedTokenCappedCrowdsaleExt.buy({from: accounts[2], value: weiToSend2}).should.be.fulfilled;
	});

	it("should return updated balance of multisig", function() {
		let balanceOfMultisigUpdated = web3.eth.getBalance(accounts[3]);
		let invested = parseInt(balanceOfMultisigInitial, 10) + 2 * parseInt(weiToSend1, 10) + parseInt(weiToSend2, 10);
		balanceOfMultisigUpdated.should.be.bignumber.equal(invested);
	});

	it("should accept buy of fractionated amount of tokens from whitelisted user within cap range", async () => {
    	weiToSend3 = parseInt(constants.investments[4]*constants.rate, 10);
		let mintedTokenCappedCrowdsaleExt = await MintedTokenCappedCrowdsaleExt.deployed();
    	await mintedTokenCappedCrowdsaleExt.buy({from: accounts[2], value: weiToSend3}).should.be.fulfilled;
	});

	it("should return token balance we have bought in previous step", async () => {
		let crowdsaleTokenExt = await CrowdsaleTokenExt.deployed();
    	let balance = await crowdsaleTokenExt.balanceOf.call(accounts[2]);
    	let invested = (constants.investments[2] + constants.investments[3] + constants.investments[4])*10**constants.token.decimals;
    	balance.should.be.bignumber.equal(invested);
	});

	it("should return updated balance of multisig", function() {
		let balanceOfMultisigUpdated = web3.eth.getBalance(accounts[3]);
		let invested = parseInt(balanceOfMultisigInitial, 10) + 2 * parseInt(weiToSend1, 10) + parseInt(weiToSend2, 10) + parseInt(weiToSend3, 10);
		balanceOfMultisigUpdated.should.be.bignumber.equal(invested);
	});

	it("shouldn't accept investment from whitelisted user that exceeds maxCap", async () => {
    	let weiToSend = parseInt(constants.investments[5]*constants.rate, 10);
		let mintedTokenCappedCrowdsaleExt = await MintedTokenCappedCrowdsaleExt.deployed();
    	await mintedTokenCappedCrowdsaleExt.buy({from: accounts[2], value: weiToSend}).should.be.rejectedWith(ERROR_MSG);
	});

	it("should get the count of whitelisted participants", async () => {
		let mintedTokenCappedCrowdsaleExt = await MintedTokenCappedCrowdsaleExt.deployed();
		let whitelistedParticipantsLength = await mintedTokenCappedCrowdsaleExt.whitelistedParticipantsLength.call();
		whitelistedParticipantsLength.should.be.bignumber.equal(2);
	});

	it("should get the whitelist participant from the array", async () => {
		let mintedTokenCappedCrowdsaleExt = await MintedTokenCappedCrowdsaleExt.deployed();
		let whitelistedParticipant = await mintedTokenCappedCrowdsaleExt.whitelistedParticipants.call(0);
		whitelistedParticipant.should.be.equal(accounts[2]);
	});

	it("should not allow adding the 0 address to the whitelist", async () => {
		let mintedTokenCappedCrowdsaleExt = await MintedTokenCappedCrowdsaleExt.deployed();
		const token = constants.token;
        const minCap = 1 * 10**token.decimals;
        const maxCap = 10 * 10**token.decimals;
        await mintedTokenCappedCrowdsaleExt.setEarlyParticipantWhitelist('0x0', true, minCap, maxCap, { from: accounts[0] }).should.be.rejectedWith(ERROR_MSG);;
	});

	it("should not allow adding an address to the whitelist with a minCap greater than the maxCap", async () => {
		let mintedTokenCappedCrowdsaleExt = await MintedTokenCappedCrowdsaleExt.deployed();
		const token = constants.token
        const minCap = 10 * 10**token.decimals
        const maxCap = 1 * 10**token.decimals
        await mintedTokenCappedCrowdsaleExt.setEarlyParticipantWhitelist(accounts[5], true, minCap, maxCap, { from: accounts[0] }).should.be.rejectedWith(ERROR_MSG);;
	});

	it("should not allow adding an address to the whitelist with a maxCap of 0", async () => {
		let mintedTokenCappedCrowdsaleExt = await MintedTokenCappedCrowdsaleExt.deployed();
		const token = constants.token
        const minCap = 0
        const maxCap = 0
        await mintedTokenCappedCrowdsaleExt.setEarlyParticipantWhitelist(accounts[5], true, minCap, maxCap, { from: accounts[0] }).should.be.rejectedWith(ERROR_MSG);;
	});

    it("should not add an address to the whitelist that was already added", function() {
        let currentWhitelistLength = null

		return MintedTokenCappedCrowdsaleExt.deployed().then(function(instance) {
            return instance.whitelistedParticipantsLength.call()
                .then(length => {
                    currentWhitelistLength = length
                })
                .then(() => instance)
        }).then(function(instance) {
            const token = constants.token
            const minCap = 1 * 10**token.decimals
            const maxCap = 10 * 10**token.decimals
            return instance.setEarlyParticipantWhitelist(accounts[2], true, minCap, maxCap, { from: accounts[0] })
                .then(() => instance)
	    }).then(function(instance) {
            return instance.whitelistedParticipantsLength.call()
                .then(length => {
                    assert.equal(currentWhitelistLength.toString(), length.toString(), 'The length of the whitelist should not have changed')
                })
        });
    })

	it("should set endsAt", async () => {
		let mintedTokenCappedCrowdsaleExt = await MintedTokenCappedCrowdsaleExt.deployed();
		await mintedTokenCappedCrowdsaleExt.setEndsAt(parseInt((new Date()).getTime()/1000, {from: accounts[0]})).should.be.fulfilled;
	});

	//todo: remove this
	for (let i = 0; i < 10; i++) {
		it("should get state of crowdsale", async () => {
			let mintedTokenCappedCrowdsaleExt = await MintedTokenCappedCrowdsaleExt.deployed();
			await mintedTokenCappedCrowdsaleExt.getState.call();
		});
	}

	it("should not set endsAt, if crowdsale is already ended", async () => {
		let mintedTokenCappedCrowdsaleExt = await MintedTokenCappedCrowdsaleExt.deployed();
		await mintedTokenCappedCrowdsaleExt.setEndsAt(parseInt((new Date()).getTime()/1000, {from: accounts[0]})).should.be.rejectedWith(ERROR_MSG);
	});

	it("should fail finalize", async () => {
		let mintedTokenCappedCrowdsaleExt = await MintedTokenCappedCrowdsaleExt.deployed();
		await mintedTokenCappedCrowdsaleExt.finalize().should.be.rejectedWith(ERROR_MSG);
	});

	it("should fail distribution of reserved tokens with 0 batch", async () => {
		let mintedTokenCappedCrowdsaleExt = await MintedTokenCappedCrowdsaleExt.deployed();
		await mintedTokenCappedCrowdsaleExt.distributeReservedTokens(0).should.be.rejectedWith(ERROR_MSG);
	});

	it("should distribute 1st batch of reserved tokens", async () => {
		let mintedTokenCappedCrowdsaleExt = await MintedTokenCappedCrowdsaleExt.deployed();
		await mintedTokenCappedCrowdsaleExt.distributeReservedTokens(1).should.be.fulfilled;
	});

	it("should return that reserved tokens are distributed for one address", async () => {
		let reservedTokensFinalizeAgent = await ReservedTokensFinalizeAgent.deployed();
		let distributedReservedTokensDestinationsLen = await reservedTokensFinalizeAgent.distributedReservedTokensDestinationsLen.call();
		distributedReservedTokensDestinationsLen.should.be.bignumber.equal(1);
	});

	it("should return that not all reserved tokens are distributed", async () => {
		let reservedTokensFinalizeAgent = await ReservedTokensFinalizeAgent.deployed();
		let reservedTokensAreDistributed = await reservedTokensFinalizeAgent.reservedTokensAreDistributed.call();
		reservedTokensAreDistributed.should.be.equal(false);
	});

	it("should fail finalize", async () => {
		let mintedTokenCappedCrowdsaleExt = await MintedTokenCappedCrowdsaleExt.deployed();
		await mintedTokenCappedCrowdsaleExt.finalize().should.be.rejectedWith(ERROR_MSG);
	});

	it("should distribute reserved tokens", async () => {
		let mintedTokenCappedCrowdsaleExt = await MintedTokenCappedCrowdsaleExt.deployed();
		await mintedTokenCappedCrowdsaleExt.distributeReservedTokens(1).should.be.fulfilled;
	});

	it("should return that all reserved tokens are distributed", async () => {
		let reservedTokensFinalizeAgent = await ReservedTokensFinalizeAgent.deployed();
		let distributedReservedTokensDestinationsLen  = await reservedTokensFinalizeAgent.distributedReservedTokensDestinationsLen.call();
		distributedReservedTokensDestinationsLen.should.be.bignumber.equal(2);
	});

	it("should return that all reserved tokens are distributed", async () => {
		let reservedTokensFinalizeAgent = await ReservedTokensFinalizeAgent.deployed();
		let reservedTokensAreDistributed  = await reservedTokensFinalizeAgent.reservedTokensAreDistributed.call();
		reservedTokensAreDistributed.should.be.equal(true);
	});

	it("should fail distribution of reserved tokens", async () => {
		let mintedTokenCappedCrowdsaleExt = await MintedTokenCappedCrowdsaleExt.deployed();
		await mintedTokenCappedCrowdsaleExt.distributeReservedTokens(1).should.be.rejectedWith(ERROR_MSG);
	});

	it("should finalize crowdsale", async () => {
		let mintedTokenCappedCrowdsaleExt = await MintedTokenCappedCrowdsaleExt.deployed();
		await mintedTokenCappedCrowdsaleExt.finalize().should.be.fulfilled;
	});

	let user1Investment = (constants.investments[2] + constants.investments[3] + constants.investments[4]) * 10**constants.token.decimals
	let user2Investment = (constants.investments[2]) * 10**constants.token.decimals
	let usersInvestment = user1Investment + user2Investment

	it("should return updated token balance of user 1 including reserved tokens", async () => {
		let crowdsaleTokenExt = await CrowdsaleTokenExt.deployed();
		let tokenBalance = await crowdsaleTokenExt.balanceOf.call(accounts[2]);
		let tokenBalancePattern = user1Investment + usersInvestment * constants.reservedTokens.percentageUnit / 10**constants.reservedTokens.percentageDecimals / 100;
		tokenBalancePattern += constants.reservedTokens.number;
		tokenBalancePattern.should.be.bignumber.equal(tokenBalance);
	});

	it("should return updated token balance of user 2 including reserved tokens", async () => {
		let crowdsaleTokenExt = await CrowdsaleTokenExt.deployed();
		let tokenBalance  = await crowdsaleTokenExt.balanceOf.call(accounts[4]);
		let tokenBalancePattern = user2Investment +  usersInvestment * constants.reservedTokens2.percentageUnit / 10**constants.reservedTokens2.percentageDecimals / 100;
		tokenBalancePattern += constants.reservedTokens2.number;
		tokenBalancePattern.should.be.bignumber.equal(tokenBalance);
	});
});