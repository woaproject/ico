const Registry = artifacts.require("./Registry.sol");

contract('Registry', function(accounts) {
    it("should start with an empty mapping", function() {
        return Registry.deployed().then(function(instance) {
            return instance.deployedContracts.call(accounts[0], 0);
        }).then(function(res) {
            assert.fail("Initial value for mapping should be an empty array");
        }, function () {
            // Method should fail because array should be empty
        });
    });

    it("should add a deployed contract", function() {
        return Registry.deployed().then(function(instance) {
            return instance.add("crowdsale", "0xe78a0f7e598cc8b0bb87894b0f60dd2a88d6a8ab", "{}", { from: accounts[0] })
                .then(() => {
                    return instance.deployedContracts.call(accounts[0], 0);
                })
                .then(([id, deployedAddress, extraData]) => {
                    assert.equal(id, "crowdsale")
                    assert.equal(deployedAddress, "0xe78a0f7e598cc8b0bb87894b0f60dd2a88d6a8ab")
                    assert.equal(extraData, "{}")
                })
        });
    })
    it("should add just one deployed contract", function() {
        return Registry.deployed().then(function(instance) {
            return instance.deployedContracts.call(accounts[0], 1)
                .then(function(res) {
                    assert.fail("Initial value for mapping should be an empty array");
                }, function () {
                    // Method should fail because array should be empty
                });
        });
    })
});
