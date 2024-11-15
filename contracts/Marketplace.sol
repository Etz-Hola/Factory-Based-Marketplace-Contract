// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "./Listing.sol";

contract MarketplaceFactory {
    struct User {
        bool registered;
        address listingContract;
    }
    
    mapping(address => User) public users;
    address[] public registeredUsers;
    
    event UserRegistered(address indexed userAddress, address listingContract);
    event ItemListed(address indexed seller, uint256 itemId, string name, uint256 price);
    
    function registerUser() external {
        require(!users[msg.sender].registered, "User already registered");
        
        // let do new Listing 
        Listing newListing = new Listing();
        newListing.initialize(msg.sender, address(this));
        
        // now to regiter user
        users[msg.sender] = User({
            registered: true,
            listingContract: address(newListing)
        });
        
        registeredUsers.push(msg.sender);
        
        emit UserRegistered(msg.sender, address(newListing));
    }
    
    function getUserListing(address _user) external view returns (address) {
        require(users[_user].registered, "User not registered");
        return users[_user].listingContract;
    }
    
    function isUserRegistered(address _user) external view returns (bool) {
        return users[_user].registered;
    }
    
    function getRegisteredUsersCount() external view returns (uint256) {
        return registeredUsers.length;
    }
}
