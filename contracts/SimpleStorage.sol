// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleStorage {
    uint256 public storedData;

    function write(uint256 x) public {
        storedData = x;
    }

    function read() public view returns (uint256) {
        return storedData;
    }
}
contract PropertySale {
    struct Property {
        string propertyAddress;
        uint256 price;
        address payable seller;
        address buyer;
        bool isSold;
        string title;
        string description;
    }

    mapping(uint256 => Property) public properties;
    uint256 public propertyIdCounter;

    event PropertyListed(
        uint256 indexed id,
        string propertyAddress,
        uint256 price,
        address seller,
        string title
    );

    event PropertySold(
        uint256 indexed id,
        address buyer,
        uint256 price
    );

    modifier onlySeller(uint256 _propertyId) {
        require(properties[_propertyId].seller != address(0), "Properti tidak ditemukan");
        require(msg.sender == properties[_propertyId].seller, "Hanya penjual");
        _;
    }

    modifier notSold(uint256 _propertyId) {
        require(!properties[_propertyId].isSold, "Sudah terjual");
        _;
    }

    modifier propertyExists(uint256 _propertyId) {
        require(_propertyId > 0 && _propertyId <= propertyIdCounter, "Properti tidak ada");
        _;
    }

    /// @notice List property for sale
    function listProperty(
        string memory _propertyAddress,
        uint256 _price,
        string memory _title,
        string memory _description
    ) external {
        require(_price > 0, "Harga harus > 0");

        propertyIdCounter++;
        properties[propertyIdCounter] = Property({
            propertyAddress: _propertyAddress,
            price: _price,
            seller: payable(msg.sender),
            buyer: address(0),
            isSold: false,
            title: _title,
            description: _description
        });

        emit PropertyListed(propertyIdCounter, _propertyAddress, _price, msg.sender, _title);
    }

    /// @notice Buy property by ID
    function buyProperty(uint256 _propertyId)
        external
        payable
        propertyExists(_propertyId)
        notSold(_propertyId)
    {
        Property storage property = properties[_propertyId];
        require(msg.sender != property.seller, "Penjual tidak bisa membeli sendiri");
        require(msg.value == property.price, "Jumlah ETH tidak sesuai");

        property.seller.transfer(msg.value);
        property.buyer = msg.sender;
        property.isSold = true;

        emit PropertySold(_propertyId, msg.sender, property.price);
    }

    /// @notice Update property price
    function updatePrice(uint256 _propertyId, uint256 _newPrice)
        external
        propertyExists(_propertyId)
        onlySeller(_propertyId)
        notSold(_propertyId)
    {
        require(_newPrice > 0, "Harga harus > 0");
        properties[_propertyId].price = _newPrice;
    }

    /// @notice Get details of one property (frontend use)
    function getProperty(uint256 _propertyId)
        external
        view
        propertyExists(_propertyId)
        returns (
            string memory title,
            string memory description,
            string memory propertyAddress,
            uint256 price,
            address seller,
            address buyer,
            bool isSold
        )
    {
        Property memory property = properties[_propertyId];
        return (
            property.title,
            property.description,
            property.propertyAddress,
            property.price,
            property.seller,
            property.buyer,
            property.isSold
        );
    }

    /// @notice Get all unsold properties
    function getUnsoldProperties() external view returns (Property[] memory) {
        uint count = 0;
        for (uint i = 1; i <= propertyIdCounter; i++) {
            if (!properties[i].isSold) count++;
        }

        Property[] memory unsold = new Property[](count);
        uint index = 0;
        for (uint i = 1; i <= propertyIdCounter; i++) {
            if (!properties[i].isSold) {
                unsold[index] = properties[i];
                index++;
            }
        }

        return unsold;
    }

    /// @notice Get total number of listed properties
    function getPropertiesCount() external view returns (uint256) {
        return propertyIdCounter;
    }
}
