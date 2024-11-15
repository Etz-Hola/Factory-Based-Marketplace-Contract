const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MarketplaceFactory System", function () {
    let MarketplaceFactory;
    let Listing;
    let marketplace;
    let owner;
    let user1;
    let user2;

    beforeEach(async function () {
        // Get signers
        [owner, user1, user2] = await ethers.getSigners();

        // Deploy the contracts
        MarketplaceFactory = await ethers.getContractFactory("MarketplaceFactory");
        Listing = await ethers.getContractFactory("Listing");
        
        marketplace = await MarketplaceFactory.deploy();
        await marketplace.deployed();
    });

    describe("User Registration", function () {
        it("Should allow a user to register", async function () {
            await marketplace.connect(user1).registerUser();
            
            const isRegistered = await marketplace.isUserRegistered(user1.address);
            expect(isRegistered).to.be.true;
        });

        it("Should create a new listing contract for registered user", async function () {
            await marketplace.connect(user1).registerUser();
            
            const listingAddress = await marketplace.getUserListing(user1.address);
            expect(listingAddress).to.not.equal(ethers.constants.AddressZero);
        });

        it("Should increment registered users count", async function () {
            const initialCount = await marketplace.getRegisteredUsersCount();
            
            await marketplace.connect(user1).registerUser();
            
            const newCount = await marketplace.getRegisteredUsersCount();
            expect(newCount).to.equal(initialCount.add(1));
        });

        it("Should not allow double registration", async function () {
            await marketplace.connect(user1).registerUser();
            
            await expect(
                marketplace.connect(user1).registerUser()
            ).to.be.revertedWith("User already registered");
        });
    });

    describe("Listing Contract Integration", function () {
        let listingContract;

        beforeEach(async function () {
            await marketplace.connect(user1).registerUser();
            const listingAddress = await marketplace.getUserListing(user1.address);
            listingContract = await Listing.attach(listingAddress);
        });

        it("Should initialize listing contract with correct owner", async function () {
            const listingOwner = await listingContract.owner();
            expect(listingOwner).to.equal(user1.address);
        });

        it("Should allow owner to list items", async function () {
            await listingContract.connect(user1).listItem("Test Item", ethers.utils.parseEther("1"));
            
            const [name, price, sold] = await listingContract.getItem(0);
            expect(name).to.equal("Test Item");
            expect(price).to.equal(ethers.utils.parseEther("1"));
            expect(sold).to.be.false;
        });

        it("Should not allow non-owner to list items", async function () {
            await expect(
                listingContract.connect(user2).listItem("Test Item", ethers.utils.parseEther("1"))
            ).to.be.revertedWith("Only owner can call this function");
        });
    });

    describe("Marketplace System Integration", function () {
        it("Should handle multiple user registrations", async function () {
            await marketplace.connect(user1).registerUser();
            await marketplace.connect(user2).registerUser();

            const user1Listing = await marketplace.getUserListing(user1.address);
            const user2Listing = await marketplace.getUserListing(user2.address);

            expect(user1Listing).to.not.equal(user2Listing);
            expect(user1Listing).to.not.equal(ethers.constants.AddressZero);
            expect(user2Listing).to.not.equal(ethers.constants.AddressZero);
        });

        it("Should maintain separate listings for different users", async function () {
            // Register users
            await marketplace.connect(user1).registerUser();
            await marketplace.connect(user2).registerUser();

            // Get their listing contracts
            const user1ListingAddress = await marketplace.getUserListing(user1.address);
            const user2ListingAddress = await marketplace.getUserListing(user2.address);
            
            const user1Listing = await Listing.attach(user1ListingAddress);
            const user2Listing = await Listing.attach(user2ListingAddress);

            // List items for each user
            await user1Listing.connect(user1).listItem("User1 Item", ethers.utils.parseEther("1"));
            await user2Listing.connect(user2).listItem("User2 Item", ethers.utils.parseEther("2"));

            // Check items
            const [item1Name, item1Price] = await user1Listing.getItem(0);
            const [item2Name, item2Price] = await user2Listing.getItem(0);

            expect(item1Name).to.equal("User1 Item");
            expect(item2Name).to.equal("User2 Item");
            expect(item1Price).to.equal(ethers.utils.parseEther("1"));
            expect(item2Price).to.equal(ethers.utils.parseEther("2"));
        });

        it("Should properly handle listing queries for non-registered users", async function () {
            await expect(
                marketplace.getUserListing(user1.address)
            ).to.be.revertedWith("User not registered");
        });
    });

    describe("Edge Cases and Error Handling", function () {
        it("Should handle empty item names", async function () {
            await marketplace.connect(user1).registerUser();
            const listingAddress = await marketplace.getUserListing(user1.address);
            const listing = await Listing.attach(listingAddress);

            await expect(
                listing.connect(user1).listItem("", ethers.utils.parseEther("1"))
            ).to.be.revertedWith("Name cannot be empty");
        });

        it("Should handle zero price listings", async function () {
            await marketplace.connect(user1).registerUser();
            const listingAddress = await marketplace.getUserListing(user1.address);
            const listing = await Listing.attach(listingAddress);

            await expect(
                listing.connect(user1).listItem("Test Item", 0)
            ).to.be.revertedWith("Price must be greater than 0");
        });

        it("Should handle invalid item queries", async function () {
            await marketplace.connect(user1).registerUser();
            const listingAddress = await marketplace.getUserListing(user1.address);
            const listing = await Listing.attach(listingAddress);

            await expect(
                listing.getItem(0)
            ).to.be.revertedWith("Item does not exist");
        });
    });

    describe("Gas Usage Analysis", function () {
        it("Should track gas usage for registration", async function () {
            const tx = await marketplace.connect(user1).registerUser();
            const receipt = await tx.wait();
            
            console.log("Gas used for registration:", receipt.gasUsed.toString());
            expect(receipt.gasUsed.gt(0)).to.be.true;
        });

        it("Should track gas usage for listing item", async function () {
            await marketplace.connect(user1).registerUser();
            const listingAddress = await marketplace.getUserListing(user1.address);
            const listing = await Listing.attach(listingAddress);

            const tx = await listing.connect(user1).listItem("Test Item", ethers.utils.parseEther("1"));
            const receipt = await tx.wait();
            
            console.log("Gas used for listing item:", receipt.gasUsed.toString());
            expect(receipt.gasUsed.gt(0)).to.be.true;
        });
    });
});