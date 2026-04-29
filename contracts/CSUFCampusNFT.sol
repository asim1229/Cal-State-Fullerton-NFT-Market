// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CSUFCampusNFT
 * @dev ERC-721 NFT marketplace contract tied to CSUF campus buildings.
 *      Supports mint, list, unlist, buy, and transferFrom (ERC-721 standard).
 *      Works with Ganache local network for development.
 */
contract CSUFCampusNFT is ERC721URIStorage, Ownable, ReentrancyGuard {

    // Use plain uint256 instead of deprecated Counters library (OZ v5 compat)
    uint256 private _tokenIdCounter;

    // Platform fee: 2.5%
    uint256 public constant PLATFORM_FEE_BPS = 250;
    uint256 public constant MAX_BPS = 10000;

    struct NFTListing {
        uint256 tokenId;
        address seller;
        uint256 price;       // in wei
        string buildingId;   // e.g. "pollak-library"
        bool active;
    }

    struct BuildingCollection {
        string buildingId;
        string name;
        uint256 maxSupply;
        uint256 minted;
        uint256 mintPrice;   // in wei
        bool active;
    }

    // tokenId => listing
    mapping(uint256 => NFTListing) public listings;

    // buildingId => collection info
    mapping(string => BuildingCollection) public collections;

    // tokenId => buildingId
    mapping(uint256 => string) public tokenBuilding;

    // Accumulated platform fees for owner withdrawal
    uint256 public accumulatedFees;

    // ── Events ─────────────────────────────────────────────────────────────────
    event CollectionCreated(string buildingId, string name, uint256 maxSupply, uint256 mintPrice);
    event NFTMinted(uint256 indexed tokenId, address indexed to, string buildingId, string tokenURI);
    event NFTListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event NFTUnlisted(uint256 indexed tokenId);
    event NFTSold(uint256 indexed tokenId, address indexed from, address indexed to, uint256 price);
    event FeesWithdrawn(address indexed to, uint256 amount);

    constructor() ERC721("CSUF Campus NFT", "CSUFNFT") Ownable(msg.sender) {
        _tokenIdCounter = 0;
    }

    // ── Internal helpers ───────────────────────────────────────────────────────

    function _nextTokenId() internal returns (uint256) {
        _tokenIdCounter += 1;
        return _tokenIdCounter;
    }

    function totalMinted() external view returns (uint256) {
        return _tokenIdCounter;
    }

    // ── Admin: Create collections ──────────────────────────────────────────────

    /**
     * @dev Create an NFT collection for a campus building.
     *      Called once per building by the deploy script.
     */
    function createCollection(
        string calldata buildingId,
        string calldata name,
        uint256 maxSupply,
        uint256 mintPrice
    ) external onlyOwner {
        require(bytes(buildingId).length > 0, "Invalid buildingId");
        require(collections[buildingId].maxSupply == 0, "Collection exists");
        collections[buildingId] = BuildingCollection(buildingId, name, maxSupply, 0, mintPrice, true);
        emit CollectionCreated(buildingId, name, maxSupply, mintPrice);
    }

    // ── Minting ────────────────────────────────────────────────────────────────

    /**
     * @dev Mint an NFT from a building's collection.
     *      Send at least mintPrice ETH with the call.
     * @param buildingId  The campus building identifier (e.g. "pollak-library")
     * @param uri         Token metadata URI (data URI or IPFS)
     */
    function mint(string calldata buildingId, string calldata uri)
        external payable nonReentrant returns (uint256)
    {
        BuildingCollection storage col = collections[buildingId];
        require(col.active, "Collection not active");
        require(col.minted < col.maxSupply, "Max supply reached");
        require(msg.value >= col.mintPrice, "Insufficient payment");

        uint256 newId = _nextTokenId();
        _safeMint(msg.sender, newId);
        _setTokenURI(newId, uri);
        tokenBuilding[newId] = buildingId;
        col.minted++;

        // Refund excess ETH
        if (msg.value > col.mintPrice) {
            payable(msg.sender).transfer(msg.value - col.mintPrice);
        }
        accumulatedFees += col.mintPrice;

        emit NFTMinted(newId, msg.sender, buildingId, uri);
        return newId;
    }

    // ── Marketplace ────────────────────────────────────────────────────────────

    /**
     * @dev List an NFT for sale.
     *      Caller must first call approve(address(this), tokenId).
     * @param tokenId  Token to list
     * @param price    Sale price in wei
     */
    function listNFT(uint256 tokenId, uint256 price) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        require(price > 0, "Price must be > 0");
        require(!listings[tokenId].active, "Already listed");

        // Transfer NFT into escrow (contract holds it while listed)
        transferFrom(msg.sender, address(this), tokenId);

        listings[tokenId] = NFTListing({
            tokenId: tokenId,
            seller: msg.sender,
            price: price,
            buildingId: tokenBuilding[tokenId],
            active: true
        });

        emit NFTListed(tokenId, msg.sender, price);
    }

    /**
     * @dev Cancel a listing and reclaim the NFT from escrow.
     */
    function unlistNFT(uint256 tokenId) external {
        NFTListing storage listing = listings[tokenId];
        require(listing.active, "Not listed");
        require(listing.seller == msg.sender, "Not seller");

        listing.active = false;
        _transfer(address(this), msg.sender, tokenId);

        emit NFTUnlisted(tokenId);
    }

    /**
     * @dev Buy a listed NFT.
     *      Send at least listing.price ETH with the call.
     */
    function buyNFT(uint256 tokenId) external payable nonReentrant {
        NFTListing storage listing = listings[tokenId];
        require(listing.active, "Not listed");
        require(msg.value >= listing.price, "Insufficient payment");
        require(msg.sender != listing.seller, "Cannot buy own NFT");

        uint256 fee = (listing.price * PLATFORM_FEE_BPS) / MAX_BPS;
        uint256 sellerProceeds = listing.price - fee;

        listing.active = false;
        accumulatedFees += fee;

        _transfer(address(this), msg.sender, tokenId);
        payable(listing.seller).transfer(sellerProceeds);

        // Refund excess ETH
        if (msg.value > listing.price) {
            payable(msg.sender).transfer(msg.value - listing.price);
        }

        emit NFTSold(tokenId, listing.seller, msg.sender, listing.price);
    }

    // ── Queries ────────────────────────────────────────────────────────────────

    function getListing(uint256 tokenId) external view returns (NFTListing memory) {
        return listings[tokenId];
    }

    function getCollection(string calldata buildingId) external view returns (BuildingCollection memory) {
        return collections[buildingId];
    }

    // ── Finance ────────────────────────────────────────────────────────────────

    function withdrawFees() external onlyOwner {
        uint256 amount = accumulatedFees;
        accumulatedFees = 0;
        payable(owner()).transfer(amount);
        emit FeesWithdrawn(owner(), amount);
    }

    receive() external payable {}
}
