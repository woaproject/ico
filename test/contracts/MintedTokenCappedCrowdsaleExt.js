const CrowdsaleTokenExt = artifacts.require("./CrowdsaleTokenExt.sol");
const MintedTokenCappedCrowdsaleExt = artifacts.require("./MintedTokenCappedCrowdsaleExt.sol");
const ReservedTokensFinalizeAgent = artifacts.require("./ReservedTokensFinalizeAgent.sol");
const FlatPricingExt = artifacts.require("./FlatPricingExt.sol");
const constants = require("../constants");
const utils = require("../utils");
const ERROR_MSG = 'VM Exception while processing transaction: invalid opcode';

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(web3.BigNumber))
  .should();

let balanceOfMultisigInitial = 0;
let weiToSend1 = 0; //weiToSend in 1st success investment;
let weiToSend2 = 0; //weiToSend in 2nd success investment;
let weiToSend3 = 0; //weiToSend in 3d success investment;

contract('MintedTokenCappedCrowdsaleExt', function(accounts) {
	it("should get last tier tier for crowdsale contract", function() {
		return MintedTokenCappedCrowdsaleExt.deployed().then(function(instance) {
	    	return instance.lastTier.call();
	    }).then(function(res) {
	      assert.equal(res, MintedTokenCappedCrowdsaleExt.address, "`lastTier` property of Crowdsale contract is equal MintedTokenCappedCrowdsaleExt address");
	    });
	});

	it("shouldn't set finalize agent once more", async () => {
    	let mintedTokenCappedCrowdsaleExt = await MintedTokenCappedCrowdsaleExt.deployed();
    	let reservedTokensFinalizeAgent = await ReservedTokensFinalizeAgent.deployed();
    	await mintedTokenCappedCrowdsaleExt.setFinalizeAgent(reservedTokensFinalizeAgent.address).should.be.rejectedWith(ERROR_MSG);;
	});

	it("shouldn't set pricing strategy once more", async () => {
    	let mintedTokenCappedCrowdsaleExt = await MintedTokenCappedCrowdsaleExt.deployed();
    	let flatPricingExt = await FlatPricingExt.deployed();
    	await mintedTokenCappedCrowdsaleExt.setPricingStrategy(flatPricingExt.address).should.be.rejectedWith(ERROR_MSG);;
	});

	it("shouldn't update rate", async () => {
    	let newRate = 10**18 / 2000;
    	let mintedTokenCappedCrowdsaleExt = await MintedTokenCappedCrowdsaleExt.deployed();
    	let flatPricingExt = await FlatPricingExt.deployed();
    	await mintedTokenCappedCrowdsaleExt.updateRate(newRate).should.be.rejectedWith(ERROR_MSG);;
	});

	it("shouldn't update max cap", async () => {
    	let newMaxCap = 200000000 * 10**18;
    	let mintedTokenCappedCrowdsaleExt = await MintedTokenCappedCrowdsaleExt.deployed();
    	await mintedTokenCappedCrowdsaleExt.setMaximumSellableTokens(newMaxCap).should.be.rejectedWith(ERROR_MSG);;
	});

	/*it("should update rate", async () => {
    	let newRate = 10**18 / 2000;
    	let mintedTokenCappedCrowdsaleExt = await MintedTokenCappedCrowdsaleExt.deployed();
    	let flatPricingExt = await FlatPricingExt.deployed();
    	await mintedTokenCappedCrowdsaleExt.updateRate(newRate);
    	let rate = await flatPricingExt.oneTokenInWei.call();
    	rate.should.be.bignumber.equal(newRate);
	});

	it("should update max cap", async () => {
    	let newMaxCap = 200000000 * 10**18;
    	let mintedTokenCappedCrowdsaleExt = await MintedTokenCappedCrowdsaleExt.deployed();
    	await mintedTokenCappedCrowdsaleExt.setMaximumSellableTokens(newMaxCap);
    	let maxCap = await mintedTokenCappedCrowdsaleExt.maximumSellableTokens.call();
    	maxCap.should.be.bignumber.equal(newMaxCap);
	});

	it("should update startsAt", async () => {
		let newStartsAt = parseInt(new Date().getTime()/1000);
    	let mintedTokenCappedCrowdsaleExt = await MintedTokenCappedCrowdsaleExt.deployed();
    	await mintedTokenCappedCrowdsaleExt.setStartsAt(newStartsAt);
    	let startsAt = await mintedTokenCappedCrowdsaleExt.startsAt.call();
    	startsAt.should.be.bignumber.equal(newStartsAt);
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
	    	return instance.earlyParticipantWhitelist.call(accounts[2]);
	    }).then(function(res) {
	    	assert.equal(res[0], true, "white list item should be switched on (status should be `true`)");
	    });
	});

	it("should get early participant white list minCap", function() {
		return MintedTokenCappedCrowdsaleExt.deployed().then(function(instance) {
	    	return instance.earlyParticipantWhitelist.call(accounts[2]);
	    }).then(function(res) {
	    	assert.equal(res[1], constants.whiteListItem.minCap, "white list item minCap should return value we inserted before at deploying stage");
	    });
	});

	it("should get early participant white list maxCap", function() {
		return MintedTokenCappedCrowdsaleExt.deployed().then(function(instance) {
	    	return instance.earlyParticipantWhitelist.call(accounts[2]);
	    }).then(function(res) {
	    	assert.equal(res[2], constants.whiteListItem.maxCap, "white list item maxCap should return value we inserted before at deploying stage");
	    });
	});

	it("shouldn't accept investment from not whitelisted user", function() {
		let weiToSend = parseInt(constants.investments[0]*constants.rate, 10);
		return MintedTokenCappedCrowdsaleExt.deployed().then(function(instance) {
	    	return instance.buy({from: accounts[1], value: weiToSend});
	    }).then(function(res) {
	    	assert.isOk(false, 'investment won`t fall');
	    }, function(err) {
	    	assert.isOk('everything', 'investment is not passed');
	    });
	});

	it("shouldn't accept investment from whitelisted user less than minCap", function() {
		let weiToSend = parseInt(constants.investments[0]*constants.rate, 10);
		return MintedTokenCappedCrowdsaleExt.deployed().then(function(instance) {
			return instance.buy({from: accounts[2], value: weiToSend});
	    }).then(function(res) {
	    	assert.isOk(false, 'investment won`t fall');
	    }, function(err) {
	    	assert.isOk('everything', 'investment less than minCap for investor is not allowed');
	    });
	});

	it("shouldn't accept investment from whitelisted user more than maxCap", function() {
		let weiToSend = parseInt(constants.investments[1]*constants.rate, 10);
		return MintedTokenCappedCrowdsaleExt.deployed().then(function(instance) {
			return instance.buy({from: accounts[2], value: weiToSend});
	    }).then(function(res) {
	    	assert.isOk(false, 'investment won`t fall');
	    }, function(err) {
	    	assert.isOk('everything', 'investment is greater than maxCap for investor is not allowed');
	    });
	});

	balanceOfMultisigInitial = web3.eth.getBalance(accounts[3]);

	it("should accept buy from whitelisted user 1 within cap range", function() {
		weiToSend1 = parseInt(constants.investments[2]*constants.rate, 10);
		return MintedTokenCappedCrowdsaleExt.deployed().then(function(instance) {
	    	return instance.buy({from: accounts[2], value: weiToSend1});
	    }).then(function(res) {
	    	if (res.receipt.blockNumber > 0) {
	    		assert.isOk('everything', 'investment is passed');
	    	} else {
	    		assert.isOk(false, 'investment will fall');
	    	}
	    });
	});

	it("should return updated balance of multisig", function() {
		let balanceOfMultisigUpdated = web3.eth.getBalance(accounts[3]);
		assert.equal(balanceOfMultisigUpdated, parseInt(balanceOfMultisigInitial, 10) + parseInt(weiToSend1, 10), "balance of multisig should be increased to invested value");
	});

	it("should accept buy from whitelisted user 2 within cap range", function() {
		weiToSend1 = parseInt(constants.investments[2]*constants.rate, 10);
		return MintedTokenCappedCrowdsaleExt.deployed().then(function(instance) {
	    	return instance.buy({from: accounts[4], value: weiToSend1});
	    }).then(function(res) {
	    	if (res.receipt.blockNumber > 0) {
	    		assert.isOk('everything', 'investment is passed');
	    	} else {
	    		assert.isOk(false, 'investment will fall');
	    	}
	    });
	});

	it("should return updated balance of multisig", function() {
		let balanceOfMultisigUpdated = web3.eth.getBalance(accounts[3]);
		assert.equal(balanceOfMultisigUpdated, parseInt(balanceOfMultisigInitial, 10) + 2 * parseInt(weiToSend1, 10), "balance of multisig should be increased to invested value");
	});

	it("should return token's balance we have bought in previous step", function() {
		return CrowdsaleTokenExt.deployed().then(function(instance) {
	    	return instance.balanceOf.call(accounts[2]);
	    }).then(function(res) {
	    	assert.equal(res, constants.investments[2]*10**constants.token.decimals, "balance of investor should be equal the value we bought before");
	    });
	});

	it("should accept buy less than minCap at second buy", function() {
		weiToSend2 = parseInt(constants.investments[3]*constants.rate, 10);
		return MintedTokenCappedCrowdsaleExt.deployed().then(function(instance) {
	    	return instance.buy({from: accounts[2], value: weiToSend2});
	    }).then(function(res) {
	    	if (res.receipt.blockNumber > 0) {
	    		assert.isOk('everything', 'investment is passed');
	    	} else {
	    		assert.isOk(false, 'investment will fall');
	    	}
	    });
	});

	it("should return updated balance of multisig", function() {
		let balanceOfMultisigUpdated = web3.eth.getBalance(accounts[3]);
		assert.equal(balanceOfMultisigUpdated, (parseInt(balanceOfMultisigInitial, 10) + 2 * parseInt(weiToSend1, 10) + parseInt(weiToSend2, 10)), "balance of multisig should be increased to invested value");
	});

	it("should accept buy of fractionated amount of tokens from whitelisted user within cap range", function() {
		weiToSend3 = parseInt(constants.investments[4]*constants.rate, 10);
		return MintedTokenCappedCrowdsaleExt.deployed().then(function(instance) {
	    	return instance.buy({from: accounts[2], value: weiToSend3});
	    }).then(function(res) {
	    	if (res.receipt.blockNumber > 0) {
	    		assert.isOk('everything', 'investment is passed');
	    	} else {
	    		assert.isOk(false, 'investment will fall');
	    	}
	    });
	});

	it("should return token balance we have bought in previous step", function() {
		return CrowdsaleTokenExt.deployed().then(function(instance) {
	    	return instance.balanceOf.call(accounts[2]);
	    }).then(function(res) {
	    	assert.equal(res, (constants.investments[2] + constants.investments[3] + constants.investments[4])*10**constants.token.decimals, "balance of investor should be equal the total value we bought before");
	    });
	});

	it("should return updated balance of multisig", function() {
		let balanceOfMultisigUpdated = web3.eth.getBalance(accounts[3]);
		assert.equal(balanceOfMultisigUpdated, (parseInt(balanceOfMultisigInitial, 10) + 2 * parseInt(weiToSend1, 10) + parseInt(weiToSend2, 10) + parseInt(weiToSend3, 10)), "balance of multisig should be increased to invested value");
	});

	it("shouldn't accept investment from whitelisted user that exceeds maxCap", function() {
		let weiToSend = parseInt(constants.investments[5]*constants.rate, 10);
		return MintedTokenCappedCrowdsaleExt.deployed().then(function(instance) {
			return instance.buy({from: accounts[2], value: weiToSend});
	    }).then(function(res) {
	    	assert.isOk(false, 'investment won`t fall');
	    }, function(err) {
	    	assert.isOk('everything', 'investment is greater than maxCap in total for investor is not allowed');
	    });
	});

	it("should get the count of whitelisted participants", function() {
		return MintedTokenCappedCrowdsaleExt.deployed().then(function(instance) {
			return instance.whitelistedParticipantsLength.call();
	    }).then(function(whitelistedParticipantsLength) {
	    	assert.equal(whitelistedParticipantsLength, 2, 'should have 2 whitelisted participants');
	    });
	});

	it("should add whitelisted participants to the list", function() {
		return MintedTokenCappedCrowdsaleExt.deployed().then(function(instance) {
			return instance.whitelistedParticipants.call(0);
	    }).then(function(whitelistedParticipant) {
	    	assert.equal(whitelistedParticipant, accounts[2], 'should have added the whitelisted participant');
	    });
	});

    it("should not allow adding the 0 address to the whitelist", function() {
		return MintedTokenCappedCrowdsaleExt.deployed().then(function(instance) {
            const token = constants.token
            const minCap = 1 * 10**token.decimals
            const maxCap = 10 * 10**token.decimals
			return instance.setEarlyParticipantWhitelist('0x0', true, minCap, maxCap, { from: accounts[0] });
	    }).then(function() {
	    	assert.fail('transaction should fail');
        }, function(e) {
            // should enter here
        });
    })

    it("should not allow adding an address to the whitelist with a minCap greater than the maxCap", function() {
		return MintedTokenCappedCrowdsaleExt.deployed().then(function(instance) {
            const token = constants.token
            const minCap = 10 * 10**token.decimals
            const maxCap = 1 * 10**token.decimals
			return instance.setEarlyParticipantWhitelist(accounts[5], true, minCap, maxCap, { from: accounts[0] });
	    }).then(function() {
	    	assert.fail('transaction should fail');
        }, function(e) {
            // should enter here
        });
    })

    it("should not allow adding an address to the whitelist with a maxCap of 0", function() {
		return MintedTokenCappedCrowdsaleExt.deployed().then(function(instance) {
            const token = constants.token
            const minCap = 0
            const maxCap = 0
			return instance.setEarlyParticipantWhitelist(accounts[5], true, minCap, maxCap, { from: accounts[0] });
	    }).then(function() {
	    	assert.fail('transaction should fail');
        }, function(e) {
            // should enter here
        });
    })

    it("should not add an address to the whitelist that was already added", function() {
        let currentWhitelistLength = null

		return MintedTokenCappedCrowdsaleExt.deployed().then(function(instance) {
            return instance.whitelistedParticipantsLength.call()
                .then(length => {
                    currentWhitelistLength = length
                })
                .then(() => instance)
        }).then(function(instance) {
            const token = constants.token
            const minCap = 1 * 10**token.decimals
            const maxCap = 10 * 10**token.decimals
            return instance.setEarlyParticipantWhitelist(accounts[2], true, minCap, maxCap, { from: accounts[0] })
                .then(() => instance)
	    }).then(function(instance) {
            return instance.whitelistedParticipantsLength.call()
                .then(length => {
                    assert.equal(currentWhitelistLength.toString(), length.toString(), 'The length of the whitelist should not have changed')
                })
        });
    })


	it("should set endsAt for crowdsale", function() {
		return MintedTokenCappedCrowdsaleExt.deployed().then(function(instance) {
	    	return instance.setEndsAt(parseInt((new Date()).getTime()/1000, {from: accounts[0]}));
	    }).then(function(res) {
	    	assert.isOk('everything', 'Set of endsAt is failed');
	    }, function(err) {
	    	assert.isOk(false, 'Set of endsAt won`t fall');
	    });
	});

	//todo: remove this
	for (let i = 0; i < 10; i++) {
		it("should get state for crowdsale", function() {
			return MintedTokenCappedCrowdsaleExt.deployed().then(function(instance) {
				return instance.getState.call();
		    }).then(function(state) {
		    });
		});
	}

	it("should fail finalize", async () => {
		let mintedTokenCappedCrowdsaleExt = await MintedTokenCappedCrowdsaleExt.deployed();
		await mintedTokenCappedCrowdsaleExt.finalize().should.be.rejectedWith(ERROR_MSG);
	});

	it("should fail distribution of reserved tokens with 0 batch", async () => {
		let mintedTokenCappedCrowdsaleExt = await MintedTokenCappedCrowdsaleExt.deployed();
		await mintedTokenCappedCrowdsaleExt.distributeReservedTokens(0).should.be.rejectedWith(ERROR_MSG);
	});

	it("should distribute reserved tokens", function() {
		return MintedTokenCappedCrowdsaleExt.deployed().then(function(instance) {
			return instance.distributeReservedTokens(1);
	    }).then(function(res) {
	    	assert.isOk('everything', 'DistributeReservedTokens is failed');
	    }, function(err) {
	    	console.log(err);
	    	assert.isOk(false, 'DistributeReservedTokens won`t fall');
	    });
	});

	it("should return that reserved tokens are distributed for one address", async () => {
		let reservedTokensFinalizeAgent = await ReservedTokensFinalizeAgent.deployed();
		let distributedReservedTokensDestinationsLen  = await reservedTokensFinalizeAgent.distributedReservedTokensDestinationsLen.call();
		assert.equal(distributedReservedTokensDestinationsLen, 1, "reserved tokens should be distributed for one address");
	});

	it("should return that not all reserved tokens are distributed", async () => {
		let reservedTokensFinalizeAgent = await ReservedTokensFinalizeAgent.deployed();
		let reservedTokensAreDistributed  = await reservedTokensFinalizeAgent.reservedTokensAreDistributed.call();
		assert.equal(reservedTokensAreDistributed, false, "not all reserved tokens should be distributed");
	});

	it("should fail finalize", async () => {
		let mintedTokenCappedCrowdsaleExt = await MintedTokenCappedCrowdsaleExt.deployed();
		await mintedTokenCappedCrowdsaleExt.finalize().should.be.rejectedWith(ERROR_MSG);
	});

	it("should distribute reserved tokens", function() {
		return MintedTokenCappedCrowdsaleExt.deployed().then(function(instance) {
			return instance.distributeReservedTokens(1);
	    }).then(function(res) {
	    	assert.isOk('everything', 'DistributeReservedTokens is failed');
	    }, function(err) {
	    	console.log(err);
	    	assert.isOk(false, 'DistributeReservedTokens won`t fall');
	    });
	});

	it("should return that all reserved tokens are distributed", async () => {
		let reservedTokensFinalizeAgent = await ReservedTokensFinalizeAgent.deployed();
		let distributedReservedTokensDestinationsLen  = await reservedTokensFinalizeAgent.distributedReservedTokensDestinationsLen.call();
		assert.equal(distributedReservedTokensDestinationsLen, 2, "distributedReservedTokensDestinationsLen should be equal 2");
	});

	it("should return that all reserved tokens are distributed", async () => {
		let reservedTokensFinalizeAgent = await ReservedTokensFinalizeAgent.deployed();
		let reservedTokensAreDistributed  = await reservedTokensFinalizeAgent.reservedTokensAreDistributed.call();
		assert.equal(reservedTokensAreDistributed, true, "reservedTokensAreDistributed should be true");
	});

	it("should fail distribution of reserved tokens", async () => {
		let mintedTokenCappedCrowdsaleExt = await MintedTokenCappedCrowdsaleExt.deployed();
		await mintedTokenCappedCrowdsaleExt.distributeReservedTokens(1).should.be.rejectedWith(ERROR_MSG);
	});

	it("should finalize crowdsale", function() {
		return MintedTokenCappedCrowdsaleExt.deployed().then(function(instance) {
			return instance.finalize();
	    }).then(function(res) {
	    	assert.isOk('everything', 'Finalize is failed');
	    }, function(err) {
	    	console.log(err);
	    	assert.isOk(false, 'Finalize won`t fall');
	    });
	});

	let user1Investment = (constants.investments[2] + constants.investments[3] + constants.investments[4]) * 10**constants.token.decimals
	let user2Investment = (constants.investments[2]) * 10**constants.token.decimals
	let usersInvestment = user1Investment + user2Investment

	it("should return updated token balance of user 1 including reserved tokens", async () => {
		let crowdsaleTokenExt = await CrowdsaleTokenExt.deployed();
		let tokenBalance  = await crowdsaleTokenExt.balanceOf.call(accounts[2]);
		let tokenBalancePattern = user1Investment + usersInvestment * constants.reservedTokens.percentageUnit / 10**constants.reservedTokens.percentageDecimals / 100;
		tokenBalancePattern += constants.reservedTokens.number;
		assert.equal(tokenBalance, tokenBalancePattern, "balance of investor 1 should be equal the total value we bought before + reserved tokens");
	});

	it("should return updated token balance of user 2 including reserved tokens", async () => {
		let crowdsaleTokenExt = await CrowdsaleTokenExt.deployed();
		let tokenBalance  = await crowdsaleTokenExt.balanceOf.call(accounts[4]);
		let tokenBalancePattern = user2Investment +  usersInvestment * constants.reservedTokens2.percentageUnit / 10**constants.reservedTokens2.percentageDecimals / 100;
		tokenBalancePattern += constants.reservedTokens2.number;
		assert.equal(tokenBalance, tokenBalancePattern, "balance of investor 2 should be equal reserved tokens");
	});

	it("should get name of crowdsale", function() {
		return MintedTokenCappedCrowdsaleExt.deployed().then(function(instance) {
	    	return instance.name.call();
	    }).then(function(name) {
	    	assert.equal(name, "Test Crowdsale", "The name of the crowdsale should be accessible");
	    });
	});
});