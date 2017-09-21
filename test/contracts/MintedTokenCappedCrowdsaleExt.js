const CrowdsaleTokenExt = artifacts.require("./CrowdsaleTokenExt.sol");
const MintedTokenCappedCrowdsaleExt = artifacts.require("./MintedTokenCappedCrowdsaleExt.sol");
const ReservedTokensFinalizeAgent = artifacts.require("./ReservedTokensFinalizeAgent.sol");
const FlatPricingExt = artifacts.require("./FlatPricingExt.sol");
const constants = require("../constants");
const utils = require("../utils");

contract('MintedTokenCappedCrowdsaleExt', function(accounts) {
	it("should get last crowdsale tier for crowdsale contract", function() {
		return MintedTokenCappedCrowdsaleExt.deployed().then(function(instance) {
	    	return instance.lastCrowdsale.call();
	    }).then(function(res) {
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

	it("should get finalize agent", function() {
		return MintedTokenCappedCrowdsaleExt.deployed().then(function(instance) {
	    	return instance.finalizeAgent.call();
	    }).then(function(res) {
	    	assert.equal(res, ReservedTokensFinalizeAgent.address, "ReservedTokensFinalizeAgent contract should be the finalizeAgent of crowdsale contract");
	    });
	});

	it("should get early participant white list", function() {
		return MintedTokenCappedCrowdsaleExt.deployed().then(function(instance) {
	    	return instance.earlyParticipantWhitelist.call(accounts[0]);
	    }).then(function(res) {
	    	assert.equal(res[0], true, "white list item should be switched on (status should be `true`)");
	    });
	});

	it("should get early participant white list minCap", function() {
		return MintedTokenCappedCrowdsaleExt.deployed().then(function(instance) {
	    	return instance.earlyParticipantWhitelist.call(accounts[0]);
	    }).then(function(res) {
	    	assert.equal(res[1], constants.whiteListItem.minCap, "white list item minCap should return value we inserted before at deploying stage");
	    });
	});

	it("should get early participant white list maxCap", function() {
		return MintedTokenCappedCrowdsaleExt.deployed().then(function(instance) {
	    	return instance.earlyParticipantWhitelist.call(accounts[0]);
	    }).then(function(res) {
	    	assert.equal(res[2], constants.whiteListItem.maxCap, "white list item maxCap should return value we inserted before at deploying stage");
	    });
	});

	it("shouldn't accept investment from not whitelisted user", function() {
		let weiToSend = parseInt(constants.investments[0]*constants.rate, 10);
		return MintedTokenCappedCrowdsaleExt.deployed().then(function(instance) {
	    	return instance.buy({from: accounts[1], value: weiToSend});
	    }).then(function(res) {
	    	assert.isOk(false, 'investment willn`t fall');
	    }, function(err) {
	    	assert.isOk('everything', 'investment is not passed');
	    });
	});

	it("shouldn't accept investment from whitelisted user less than minCap", function() {
		let weiToSend = parseInt(constants.investments[0]*constants.rate, 10);
		return MintedTokenCappedCrowdsaleExt.deployed().then(function(instance) {
			return instance.buy({from: accounts[0], value: weiToSend});
	    }).then(function(res) {
	    	assert.isOk(false, 'investment willn`t fall');
	    }, function(err) {
	    	assert.isOk('everything', 'investment less than minCap for investor is not allowed');
	    });
	});

	it("shouldn't accept investment from whitelisted user more than maxCap", function() {
		let weiToSend = parseInt(constants.investments[1]*constants.rate, 10);
		return MintedTokenCappedCrowdsaleExt.deployed().then(function(instance) {
			return instance.buy({from: accounts[0], value: weiToSend});
	    }).then(function(res) {
	    	assert.isOk(false, 'investment willn`t fall');
	    }, function(err) {
	    	assert.isOk('everything', 'investment greater than maxCap for investor is not allowed');
	    });
	});

	it("should accept buy from whitelisted user within cap range", function() {
		let weiToSend = parseInt(constants.investments[2]*constants.rate, 10);
		return MintedTokenCappedCrowdsaleExt.deployed().then(function(instance) {
	    	return instance.buy({from: accounts[0], value: weiToSend});
	    }).then(function(res) {
	    	if (res.receipt.blockNumber > 0) {
	    		assert.isOk('everything', 'investment is passed');
	    	} else {
	    		assert.isOk(false, 'investment will fall');
	    	}
	    });
	});

	it("should return token balalnce we inserted before", function() {
		let weiToSend = parseInt(constants.investments[2]*constants.rate, 10);
		return CrowdsaleTokenExt.deployed().then(function(instance) {
	    	return instance.balanceOf.call(accounts[0]);
	    }).then(function(res) {
	    	console.log(res);
	    	assert.equal(res, constants.investments[2]*10**constants.token.decimals, "balance of investor should be equal the value we inserted before");
	    });
	}); 
});