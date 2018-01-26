const FlatPricingExt = artifacts.require("./FlatPricingExt.sol");
const MintedTokenCappedCrowdsaleExt = artifacts.require("./MintedTokenCappedCrowdsaleExt.sol");
const constants = require("../constants");

const Web3 = require("web3");

let web3;
if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
}

contract('FlatPricingExt', function(accounts) {
	it("should return rate of pricing strategy contract", async () => {
		let flatPricingExt = await FlatPricingExt.deployed();
		let rate = await flatPricingExt.oneTokenInWei.call();
		constants.rate = rate;
	    assert.equal(rate, web3.toWei(1 / constants.pricingStrategy.rate, "ether"), "rate should equal the value we inserted before");
	});
});