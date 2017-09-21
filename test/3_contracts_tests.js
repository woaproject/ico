var SafeMathLibExt = artifacts.require("./SafeMathLibExt.sol");
var CrowdsaleTokenExt = artifacts.require("./CrowdsaleTokenExt.sol");
var FlatPricingExt = artifacts.require("./FlatPricingExt.sol");
var MintedTokenCappedCrowdsaleExt = artifacts.require("./MintedTokenCappedCrowdsaleExt.sol");

contract('SafeMathLibExt', function(accounts) {
	it("should multiply 2 to 3", function() {
	    return SafeMathLibExt.deployed().then(function(instance) {
	      return instance.times.call(2,3);
	    }).then(function(res) {
	      assert.equal(res, 6, "2*3 isn't eqal 6");
	    });
	});
});