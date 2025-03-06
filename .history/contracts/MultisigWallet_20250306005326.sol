// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title MultisigWallet
 * @dev Implementation of a multisignature wallet to manage ERC-20 token operations
 */
contract MultisigWallet {
    event Deposit(address indexed sender, uint amount, uint balance);
    event SubmitTransaction(address indexed owner, uint indexed txIndex, address indexed to, uint value, bytes data);
    event ConfirmTransaction(address indexed owner, uint indexed txIndex);
    event RevokeConfirmation(address indexed owner, uint indexed txIndex);
    event ExecuteTransaction(address indexed owner, uint indexed txIndex);
    
    address[] public owners;
    mapping(address => bool) public isOwner;
    uint public numConfirmationsRequired;
    
    struct Transaction {
        address to;
        uint value;
        bytes data;
        bool executed;
        uint numConfirmations;
    }
    
    // mapping from tx index => owner => bool
    mapping(uint => mapping(address => bool)) public isConfirmed;
    
    Transaction[] public transactions;
    
    modifier onlyOwner() {
        require(isOwner[msg.sender], "not owner");
        _;
    }
    
    modifier txExists(uint _txIndex) {
        require(_txIndex < transactions.length, "tx does not exist");
        _;
    }
    
    modifier notExecuted(uint _txIndex) {
        require(!transactions[_txIndex].executed, "tx already executed");
        _;
    }
    
    modifier notConfirmed(uint _txIndex) {
        require(!isConfirmed[_txIndex][msg.sender], "tx already confirmed");
        _;
    }
    
    /**
     * @dev Constructor
     * @param _owners Array of owner addresses
     * @param _numConfirmationsRequired Number of required confirmations
     */
    constructor(address[] memory _owners, uint _numConfirmationsRequired) {
        require(_owners.length > 0, "owners required");
        require(
            _numConfirmationsRequired > 0 && 
            _numConfirmationsRequired <= _owners.length,
            "invalid number of confirmations"
        );
        
        for (uint i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            
            require(owner != address(0), "invalid owner");
            require(!isOwner[owner], "owner not unique");
            
            isOwner[owner] = true;
            owners.push(owner);
        }
        
        numConfirmationsRequired = _numConfirmationsRequired;
    }
    
    receive() external payable {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }
    
    /**
     * @dev Submit a transaction for approval
     * @param _to Destination address
     * @param _value ETH value to send
     * @param _data Transaction data
     * @return Transaction index
     */
    function submitTransaction(
        address _to,
        uint _value,
        bytes memory _data
    ) public onlyOwner returns (uint) {
        uint txIndex = transactions.length;
        
        transactions.push(
            Transaction({
                to: _to,
                value: _value,
                data: _data,
                executed: false,
                numConfirmations: 0
            })
        );
        
        emit SubmitTransaction(msg.sender, txIndex, _to, _value, _data);
        return txIndex;
    }
    
    /**
     * @dev Confirm a pending transaction
     * @param _txIndex Transaction index
     */
    function confirmTransaction(
        uint _txIndex
    ) public onlyOwner txExists(_txIndex) notExecuted(_txIndex) notConfirmed(_txIndex) {
        Transaction storage transaction = transactions[_txIndex];
        transaction.numConfirmations += 1;
        isConfirmed[_txIndex][msg.sender] = true;
        
        emit ConfirmTransaction(msg.sender, _txIndex);
    }
    
    /**
     * @dev Execute a confirmed transaction
     * @param _txIndex Transaction index
     */
    function executeTransaction(
        uint _txIndex
    ) public onlyOwner txExists(_txIndex) notExecuted(_txIndex) {
        Transaction storage transaction = transactions[_txIndex];
        
        require(
            transaction.numConfirmations >= numConfirmationsRequired,
            "cannot execute tx"
        );
        
        transaction.executed = true;
        
        (bool success, ) = transaction.to.call{value: transaction.value}(
            transaction.data
        );
        require(success, "tx failed");
        
        emit ExecuteTransaction(msg.sender, _txIndex);
    }
    
    /**
     * @dev Revoke a confirmation for a transaction
     * @param _txIndex Transaction index
     */
    function revokeConfirmation(
        uint _txIndex
    ) public onlyOwner txExists(_txIndex) notExecuted(_txIndex) {
        require(isConfirmed[_txIndex][msg.sender], "tx not confirmed");
        
        Transaction storage transaction = transactions[_txIndex];
        transaction.numConfirmations -= 1;
        isConfirmed[_txIndex][msg.sender] = false;
        
        emit RevokeConfirmation(msg.sender, _txIndex);
    }
    
    /**
     * @dev Get the list of owners
     * @return Array of owner addresses
     */
    function getOwners() public view returns (address[] memory) {
        return owners;
    }
    
    /**
     * @dev Get the number of transactions
     * @return Number of transactions
     */
    function getTransactionCount() public view returns (uint) {
        return transactions.length;
    }
    
    /**
     * @dev Get transaction details
     * @param _txIndex Transaction index
     * @return Transaction details
     */
    function getTransaction(
        uint _txIndex
    )
        public
        view
        returns (
            address to,
            uint value,
            bytes memory data,
            bool executed,
            uint numConfirmations
        )
    {
        Transaction storage transaction = transactions[_txIndex];
        
        return (
            transaction.to,
            transaction.value,
            transaction.data,
            transaction.executed,
            transaction.numConfirmations
        );
    }
}
