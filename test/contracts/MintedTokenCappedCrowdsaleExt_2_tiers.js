const SafeMathLibExt = artifacts.require("./SafeMathLibExt.sol");
const CrowdsaleTokenExt = artifacts.require("./CrowdsaleTokenExt.sol");
const MintedTokenCappedCrowdsaleExt = artifacts.require("./MintedTokenCappedCrowdsaleExt.sol");
const NullFinalizeAgentExt = artifacts.require("./NullFinalizeAgentExt.sol");
const ReservedTokensFinalizeAgent = artifacts.require("./ReservedTokensFinalizeAgent.sol");
const FlatPricingExt = artifacts.require("./FlatPricingExt.sol");
const Registry = artifacts.require("./Registry.sol");
const constants = require("../constants");
const utils = require("../utils");
const ERROR_MSG = 'VM Exception while processing transaction: invalid opcode';

const timeout = ms => new Promise(res => setTimeout(res, ms))

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(web3.BigNumber))
  .should();

let weiToSend1
let weiToSend2
let weiToSend3
let weiToSend4
let weiToSend5

const tokenParams = [
	constants.token.name,
  	constants.token.ticker,
  	parseInt(constants.token.supply, 10),
  	parseInt(constants.token.decimals, 10),
  	constants.token.isMintable,
  	constants.token.globalmincap
];

const pricingStrategyParams1 = [
	web3.toWei(1/constants.pricingStrategyMultiple[0].rate, "ether")
];

const pricingStrategyParams2 = [
	web3.toWei(1/constants.pricingStrategyMultiple[1].rate, "ether")
];

const crowdsaleParams1 = [
	constants.crowdsaleMultiple[0].start,
	constants.crowdsaleMultiple[0].end,
	constants.crowdsaleMultiple[0].minimumFundingGoal,
	constants.crowdsaleMultiple[0].maximumSellableTokens,
	constants.crowdsaleMultiple[0].isUpdatable,
	constants.crowdsaleMultiple[0].isWhiteListed
];

const crowdsaleParams2 = [
	constants.crowdsaleMultiple[1].start,
	constants.crowdsaleMultiple[1].end,
	constants.crowdsaleMultiple[1].minimumFundingGoal,
	constants.crowdsaleMultiple[1].maximumSellableTokens,
	constants.crowdsaleMultiple[1].isUpdatable,
	constants.crowdsaleMultiple[1].isWhiteListed
];

let nullFinalizeAgentParams = [];
let reservedTokensFinalizeAgentParams = [];

let safeMathLibExt
let crowdsaleTokenExt
let flatPricingExt1
let flatPricingExt2
let mintedTokenCappedCrowdsaleExt1
let mintedTokenCappedCrowdsaleExt2
let nullFinalizeAgentExt
let reservedTokensFinalizeAgent
let registry

let rate1
let rate2

async function deploy(accounts) {
	safeMathLibExt = await SafeMathLibExt.new()

	await CrowdsaleTokenExt.link("safeMathLibExt", safeMathLibExt.address)
	crowdsaleTokenExt = await CrowdsaleTokenExt.new(...tokenParams);

	await FlatPricingExt.link("safeMathLibExt", safeMathLibExt.address)
	flatPricingExt1 = await FlatPricingExt.new(...pricingStrategyParams1);
	flatPricingExt2 = await FlatPricingExt.new(...pricingStrategyParams2);

	crowdsaleParams1.unshift(accounts[3]);
	crowdsaleParams1.unshift(flatPricingExt1.address);
	crowdsaleParams1.unshift(crowdsaleTokenExt.address);
	crowdsaleParams1.unshift("Test Crowdsale");

	crowdsaleParams2.unshift(accounts[3]);
	crowdsaleParams2.unshift(flatPricingExt2.address);
	crowdsaleParams2.unshift(crowdsaleTokenExt.address);
	crowdsaleParams2.unshift("Test Crowdsale 2");

	await MintedTokenCappedCrowdsaleExt.link("safeMathLibExt", safeMathLibExt.address)
	mintedTokenCappedCrowdsaleExt1 = await MintedTokenCappedCrowdsaleExt.new(...crowdsaleParams1);
	mintedTokenCappedCrowdsaleExt2 = await MintedTokenCappedCrowdsaleExt.new(...crowdsaleParams2);

	nullFinalizeAgentParams.push(mintedTokenCappedCrowdsaleExt1.address);
	nullFinalizeAgentExt = await NullFinalizeAgentExt.new(...nullFinalizeAgentParams);

	reservedTokensFinalizeAgentParams.push(crowdsaleTokenExt.address);
	reservedTokensFinalizeAgentParams.push(mintedTokenCappedCrowdsaleExt2.address);

	await ReservedTokensFinalizeAgent.link("safeMathLibExt", safeMathLibExt.address)
	reservedTokensFinalizeAgent = await ReservedTokensFinalizeAgent.new(...reservedTokensFinalizeAgentParams);

	registry = await Registry.new();

	await crowdsaleTokenExt.setReservedTokensListMultiple(
		[accounts[2], accounts[4]], 
		[constants.reservedTokens.number,constants.reservedTokens2.number], 
		[constants.reservedTokens.percentageUnit,constants.reservedTokens2.percentageUnit], 
		[constants.reservedTokens.percentageDecimals,constants.reservedTokens2.percentageDecimals]
	);

	await flatPricingExt1.setTier(mintedTokenCappedCrowdsaleExt1.address);
	await flatPricingExt2.setTier(mintedTokenCappedCrowdsaleExt2.address);

	await mintedTokenCappedCrowdsaleExt1.updateJoinedCrowdsalesMultiple([mintedTokenCappedCrowdsaleExt1.address, mintedTokenCappedCrowdsaleExt2.address]);
	await mintedTokenCappedCrowdsaleExt2.updateJoinedCrowdsalesMultiple([mintedTokenCappedCrowdsaleExt1.address, mintedTokenCappedCrowdsaleExt2.address]);


	await crowdsaleTokenExt.setMintAgent(mintedTokenCappedCrowdsaleExt1.address, true);
	await crowdsaleTokenExt.setMintAgent(mintedTokenCappedCrowdsaleExt2.address, true);
	await crowdsaleTokenExt.setMintAgent(reservedTokensFinalizeAgent.address, true);

	await mintedTokenCappedCrowdsaleExt1.setEarlyParticipantWhitelistMultiple(
		[accounts[2], accounts[4]],
		[constants.whiteListItem2.status, constants.whiteListItem2.status], 
		[constants.whiteListItem2.minCap, constants.whiteListItem2.minCap], 
		[constants.whiteListItem2.maxCap, constants.whiteListItem2.maxCap]
	);

	await mintedTokenCappedCrowdsaleExt2.setEarlyParticipantWhitelistMultiple(
		[accounts[2], accounts[4]],
		[constants.whiteListItem2.status, constants.whiteListItem2.status], 
		[constants.whiteListItem2.minCap, constants.whiteListItem2.minCap], 
		[constants.whiteListItem2.maxCap, constants.whiteListItem2.maxCap]
	);

	await mintedTokenCappedCrowdsaleExt1.setFinalizeAgent(nullFinalizeAgentExt.address);
	await mintedTokenCappedCrowdsaleExt2.setFinalizeAgent(reservedTokensFinalizeAgent.address);

	await crowdsaleTokenExt.setReleaseAgent(reservedTokensFinalizeAgent.address);
	await crowdsaleTokenExt.transferOwnership(reservedTokensFinalizeAgent.address);
}

contract('MintedTokenCappedCrowdsaleExt 2 tiers', async function(accounts) {

	before(async () => {
	    await deploy(accounts);
	})

	it("should get rate1", async () => {
		rate1 = await flatPricingExt1.oneTokenInWei.call();
		rate2 = await flatPricingExt1.oneTokenInWei.call();

		let balanceOfMultisigInitial = 0;
		weiToSend1 = parseInt(constants.investments2[2] * rate1, 10); //weiToSend in 1st success investment;
		weiToSend2 = parseInt(constants.investments2[3] * rate1, 10); //weiToSend in 2nd success investment;
		weiToSend3 = parseInt(constants.investments2[4] * rate1, 10); //weiToSend in 3d success investment;
		weiToSend4 = parseInt(constants.investments2[6] * rate1, 10); //weiToSend in 4th success investment;
		
		weiToSend5 = parseInt(constants.investments2[7] * rate2, 10); //weiToSend in 1st success investment in 2nd tier;
	});

	it("shouldn't set finalize agent once more", async () => {
    	await mintedTokenCappedCrowdsaleExt1.setFinalizeAgent(reservedTokensFinalizeAgent.address).should.be.rejectedWith(ERROR_MSG);
	});

	it("shouldn't set pricing strategy once more", async () => {
    	await mintedTokenCappedCrowdsaleExt1.setPricingStrategy(flatPricingExt1.address).should.be.rejectedWith(ERROR_MSG);
	});

	it("shouldn't update rate1", async () => {
    	let newRate = 10**18 / 2000;
    	await mintedTokenCappedCrowdsaleExt1.updateRate(newRate).should.be.rejectedWith(ERROR_MSG);
	});

	it("shouldn't update max cap", async () => {
    	let newMaxCap = 200000000 * 10**18;
    	await mintedTokenCappedCrowdsaleExt1.setMaximumSellableTokens(newMaxCap).should.be.rejectedWith(ERROR_MSG);
	});

	it("shouldn't set startsAt", async () => {
		let newStartsAt = parseInt(new Date().getTime()/1000);
    	await mintedTokenCappedCrowdsaleExt1.setStartsAt(newStartsAt).should.be.rejectedWith(ERROR_MSG);
	});

	it("should get last tier tier for crowdsale contract", async () => {
		let lastCrowdsale = await mintedTokenCappedCrowdsaleExt1.getLastTier.call();
		mintedTokenCappedCrowdsaleExt2.address.should.be.bignumber.equal(lastCrowdsale);
	});

	it("should get name of 1st tier", async () => {
		let name = await mintedTokenCappedCrowdsaleExt1.name.call();
		name.should.be.equal("Test Crowdsale");
	});

	it("should get name of 2nd tier", async () => {
		let name = await mintedTokenCappedCrowdsaleExt2.name.call();
		name.should.be.equal("Test Crowdsale 2");
	});

	it("should get finalize agent for 1st tier", async () => {
		let finalizeAgent = await mintedTokenCappedCrowdsaleExt1.finalizeAgent.call();
		nullFinalizeAgentExt.address.should.be.bignumber.equal(finalizeAgent);
	});

	it("should get finalize agent for 2nd tier", async () => {
		let finalizeAgent = await mintedTokenCappedCrowdsaleExt2.finalizeAgent.call();
		reservedTokensFinalizeAgent.address.should.be.bignumber.equal(finalizeAgent);
	});

	it("should get pricing strategy", async () => {
		let flatPricingExtAddr = await mintedTokenCappedCrowdsaleExt1.pricingStrategy.call();
		flatPricingExt1.address.should.be.equal(flatPricingExtAddr);
	});

	it("should get isTierJoined", async () => {
		let isTierJoined = await mintedTokenCappedCrowdsaleExt1.isTierJoined.call(mintedTokenCappedCrowdsaleExt1.address);
		true.should.be.equal(isTierJoined);
	});

	it("should get tier position", async () => {
		let isTierJoined = await mintedTokenCappedCrowdsaleExt1.getTierPosition.call(mintedTokenCappedCrowdsaleExt1.address);
		isTierJoined.should.be.bignumber.equal(0);
	});

	it("should get early participant white list", async () => {
		let earlyParticipantWhitelistObj = await mintedTokenCappedCrowdsaleExt1.earlyParticipantWhitelist.call(accounts[2]);
		true.should.be.equal(earlyParticipantWhitelistObj[0]);
		constants.whiteListItem2.minCap.should.be.bignumber.equal(earlyParticipantWhitelistObj[1]);
		constants.whiteListItem2.maxCap.should.be.bignumber.equal(earlyParticipantWhitelistObj[2]);
	});

	it("checks, that addresses are whitelisted", async () => {
		let isAddress1Whitelisted = await mintedTokenCappedCrowdsaleExt1.isAddressWhitelisted.call(accounts[2]);
		true.should.be.equal(isAddress1Whitelisted);
		let isAddress2Whitelisted = await mintedTokenCappedCrowdsaleExt1.isAddressWhitelisted.call(accounts[4]);
		true.should.be.equal(isAddress2Whitelisted);
	});

	it("checks, that address is not whitelisted", async () => {
		let isAddressWhitelisted = await mintedTokenCappedCrowdsaleExt1.isAddressWhitelisted.call(accounts[5]);
		false.should.be.equal(isAddressWhitelisted);
	});

	it("should not add an address to the whitelist that was already added", async () => {
        let currentWhitelistLength = await mintedTokenCappedCrowdsaleExt1.whitelistedParticipantsLength.call();

        const token = constants.token
        const minCap = 1 * 10**token.decimals
        const maxCap = 20 * 10**token.decimals
        await mintedTokenCappedCrowdsaleExt1.setEarlyParticipantWhitelist(accounts[2], true, minCap, maxCap, { from: accounts[0] })

        let length = await mintedTokenCappedCrowdsaleExt1.whitelistedParticipantsLength.call()

        assert.equal(currentWhitelistLength.toString(), length.toString(), 'The length of the whitelist should not change')
    })

	it("shouldn't accept investment from not whitelisted user", async () => {
    	let weiToSend = parseInt(constants.investments2[0] * rate1, 10);
    	await buyRejected(accounts[1], weiToSend);
    });

	it("shouldn't accept investment from whitelisted user less than minCap", async () => {
    	let weiToSend = parseInt(constants.investments2[0] * rate1, 10);
    	await buyRejected(accounts[2], weiToSend);
	});

	it("shouldn't accept investment from whitelisted user greater than maxCap", async () => {
    	let weiToSend = parseInt(constants.investments2[1] * rate1, 10);
    	await buyRejected(accounts[2], weiToSend);
	});

	balanceOfMultisigInitial = web3.eth.getBalance(accounts[3]);

	it("should accept buy from whitelisted user 1 within cap range", async () => { await buySuccessfully(accounts[2], weiToSend1) });

	it("should return updated balance of multisig", () => { checkUpdatedBalanceOfMultisig(weiToSend1) });

	it("should return correct token's balance of user", async () => { await checkTokensBalance(accounts[2], constants.investments2[2]) });

	
	it("should accept buy from whitelisted user 2 within cap range", async () => { await buySuccessfully(accounts[4], weiToSend1) });

	it("should return updated balance of multisig", () => { checkUpdatedBalanceOfMultisig(2 * weiToSend1) });

	it("should return correct token's balance of user", async () => { await checkTokensBalance(accounts[4], constants.investments2[2]) });

	
	it("should accept buy less than minCap at second buy", async () => { await buySuccessfully(accounts[2], weiToSend2) });

	it("should return updated balance of multisig", () => { checkUpdatedBalanceOfMultisig(2 * weiToSend1 + weiToSend2) });

	it("should return correct token's balance of user", async () => { await checkTokensBalance(accounts[2], constants.investments2[2] + constants.investments2[3]) });


	it("should accept buy of fractionated amount of tokens from whitelisted user within cap range", async () => { await buySuccessfully(accounts[2], weiToSend3) });

	it("should return updated balance of multisig", () => { checkUpdatedBalanceOfMultisig(2 * weiToSend1 + weiToSend2 + weiToSend3) });

	it("should return correct token's balance of user", async () => { await checkTokensBalance(accounts[2], constants.investments2[2] + constants.investments2[3] + constants.investments2[4]) });

	
	it("shouldn't accept investment from whitelisted user that exceeds maxCap, when maxCap is not sold yet", async () => {
    	let weiToSend = parseInt(constants.investments2[5] * rate1, 10);
    	await buyRejected(accounts[2], weiToSend);
	});

	it("should accept investment from whitelisted user that reaches maxCap", async () => { await buySuccessfully(accounts[2], weiToSend4) });

	it("should return updated balance of multisig", () => { checkUpdatedBalanceOfMultisig(2 * weiToSend1 + weiToSend2 + weiToSend3 + weiToSend4) });

	it("should return correct token's balance of user", async () => { await checkTokensBalance(accounts[2], constants.investments2[2] + constants.investments2[3] + constants.investments2[4] + constants.investments2[6]) });


	it("should get the count of whitelisted participants", async () => {
		let whitelistedParticipantsLength = await mintedTokenCappedCrowdsaleExt1.whitelistedParticipantsLength.call();
		whitelistedParticipantsLength.should.be.bignumber.equal(2);
	});

	it("should get the whitelist participant from the array", async () => {
		let whitelistedParticipant = await mintedTokenCappedCrowdsaleExt1.whitelistedParticipants.call(0);
		whitelistedParticipant.should.be.equal(accounts[2]);
	});

	it("should not allow adding the 0 address to the whitelist", async () => {
		const token = constants.token;
        const minCap = 1 * 10**token.decimals;
        const maxCap = 20 * 10**token.decimals;
        await mintedTokenCappedCrowdsaleExt1.setEarlyParticipantWhitelist('0x0', true, minCap, maxCap, { from: accounts[0] }).should.be.rejectedWith(ERROR_MSG);;
	});

	it("should not allow adding an address to the whitelist with a minCap greater than the maxCap", async () => {
		const token = constants.token
        const minCap = 20 * 10**token.decimals
        const maxCap = 1 * 10**token.decimals
        await mintedTokenCappedCrowdsaleExt1.setEarlyParticipantWhitelist(accounts[5], true, minCap, maxCap, { from: accounts[0] }).should.be.rejectedWith(ERROR_MSG);;
	});

	it("should not allow adding an address to the whitelist with a maxCap of 0", async () => {
		const token = constants.token
        const minCap = 0
        const maxCap = 0
        await mintedTokenCappedCrowdsaleExt1.setEarlyParticipantWhitelist(accounts[5], true, minCap, maxCap, { from: accounts[0] }).should.be.rejectedWith(ERROR_MSG);;
	});

    it("can distribute reserved tokens should be false", async () => {
		let canDistributeReservedTokens = await mintedTokenCappedCrowdsaleExt1.canDistributeReservedTokens.call();
		false.should.be.equal(canDistributeReservedTokens);
	});

	it("should set endsAt", async () => {
		await mintedTokenCappedCrowdsaleExt1.setEndsAt(parseInt((new Date()).getTime()/1000, {from: accounts[0]})).should.be.fulfilled;
	});

	it("should not set endsAt, if crowdsale is already ended", async () => {
		await timeout(2000)
		await mintedTokenCappedCrowdsaleExt1.setEndsAt(parseInt((new Date()).getTime()/1000, {from: accounts[0]})).should.be.rejectedWith(ERROR_MSG);
	});

	it("can distribute reserved tokens shoul be false", async () => {
		let canDistributeReservedTokens = await mintedTokenCappedCrowdsaleExt1.canDistributeReservedTokens.call();
		false.should.be.equal(canDistributeReservedTokens);
	});

	it("should finalize 1st tier", async () => {
		await mintedTokenCappedCrowdsaleExt1.finalize().should.be.fulfilled;
	});

	it("should set startsAt for 2nd tier", async () => {
		await mintedTokenCappedCrowdsaleExt2.setStartsAt(parseInt((new Date()).getTime()/1000, {from: accounts[0]})).should.be.fulfilled;
	});

	//2nd = last tier is started

	it("should fail distribute 1st batch of reserved tokens", async () => {
		await mintedTokenCappedCrowdsaleExt2.distributeReservedTokens(1).should.be.rejectedWith(ERROR_MSG);
	});

	it("should fail finalize 2nd tier", async () => {
		await mintedTokenCappedCrowdsaleExt2.finalize().should.be.rejectedWith(ERROR_MSG);
	});

	it("should accept buy on 2nd tier from whitelisted user within cap range", async () => { await buySuccessfully2Tier(accounts[2], weiToSend5) });

	it("should return updated balance of multisig", () => { checkUpdatedBalanceOfMultisig(2 * weiToSend1 + weiToSend2 + weiToSend3 + weiToSend4 + weiToSend5) });

	it("should return correct token's balance of user", async () => { await checkTokensBalance(accounts[2], constants.investments2[2] + constants.investments2[3] + constants.investments2[4] + constants.investments2[6] + constants.investments2[7]) });


	it("shouldn't accept investment from whitelisted user that exceeds maxCap, when maxCap is already sold", async () => {
    	let weiToSend = parseInt(constants.investments2[0] * rate1, 10);
    	await buyRejected2Tier(accounts[2], weiToSend);
	});

	it("should set endsAt for 2nd tier", async () => {
		await timeout(2000)
		await mintedTokenCappedCrowdsaleExt2.setEndsAt(parseInt((new Date()).getTime()/1000, {from: accounts[0]})).should.be.fulfilled;
	});

	it("should not set endsAt, if crowdsale is already ended", async () => {
		await timeout(2000)
		await mintedTokenCappedCrowdsaleExt2.setEndsAt(parseInt((new Date()).getTime()/1000, {from: accounts[0]})).should.be.rejectedWith(ERROR_MSG);
	});

	it("can distribute reserved tokens shoul be true", async () => {
		let canDistributeReservedTokens = await mintedTokenCappedCrowdsaleExt2.canDistributeReservedTokens.call();
		true.should.be.equal(canDistributeReservedTokens);
	});

	it("should fail finalize", async () => {
		await mintedTokenCappedCrowdsaleExt2.finalize().should.be.rejectedWith(ERROR_MSG);
	});

	it("should fail distribution of reserved tokens with 0 batch", async () => {
		await mintedTokenCappedCrowdsaleExt2.distributeReservedTokens(0).should.be.rejectedWith(ERROR_MSG);
	});

	it("should distribute 1st batch of reserved tokens", async () => {
		await mintedTokenCappedCrowdsaleExt2.distributeReservedTokens(1).should.be.fulfilled;
	});

	it("should return that reserved tokens are distributed for one address", async () => {
		let distributedReservedTokensDestinationsLen = await reservedTokensFinalizeAgent.distributedReservedTokensDestinationsLen.call();
		distributedReservedTokensDestinationsLen.should.be.bignumber.equal(1);
	});

	it("should return that not all reserved tokens are distributed", async () => {
		let reservedTokensAreDistributed = await reservedTokensFinalizeAgent.reservedTokensAreDistributed.call();
		reservedTokensAreDistributed.should.be.equal(false);
	});

	it("should fail finalize", async () => {
		await mintedTokenCappedCrowdsaleExt2.finalize().should.be.rejectedWith(ERROR_MSG);
	});

	it("should distribute reserved tokens", async () => {
		await mintedTokenCappedCrowdsaleExt2.distributeReservedTokens(1).should.be.fulfilled;
	});

	it("should return that all reserved tokens are distributed", async () => {
		let distributedReservedTokensDestinationsLen  = await reservedTokensFinalizeAgent.distributedReservedTokensDestinationsLen.call();
		distributedReservedTokensDestinationsLen.should.be.bignumber.equal(2);

		let reservedTokensAreDistributed  = await reservedTokensFinalizeAgent.reservedTokensAreDistributed.call();
		reservedTokensAreDistributed.should.be.equal(true);
	});

	it("should fail distribution of reserved tokens", async () => {
		await mintedTokenCappedCrowdsaleExt2.distributeReservedTokens(1).should.be.rejectedWith(ERROR_MSG);
	});

	it("should can not distribute reserved tokens", async () => {
		let canDistributeReservedTokens = await mintedTokenCappedCrowdsaleExt2.canDistributeReservedTokens.call();
		false.should.be.equal(canDistributeReservedTokens);
	});

	it("should finalize crowdsale", async () => {
		await mintedTokenCappedCrowdsaleExt2.finalize().should.be.fulfilled;
	});

	let user1Investment = (constants.investments2[2] + constants.investments2[3] + constants.investments2[4] + constants.investments2[6] + constants.investments2[7]) * 10**constants.token.decimals
	let user2Investment = (constants.investments2[2]) * 10**constants.token.decimals
	let usersInvestment = user1Investment + user2Investment

	it("should return updated token balance of user 1 including reserved tokens", async () => {
		let tokenBalance = await crowdsaleTokenExt.balanceOf.call(accounts[2]);
		let tokenBalancePattern = user1Investment + usersInvestment * constants.reservedTokens.percentageUnit / 10**constants.reservedTokens.percentageDecimals / 100;
		tokenBalancePattern += constants.reservedTokens.number;
		tokenBalancePattern.should.be.bignumber.equal(tokenBalance);
	});

	it("should return updated token balance of user 2 including reserved tokens", async () => {
		let tokenBalance  = await crowdsaleTokenExt.balanceOf.call(accounts[4]);
		let tokenBalancePattern = user2Investment +  usersInvestment * constants.reservedTokens2.percentageUnit / 10**constants.reservedTokens2.percentageDecimals / 100;
		tokenBalancePattern += constants.reservedTokens2.number;
		tokenBalancePattern.should.be.bignumber.equal(tokenBalance);
	});

	function checkUpdatedBalanceOfMultisig(invested) {
		let balanceOfMultisigUpdated = web3.eth.getBalance(accounts[3]);
		let investedTotal = parseInt(balanceOfMultisigInitial, 10) + parseInt(invested);
		balanceOfMultisigUpdated.should.be.bignumber.equal(investedTotal);
	}

	async function checkTokensBalance(addr, investment) {
		let balance = await crowdsaleTokenExt.balanceOf.call(addr);
		balance.should.be.bignumber.equal(investment * 10**constants.token.decimals);
	}

	async function buySuccessfully(addr, val) {
		await mintedTokenCappedCrowdsaleExt1.buy({from: addr, value: val}).should.be.fulfilled;
	}

	async function buyRejected(addr, val) {
		await mintedTokenCappedCrowdsaleExt1.buy({from: addr, value: val}).should.be.rejectedWith(ERROR_MSG);
	}

	async function buySuccessfully2Tier(addr, val) {
		await mintedTokenCappedCrowdsaleExt2.buy({from: addr, value: val}).should.be.fulfilled;
	}

	async function buyRejected2Tier(addr, val) {
		await mintedTokenCappedCrowdsaleExt2.buy({from: addr, value: val}).should.be.rejectedWith(ERROR_MSG);
	}
});