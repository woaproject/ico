const MintedTokenCappedCrowdsaleExt = artifacts.require("./MintedTokenCappedCrowdsaleExt.sol");
const ReservedTokensFinalizeAgent = artifacts.require("./ReservedTokensFinalizeAgent.sol");
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
	    	return instance.earlyParticipantWhitelist.call(constants.whiteListItem.addr);
	    }).then(function(res) {
	    	assert.equal(res[0], true, "white list item should be switched on (status should be `true`)");
	    });
	});

	it("should get early participant white list minCap", function() {
		return MintedTokenCappedCrowdsaleExt.deployed().then(function(instance) {
	    	return instance.earlyParticipantWhitelist.call(constants.whiteListItem.addr);
	    }).then(function(res) {
	    	assert.equal(res[1], constants.whiteListItem.minCap, "white list item minCap should return value we inserted before at deploying stage");
	    });
	});

	it("should get early participant white list maxCap", function() {
		return MintedTokenCappedCrowdsaleExt.deployed().then(function(instance) {
	    	return instance.earlyParticipantWhitelist.call(constants.whiteListItem.addr);
	    }).then(function(res) {
	    	assert.equal(res[2], constants.whiteListItem.maxCap, "white list item maxCap should return value we inserted before at deploying stage");
	    });
	});
});