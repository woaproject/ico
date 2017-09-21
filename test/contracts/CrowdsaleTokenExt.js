const CrowdsaleTokenExt = artifacts.require("./CrowdsaleTokenExt.sol");
const MintedTokenCappedCrowdsaleExt = artifacts.require("./MintedTokenCappedCrowdsaleExt.sol");
const NullFinalizeAgentExt = artifacts.require("./NullFinalizeAgentExt.sol");
const ReservedTokensFinalizeAgent = artifacts.require("./ReservedTokensFinalizeAgent.sol");

var token = {
	"ticker": "MTK",
	"name": "MyToken",
	"decimals": 18,
	"supply": 0,
	"isMintable": true,
	"globalmincap": 1
};

var investor = {
	addr: "0x005364854d51A0A12cb3cb9A402ef8b30702a565",
	reservedTokens: 10*10**token.decimals,
	reservedTokensInPercentage: 20,
};

contract('CrowdsaleTokenExt', function(accounts) {
	it("should get absolute reserved tokens for investor", function() {
		return CrowdsaleTokenExt.deployed().then(function(instance) {
	    	return instance.getReservedTokensListValInTokens.call(investor.addr);
	    }).then(function(res) {
	    	assert.equal(res, investor.reservedTokens, "`getReservedTokensListValInTokens` method returns absolute investor's reserved tokens");
	    });
	});

	it("should get reserved tokens in percentage for investor", function() {
		return CrowdsaleTokenExt.deployed().then(function(instance) {
	    	return instance.getReservedTokensListValInPercentage.call(investor.addr);
	    }).then(function(res) {
	    	assert.equal(res, investor.reservedTokensInPercentage, "`getReservedTokensListValInPercentage` method returns investor's reserved tokens in percentage");
	    });
	});

	it("should get mint agent: crowdsale contract", function() {
		return CrowdsaleTokenExt.deployed().then(function(instance) {
	    	return instance.mintAgents.call(MintedTokenCappedCrowdsaleExt.address);
	    }).then(function(res) {
	    	console.log(res);
	    	assert.equal(res, true, "Crowdsale contract should be in minAgents of token contract");
	    });
	});

	it("should get mint agent: NullFinalizeAgentExt contract", function() {
		return CrowdsaleTokenExt.deployed().then(function(instance) {
	    	return instance.mintAgents.call(NullFinalizeAgentExt.address);
	    }).then(function(res) {
	    	console.log(res);
	    	assert.equal(res, true, "NullFinalizeAgentExt contract should be in minAgents of token contract");
	    });
	});

	it("should get mint agent: ReservedTokensFinalizeAgent contract", function() {
		return CrowdsaleTokenExt.deployed().then(function(instance) {
	    	return instance.mintAgents.call(ReservedTokensFinalizeAgent.address);
	    }).then(function(res) {
	    	console.log(res);
	    	assert.equal(res, true, "ReservedTokensFinalizeAgent contract should be in minAgents of token contract");
	    });
	});

	it("should get release agent", function() {
		return CrowdsaleTokenExt.deployed().then(function(instance) {
	    	return instance.releaseAgent.call();
	    }).then(function(res) {
	    	console.log(res);
	    	assert.equal(res, ReservedTokensFinalizeAgent.address, "ReservedTokensFinalizeAgent contract should be the releaseAgent of token contract");
	    });
	});
});