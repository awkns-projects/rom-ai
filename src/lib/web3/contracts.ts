// Contract addresses and ABIs for Web3 integration
export const CONTRACTS = {
  // Factory contracts
  NFTFactory: {
    address: process.env.NEXT_PUBLIC_NFT_FACTORY_ADDRESS || '',
    abi: [
      // NFTFactory ABI
      'function createCollection(string name, string symbol, string baseURI, address paymentToken, uint256 mintPrice, uint256 maxSupply) external payable returns (address)',
      'function updateCreationFee(uint256 newFee) external',
      'function updateProtocolFeeRecipient(address newRecipient) external',
      'function updateProtocolFeeBps(uint256 newFeeBps) external',
      'function getCollectionCount() external view returns (uint256)',
      'function collections(uint256 index) external view returns (address)',
      'function collectionInfo(address collection) external view returns (address creator, address paymentToken, uint256 mintPrice, uint256 maxSupply, bool exists)',
      'function creationFee() external view returns (uint256)',
      'function protocolFeeRecipient() external view returns (address)',
      'function protocolFeeBps() external view returns (uint256)',
      'event CollectionCreated(address indexed collection, address indexed creator, string name, string symbol, string baseURI, address paymentToken, uint256 mintPrice, uint256 maxSupply)',
      'event CreationFeeUpdated(uint256 newFee)'
    ]
  },
  
  ERC20Factory: {
    address: process.env.NEXT_PUBLIC_ERC20_FACTORY_ADDRESS || '',
    abi: [
      // ERC20Factory ABI
      'function createToken(string name, string symbol, address nftCollection, address reserveToken, tuple(uint128 rangeTo, uint128 price)[] steps, uint16 mintRoyalty, uint16 burnRoyalty) external payable returns (address)',
      'function setCreationFee(uint256 newFee) external',
      'function setRoyaltyRecipient(address newRecipient) external',
      'function getTokenCount() external view returns (uint256)',
      'function tokens(uint256 index) external view returns (address)',
      'function tokenInfo(address token) external view returns (address creator, address nftCollection, address reserveToken, uint256 maxSupply, uint16 mintRoyalty, uint16 burnRoyalty, bool exists)',
      'function nftCollectionToToken(address nftCollection) external view returns (address)',
      'function creationFee() external view returns (uint256)',
      'function royaltyRecipient() external view returns (address)',
      'event TokenCreated(address indexed token, address indexed creator, address indexed nftCollection, string name, string symbol, address reserveToken, uint256 maxSupply, uint16 mintRoyalty, uint16 burnRoyalty)',
      'event CreationFeeUpdated(uint256 newFee)'
    ]
  },

  StakingFactory: {
    address: process.env.NEXT_PUBLIC_STAKING_FACTORY_ADDRESS || '',
    abi: [
      // StakingFactory ABI
      'function createPool(address stakingToken, address rewardToken) external payable returns (address)',
      'function updateCreationFee(uint256 newFee) external',
      'function updateProtocolFeeRecipient(address newRecipient) external',
      'function updateProtocolFeeBps(uint256 newFeeBps) external',
      'function getPoolCount() external view returns (uint256)',
      'function pools(uint256 index) external view returns (address)',
      'function poolInfo(address pool) external view returns (address creator, address stakingToken, address nftCollection, address rewardToken, bool exists)',
      'function tokenToPool(address token) external view returns (address)',
      'function creationFee() external view returns (uint256)',
      'function protocolFeeRecipient() external view returns (address)',
      'function protocolFeeBps() external view returns (uint256)',
      'event PoolCreated(address indexed pool, address indexed creator, address indexed stakingToken, address nftCollection, address rewardToken)',
      'event CreationFeeUpdated(uint256 newFee)'
    ]
  }
};

// Individual contract ABIs
export const NFT_COLLECTION_ABI = [
  'function initialize(string name, string symbol, string baseURI, address creator, address paymentToken, uint256 mintPrice, uint256 maxSupply, address protocolFeeRecipient, uint256 protocolFeeBps) external',
  'function mint(address to, uint256 amount) external payable',
  'function setStakingPool(address stakingPool) external',
  'function setBaseURI(string newBaseURI) external',
  'function distributeRevenue() external',
  'function name() external view returns (string)',
  'function symbol() external view returns (string)',
  'function creator() external view returns (address)',
  'function paymentToken() external view returns (address)',
  'function mintPrice() external view returns (uint256)',
  'function maxSupply() external view returns (uint256)',
  'function totalSupply() external view returns (uint256)',
  'function stakingPool() external view returns (address)',
  'function totalRevenue() external view returns (uint256)',
  'function distributedRevenue() external view returns (uint256)',
  'function pendingRevenue() external view returns (uint256)',
  'function tokenURI(uint256 tokenId) external view returns (string)',
  'function ownerOf(uint256 tokenId) external view returns (address)',
  'function balanceOf(address owner) external view returns (uint256)',
  'event Minted(address indexed to, uint256 indexed tokenId, uint256 price)',
  'event StakingPoolSet(address indexed stakingPool)',
  'event RevenueDistributed(uint256 amount)'
];

export const BONDING_TOKEN_ABI = [
  'function mint(uint256 tokensToMint, uint256 maxReserveAmount, address receiver) external payable returns (uint256)',
  'function burn(uint256 tokensToBurn, uint256 minRefund, address receiver) external returns (uint256)',
  'function calculateBuyCost(uint256 tokensToMint) external view returns (uint256)',
  'function calculateSellRefund(uint256 tokensToBurn) external view returns (uint256)',
  'function getCurrentPrice() external view returns (uint256)',
  'function getMaxSupply() external view returns (uint256)',
  'function name() external view returns (string)',
  'function symbol() external view returns (string)',
  'function decimals() external view returns (uint8)',
  'function totalSupply() external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function creator() external view returns (address)',
  'function nftCollection() external view returns (address)',
  'function reserveToken() external view returns (address)',
  'function reserveBalance() external view returns (uint256)',
  'function mintRoyalty() external view returns (uint16)',
  'function burnRoyalty() external view returns (uint16)',
  'function royaltyRecipient() external view returns (address)',
  'function holders(uint256 index) external view returns (address)',
  'function getHolderCount() external view returns (uint256)',
  'function priceHistory(uint256 index) external view returns (uint256 timestamp, uint256 price, uint256 supply)',
  'function getPriceHistoryLength() external view returns (uint256)',
  'event Mint(address indexed user, address indexed receiver, uint256 tokenAmount, uint256 reserveAmount)',
  'event Burn(address indexed user, address indexed receiver, uint256 tokenAmount, uint256 refundAmount)',
  'event RoyaltyPaid(address indexed recipient, uint256 amount)'
];

export const STAKING_POOL_ABI = [
  'function stake(uint256 amount) external',
  'function unstake(uint256 amount) external',
  'function claimRewards() external',
  'function exit() external',
  'function notifyRewardAmount(uint256 reward) external',
  'function earned(address user) external view returns (uint256)',
  'function creator() external view returns (address)',
  'function stakingToken() external view returns (address)',
  'function nftCollection() external view returns (address)',
  'function rewardToken() external view returns (address)',
  'function totalStaked() external view returns (uint256)',
  'function stakedBalance(address user) external view returns (uint256)',
  'function totalRewards() external view returns (uint256)',
  'function distributedRewards() external view returns (uint256)',
  'function pendingRewards(address user) external view returns (uint256)',
  'function stakingStartTime(address user) external view returns (uint256)',
  'function stakers(uint256 index) external view returns (address)',
  'function getStakerCount() external view returns (uint256)',
  'function protocolFeeRecipient() external view returns (address)',
  'function protocolFeeBps() external view returns (uint256)',
  'event Staked(address indexed user, uint256 amount)',
  'event Unstaked(address indexed user, uint256 amount)',
  'event RewardsClaimed(address indexed user, uint256 amount)',
  'event RewardsAdded(uint256 amount)',
  'event ProtocolFeePaid(uint256 amount)'
];

// ERC20 token ABI for payments
export const ERC20_ABI = [
  'function name() external view returns (string)',
  'function symbol() external view returns (string)',
  'function decimals() external view returns (uint8)',
  'function totalSupply() external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) external returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)'
];

// Helper constants
export const ETH_ADDRESS = '0x0000000000000000000000000000000000000000';
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

// Network configuration
export const SUPPORTED_NETWORKS = {
  mainnet: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://mainnet.infura.io/v3/',
    blockExplorer: 'https://etherscan.io'
  },
  sepolia: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    rpcUrl: 'https://sepolia.infura.io/v3/',
    blockExplorer: 'https://sepolia.etherscan.io'
  },
  hardhat: {
    chainId: 31337,
    name: 'Hardhat Local',
    rpcUrl: 'http://127.0.0.1:8545',
    blockExplorer: null
  }
}; 