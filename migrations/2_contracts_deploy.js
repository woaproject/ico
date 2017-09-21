const SafeMathLibExt = artifacts.require("./SafeMathLibExt.sol");
const CrowdsaleTokenExt = artifacts.require("./CrowdsaleTokenExt.sol");
const FlatPricingExt = artifacts.require("./FlatPricingExt.sol");
const MintedTokenCappedCrowdsaleExt = artifacts.require("./MintedTokenCappedCrowdsaleExt.sol");
const NullFinalizeAgentExt = artifacts.require("./NullFinalizeAgentExt.sol");
const ReservedTokensFinalizeAgent = artifacts.require("./ReservedTokensFinalizeAgent.sol");

const utils = require("./utils");
const Web3 = require("web3");

const token = {
	"ticker": "MTK",
	"name": "MyToken",
	"decimals": 18,
	"supply": 0,
	"isMintable": true,
	"globalmincap": 1
};

const investor = {
	addr: "0x005364854d51A0A12cb3cb9A402ef8b30702a565",
	reservedTokens: utils.toFixed(10*10**token.decimals),
	reservedTokensInPercentage: 20
};

const pricingStrategy = {
	"rate": 1000
};

const startCrowdsale = parseInt(new Date().getTime()/1000);
let endCrowdsale = new Date().setDate(new Date().getDate() + 4);
endCrowdsale = parseInt(new Date(endCrowdsale).setUTCHours(0)/1000);

const crowdsale = {
	"updatable": true,
	"multisig": "0x005364854d51A0A12cb3cb9A402ef8b30702a565",
	"start": startCrowdsale,
	"end": endCrowdsale,
	"minimumFundingGoal": 0,
	"maximumSellableTokens": 1000,
	"isUpdatable": true,
	"isWhiteListed": false
}

const tokenParams = [
	token.name,
  	token.ticker,
  	parseInt(token.supply, 10),
  	parseInt(token.decimals, 10),
  	token.isMintable,
  	token.globalmincap
];

let web3;
if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
}

const pricingStrategyParams = [
	web3.toWei(1/pricingStrategy.rate, "ether"),
    crowdsale.updatable
];

const crowdsaleParams = [
	crowdsale.multisig,
	crowdsale.start,
	crowdsale.end,
	crowdsale.minimumFundingGoal,
	crowdsale.maximumSellableTokens,
	crowdsale.isUpdatable,
	crowdsale.isWhiteListed
];

let nullFinalizeAgentParams = [];
let reservedTokensFinalizeAgentParams = [];

module.exports = function(deployer, network, accounts) {
  	deployer.deploy(SafeMathLibExt).then(async () => {
	  	await deployer.link(SafeMathLibExt, CrowdsaleTokenExt);
  		await deployer.deploy(CrowdsaleTokenExt, ...tokenParams);
		await deployer.link(SafeMathLibExt, FlatPricingExt);
  		await deployer.deploy(FlatPricingExt, ...pricingStrategyParams);
		crowdsaleParams.unshift(FlatPricingExt.address);
		crowdsaleParams.unshift(CrowdsaleTokenExt.address);

		await deployer.link(SafeMathLibExt, MintedTokenCappedCrowdsaleExt);
    	await deployer.deploy(MintedTokenCappedCrowdsaleExt, ...crowdsaleParams);

    	nullFinalizeAgentParams.push(MintedTokenCappedCrowdsaleExt.address);
    	reservedTokensFinalizeAgentParams.push(CrowdsaleTokenExt.address);
    	reservedTokensFinalizeAgentParams.push(MintedTokenCappedCrowdsaleExt.address);

    	await deployer.link(SafeMathLibExt, NullFinalizeAgentExt);
    	await deployer.deploy(NullFinalizeAgentExt, ...nullFinalizeAgentParams);
    	await deployer.link(SafeMathLibExt, ReservedTokensFinalizeAgent);
    	await deployer.deploy(ReservedTokensFinalizeAgent, ...reservedTokensFinalizeAgentParams);

    	await FlatPricingExt.deployed().then(async (instance) => {
	    	instance.setLastCrowdsale(MintedTokenCappedCrowdsaleExt.address);
	    });

	    await CrowdsaleTokenExt.deployed().then(async (instance) => {
	    	//todo: setReservedTokensListMultiple
	    	/*let addrs = [];
	    	addrs.push(investor.addr);
	    	let inTokens = [];
	    	inTokens.push(investor.reservedTokens);
	    	let inTokensPercentage = [];
	    	inTokensPercentage.push(investor.reservedTokensInPercentage);
	    	instance.setReservedTokensListMultiple(addrs, inTokens, inTokensPercentage);*/
	    	await instance.setReservedTokensList(investor.addr, investor.reservedTokens, investor.reservedTokensInPercentage);
	    });

	    await MintedTokenCappedCrowdsaleExt.deployed().then(async (instance) => {
	    	//instance.updateJoinedCrowdsalesMultiple(MintedTokenCappedCrowdsaleExt.address);
	    	await instance.clearJoinedCrowdsales();
	    	//await instance.updateJoinedCrowdsales(instance.address);
	    });

	    await MintedTokenCappedCrowdsaleExt.deployed().then(async (instance) => {
	    	await instance.setLastCrowdsale(instance.address);
	    });

	    await CrowdsaleTokenExt.deployed().then(async (instance) => {
	    	await instance.setMintAgent(MintedTokenCappedCrowdsaleExt.address, true);
	    });

	    await CrowdsaleTokenExt.deployed().then(async (instance) => {
	    	await instance.setMintAgent(NullFinalizeAgentExt.address, true);
	    });

	    await CrowdsaleTokenExt.deployed().then(async (instance) => {
	    	await instance.setMintAgent(ReservedTokensFinalizeAgent.address, true);
	    });

	    await MintedTokenCappedCrowdsaleExt.deployed().then(async (instance) => {
	    	await instance.setFinalizeAgent(ReservedTokensFinalizeAgent.address);
	    });

	    await CrowdsaleTokenExt.deployed().then(async (instance) => {
	    	await instance.setReleaseAgent(ReservedTokensFinalizeAgent.address);
	    });
  	});
};