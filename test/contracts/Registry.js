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

    it("should get 0 as number of deployed contracts", function() {
        return Registry.deployed().then(function(instance) {
            return instance.count.call(accounts[0]);
        }).then(function(count) {
            assert.equal(count, 0);
        }, function () {
            // Method should fail because array should be empty
        });
    })

    it("should add a deployed contract", function() {
        return Registry.deployed().then(function(instance) {
            return instance.add("0xe78a0f7e598cc8b0bb87894b0f60dd2a88d6a8ab", { from: accounts[0] })
                .then(() => {
                    return instance.deployedContracts.call(accounts[0], 0);
                })
                .then((deployedAddress) => {
                    assert.equal(deployedAddress, "0xe78a0f7e598cc8b0bb87894b0f60dd2a88d6a8ab")
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

    it("should get 1 as number of deployed contracts", function() {
        return Registry.deployed().then(function(instance) {
            return instance.count.call(accounts[0]);
        }).then(function(count) {
            assert.equal(count, 1);
        }, function () {
            // Method should fail because array should be empty
        });
    })

    it("should emit an Added event when adding an address", function() {
        return Registry.deployed().then(function(instance) {
            const addedWatcher = instance.Added();
            const crowdsaleAddress = "0xe78a0f7e598cc8b0bb87894b0f60dd2a88d6a8ab"

            return instance.add(crowdsaleAddress, { from: accounts[0] })
                .then(() => addedWatcher.get())
                .then((events) => {
                    assert.equal(events.length, 1, "Should have emitted an Added event")
                    assert.equal(events[0].args.sender, accounts[0]);
                    assert.equal(events[0].args.deployAddress, crowdsaleAddress);
                })
        });
    })
});
