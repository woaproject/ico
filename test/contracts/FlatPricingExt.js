var FlatPricingExt = artifacts.require("./FlatPricingExt.sol");
var MintedTokenCappedCrowdsaleExt = artifacts.require("./MintedTokenCappedCrowdsaleExt.sol");

contract('FlatPricingExt', function(accounts) {
	it("should get last crowdsale tier for pricing strategy contract", function() {
		return FlatPricingExt.deployed().then(function(instance) {
	    	return instance.lastCrowdsale.call();
	    }).then(function(res) {
	      assert.equal(res, MintedTokenCappedCrowdsaleExt.address, "`lastCrowdsale` property of Priscing strategy contract is equal MintedTokenCappedCrowdsaleExt address");
	    });
	});
});