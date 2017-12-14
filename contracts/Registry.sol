pragma solidity ^0.4.6;

import "oracles-zeppelin/contracts/ownership/Ownable.sol";

/**
 * Registry of contracts deployed from ICO Wizard.
 */
contract Registry is Ownable {
  struct DeployedContract {
    string id;
    address deployAddress;
    string extraData;
  }

  mapping (address => DeployedContract[]) public deployedContracts;

  function add(string id, address deployAddress, string extraData) public {
    deployedContracts[msg.sender].push(DeployedContract(id, deployAddress, extraData));
  }
}
