var SafeMathLibExt = artifacts.require("./SafeMathLibExt.sol");
var CrowdsaleTokenExt = artifacts.require("./CrowdsaleTokenExt.sol");
var FlatPricingExt = artifacts.require("./FlatPricingExt.sol");
var MintedTokenCappedCrowdsaleExt = artifacts.require("./MintedTokenCappedCrowdsaleExt.sol");

var Web3 = require("web3");

var web3;
if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
}

var token = {
	"ticker": "MTK",
	"name": "MyToken",
	"decimals": 18,
	"supply": 0,
	"isMintable": true,
	"globalmincap": 1
};

var pricingStrategy = {
	"rate": 1000
};

var startCrowdsale = parseInt(new Date().getTime()/1000);

let endCrowdsale = new Date().setDate(new Date().getDate() + 4);
endCrowdsale = parseInt(new Date(endCrowdsale).setUTCHours(0)/1000);

var crowdsale = {
	"updatable": true,
	"multisig": "0x005364854d51A0A12cb3cb9A402ef8b30702a565",
	"start": startCrowdsale,
	"end": endCrowdsale,
	"minimumFundingGoal": 0,
	"maximumSellableTokens": 1000,
	"isUpdatable": true,
	"isWhiteListed": false
}

var tokenParams = [
	token.name,
  	token.ticker,
  	parseInt(token.supply, 10),
  	parseInt(token.decimals, 10),
  	token.isMintable,
  	token.globalmincap
];

var pricingStrategyParams = [
	web3.toWei(1/pricingStrategy.rate, "ether"),
    crowdsale.updatable
];

var crowdsaleParams = [
	crowdsale.multisig,
	crowdsale.start,
	crowdsale.end,
	crowdsale.minimumFundingGoal,
	crowdsale.maximumSellableTokens,
	crowdsale.isUpdatable,
	crowdsale.isWhiteListed
];

module.exports = function(deployer, network, accounts) {
  	deployer.deploy(SafeMathLibExt).then(async () => {
	  	await deployer.link(SafeMathLibExt, CrowdsaleTokenExt);
  		await deployer.deploy(CrowdsaleTokenExt, ...tokenParams);
		await deployer.link(SafeMathLibExt, FlatPricingExt);
  		await deployer.deploy(FlatPricingExt, ...pricingStrategyParams);
		crowdsaleParams.unshift(FlatPricingExt.address);
		crowdsaleParams.unshift(CrowdsaleTokenExt.address);

		await deployer.link(SafeMathLibExt, MintedTokenCappedCrowdsaleExt);
    	deployer.deploy(MintedTokenCappedCrowdsaleExt, ...crowdsaleParams);
  	});
};