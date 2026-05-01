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

    struct Auction {
        uint256 tokenId;
        address seller;
        uint256 minBid;         // in wei
        uint256 highestBid;     // in wei
        address highestBidder;
        uint256 endsAt;         // unix timestamp
        bool active;
    }

    // tokenId => listing
    mapping(uint256 => NFTListing) public listings;

    // tokenId => auction
    mapping(uint256 => Auction) public auctions;

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
    // Auction events
    event AuctionStarted(uint256 indexed tokenId, address indexed seller, uint256 minBid, uint256 endsAt);
    event BidPlaced(uint256 indexed tokenId, address indexed bidder, uint256 amount);
    event AuctionEnded(uint256 indexed tokenId, address indexed winner, uint256 amount);
    event AuctionCancelled(uint256 indexed tokenId);

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

    function getAuction(uint256 tokenId) external view returns (Auction memory) {
        return auctions[tokenId];
    }

    // ── Auction ────────────────────────────────────────────────────────────────

    /**
     * @dev Start a timed auction for an NFT you own.
     * @param tokenId   Token to auction
     * @param minBid    Minimum acceptable bid in wei
     * @param duration  Auction length in seconds
     */
    function startAuction(uint256 tokenId, uint256 minBid, uint256 duration) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        require(!auctions[tokenId].active, "Auction already active");
        require(!listings[tokenId].active, "Token currently listed");
        require(minBid > 0, "Min bid must be > 0");
        require(duration >= 1 hours && duration <= 30 days, "Invalid duration");

        // Lock NFT in contract
        transferFrom(msg.sender, address(this), tokenId);

        uint256 endsAt = block.timestamp + duration;
        auctions[tokenId] = Auction({
            tokenId:       tokenId,
            seller:        msg.sender,
            minBid:        minBid,
            highestBid:    0,
            highestBidder: address(0),
            endsAt:        endsAt,
            active:        true
        });

        emit AuctionStarted(tokenId, msg.sender, minBid, endsAt);
    }

    /**
     * @dev Place a bid on an active auction.
     *      Send at least the current highest bid + 1 wei (or minBid if no bids).
     *      Previous highest bidder is automatically refunded.
     */
    function placeBid(uint256 tokenId) external payable nonReentrant {
        Auction storage auction = auctions[tokenId];
        require(auction.active, "No active auction");
        require(block.timestamp < auction.endsAt, "Auction ended");
        require(msg.sender != auction.seller, "Seller cannot bid");

        uint256 minRequired = auction.highestBid > 0
            ? auction.highestBid + 1
            : auction.minBid;
        require(msg.value >= minRequired, "Bid too low");

        // Refund previous highest bidder
        if (auction.highestBidder != address(0)) {
            payable(auction.highestBidder).transfer(auction.highestBid);
        }

        auction.highestBid    = msg.value;
        auction.highestBidder = msg.sender;

        emit BidPlaced(tokenId, msg.sender, msg.value);
    }

    /**
     * @dev End an auction after its deadline.
     *      Callable by anyone. Transfers NFT to winner; ETH to seller minus fee.
     *      If no bids, NFT is returned to seller.
     */
    function endAuction(uint256 tokenId) external nonReentrant {
        Auction storage auction = auctions[tokenId];
        require(auction.active, "No active auction");
        require(block.timestamp >= auction.endsAt, "Auction still running");

        auction.active = false;

        if (auction.highestBidder == address(0)) {
            // No bids — return NFT to seller
            _transfer(address(this), auction.seller, tokenId);
            emit AuctionCancelled(tokenId);
        } else {
            // Transfer NFT to winner
            _transfer(address(this), auction.highestBidder, tokenId);

            // Pay seller minus fee
            uint256 fee             = (auction.highestBid * PLATFORM_FEE_BPS) / MAX_BPS;
            uint256 sellerProceeds  = auction.highestBid - fee;
            accumulatedFees        += fee;

            payable(auction.seller).transfer(sellerProceeds);
            emit AuctionEnded(tokenId, auction.highestBidder, auction.highestBid);
        }
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
