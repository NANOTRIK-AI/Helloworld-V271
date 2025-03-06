// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title ERC20TokenV271
 * @dev Implementation of the ERC20TokenV271 with multisig support
 */
contract ERC20TokenV271 is ERC20, ERC20Burnable, Ownable, Pausable {
    uint8 private _decimals;
    uint256 private _initialSupply;
    string private _tokenDescription;

    event MintExecuted(address indexed to, uint256 amount);
    event BurnExecuted(address indexed from, uint256 amount);
    event DescriptionUpdated(string newDescription);

    /**
     * @dev Constructor
     * @param name Token name
     * @param symbol Token symbol
     * @param decimals_ Token decimals
     * @param initialSupply Initial token supply
     * @param description Token description
     * @param initialOwner Initial owner address (can be a multisig wallet)
     */
    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_,
        uint256 initialSupply,
        string memory description,
        address initialOwner
    ) ERC20(name, symbol) Ownable(initialOwner) {
        _decimals = decimals_;
        _initialSupply = initialSupply;
        _tokenDescription = description;
        
        if (initialSupply > 0) {
            _mint(initialOwner, initialSupply * (10 ** decimals_));
        }
    }

    /**
     * @dev Override decimals function
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    /**
     * @dev Returns token description
     */
    function description() public view returns (string memory) {
        return _tokenDescription;
    }

    /**
     * @dev Update token description (only owner)
     * @param newDescription New token description
     */
    function updateDescription(string memory newDescription) public onlyOwner {
        _tokenDescription = newDescription;
        emit DescriptionUpdated(newDescription);
    }

    /**
     * @dev Mint new tokens (only owner)
     * @param to Address to mint to
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
        emit MintExecuted(to, amount);
    }

    /**
     * @dev Pause token transfers (only owner)
     */
    function pause() public onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause token transfers (only owner)
     */
    function unpause() public onlyOwner {
        _unpause();
    }

    /**
     * @dev Hook before token transfers
     */
    function _update(address from, address to, uint256 value)
        internal
        override
        whenNotPaused
    {
        super._update(from, to, value);
    }
}
