var MintedTokenCappedCrowdsaleExt = artifacts.require("./MintedTokenCappedCrowdsaleExt.sol");

contract('MintedTokenCappedCrowdsaleExt', function(accounts) {
	it("should get last crowdsale tier for crowdsale contract", function() {
		return MintedTokenCappedCrowdsaleExt.deployed().then(function(instance) {
	    	return instance.lastCrowdsale.call();
	    }).then(function(res) {
	    	console.log(res);
	      assert.equal(res, MintedTokenCappedCrowdsaleExt.address, "`lastCrowdsale` property of Crowdsale contract is equal MintedTokenCappedCrowdsaleExt address");
	    });
	});

	//todo
	/*it("should get joinedCrowdsales item for crowdsale contract", function() {
		return MintedTokenCappedCrowdsaleExt.deployed().then(function(instance) {
	    	return instance.joinedCrowdsales.call(0);
	    }).then(function(res) {
	    	console.log(res);
	      assert.equal(res, MintedTokenCappedCrowdsaleExt.address, "`joinedCrowdsales[0]` property of Crowdsale contract is equal MintedTokenCappedCrowdsaleExt address");
	    });
	});*/
});