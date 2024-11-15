// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

// interface IListing {
//     function initialize(address _owner, address _marketplaceAddress) external;
//     function listItem(string memory _itemName, uint256 _price) external;
//     function getItem(uint256 _itemId) external view returns (string memory name, uint256 price, bool sold);
// }

// Listing contract that will be created for each user
contract Listing {
    struct Item {
        string name;
        uint256 price;
        bool sold;
    }
    
    address public owner;
    address public marketplaceAddress;
    mapping(uint256 => Item) public items;
    uint256 public itemCount;
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyMarketplace() {
        require(msg.sender == marketplaceAddress, "Only marketplace can initialize");
        _;
    }
    
    function initialize(address _owner, address _marketplaceAddress) external onlyMarketplace {
        require(owner == address(0), "Already initialized");
        owner = _owner;
        marketplaceAddress = _marketplaceAddress;
    }
    
    function listItem(string memory _itemName, uint256 _price) external onlyOwner {
        require(bytes(_itemName).length > 0, "Name cannot be empty");
        require(_price > 0, "Price must be greater than 0");
        
        items[itemCount] = Item({
            name: _itemName,
            price: _price,
            sold: false
        });
        
        itemCount++;
    }
    
    function getItem(uint256 _itemId) external view returns (string memory name, uint256 price, bool sold) {
        require(_itemId < itemCount, "Item does not exist");
        Item storage item = items[_itemId];
        return (item.name, item.price, item.sold);
    }
}





