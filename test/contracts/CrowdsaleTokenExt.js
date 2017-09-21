var CrowdsaleTokenExt = artifacts.require("./CrowdsaleTokenExt.sol");

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
});