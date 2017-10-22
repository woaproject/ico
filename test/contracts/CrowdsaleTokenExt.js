const CrowdsaleTokenExt = artifacts.require("./CrowdsaleTokenExt.sol");
const MintedTokenCappedCrowdsaleExt = artifacts.require("./MintedTokenCappedCrowdsaleExt.sol");
const NullFinalizeAgentExt = artifacts.require("./NullFinalizeAgentExt.sol");
const ReservedTokensFinalizeAgent = artifacts.require("./ReservedTokensFinalizeAgent.sol");

const constants = require("../constants");

contract('CrowdsaleTokenExt', function(accounts) {
	it("should get absolute reserved tokens for investor", function() {
		return CrowdsaleTokenExt.deployed().then(function(instance) {
	    	return instance.getReservedTokensListValInTokens.call(accounts[2]);
	    }).then(function(res) {
	    	assert.equal(res, constants.reservedTokens.reservedTokensInTokens, "`getReservedTokensListValInTokens` method returns absolute investor's reserved tokens");
	    });
	});

	it("should get reserved tokens in percentage unit for investor", function() {
		return CrowdsaleTokenExt.deployed().then(function(instance) {
	    	return instance.getReservedTokensListValInPercentageUnit.call(accounts[2]);
	    }).then(function(res) {
	    	assert.equal(res, constants.reservedTokens.reservedTokensInPercentageUnit, "`getReservedTokensListValInPercentageUnit` method returns investor's reserved tokens in percentage unit");
	    });
	});

	it("should get percentage decimals for reserved tokens", function() {
		return CrowdsaleTokenExt.deployed().then(function(instance) {
	    	return instance.getReservedTokensListValInPercentageDecimals.call(accounts[2]);
	    }).then(function(res) {
	    	assert.equal(res, constants.reservedTokens.reservedTokensInPercentageDecimals, "`getReservedTokensListValInPercentageDecimals` method returns percentage decimals for investor's reserved tokens");
	    });
	});

	it("should get mint agent: crowdsale contract", function() {
		return CrowdsaleTokenExt.deployed().then(function(instance) {
	    	return instance.mintAgents.call(MintedTokenCappedCrowdsaleExt.address);
	    }).then(function(res) {
	    	assert.equal(res, true, "Crowdsale contract should be in minAgents of token contract");
	    });
	});

	it("should get mint agent: NullFinalizeAgentExt contract", function() {
		return CrowdsaleTokenExt.deployed().then(function(instance) {
	    	return instance.mintAgents.call(NullFinalizeAgentExt.address);
	    }).then(function(res) {
	    	assert.equal(res, true, "NullFinalizeAgentExt contract should be in minAgents of token contract");
	    });
	});

	it("should get mint agent: ReservedTokensFinalizeAgent contract", function() {
		return CrowdsaleTokenExt.deployed().then(function(instance) {
	    	return instance.mintAgents.call(ReservedTokensFinalizeAgent.address);
	    }).then(function(res) {
	    	assert.equal(res, true, "ReservedTokensFinalizeAgent contract should be in minAgents of token contract");
	    });
	});

	it("should get release agent", function() {
		return CrowdsaleTokenExt.deployed().then(function(instance) {
	    	return instance.releaseAgent.call();
	    }).then(function(res) {
	    	assert.equal(res, ReservedTokensFinalizeAgent.address, "ReservedTokensFinalizeAgent contract should be the releaseAgent of token contract");
	    });
	});

	it("should get owner", function() {
		return CrowdsaleTokenExt.deployed().then(function(instance) {
	    	return instance.owner.call();
	    }).then(function(res) {
	    	assert.equal(res, ReservedTokensFinalizeAgent.address, "ReservedTokensFinalizeAgent contract should be the owner of token contract");
	    });
	});
});