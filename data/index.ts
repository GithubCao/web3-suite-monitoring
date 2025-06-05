// 主流链信息字典
// 仅列举主网，如需补充测试网可再添加

export { networkDict, ChainIdMap };

const networkDict = [{
  chainId: 1,
  explorers: [{
      name: "etherscan",
      url: "https://etherscan.io",
      standard: "EIP3091"
  }, {
      name: "blockscout",
      url: "https://eth.blockscout.com",
      icon: "blockscout",
      standard: "EIP3091"
  }, {
      name: "dexguru",
      url: "https://ethereum.dex.guru",
      icon: "dexguru",
      standard: "EIP3091"
  }, {
      name: "Routescan",
      url: "https://ethereum.routescan.io",
      standard: "EIP3091"
  }],
  nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18
  },
  name: "Ethereum Mainnet",
  shortName: "eth"
}, {
  chainId: 5,
  explorers: [{
      name: "etherscan-goerli",
      url: "https://goerli.etherscan.io",
      standard: "EIP3091"
  }, {
      name: "blockscout-goerli",
      url: "https://eth-goerli.blockscout.com",
      icon: "blockscout",
      standard: "EIP3091"
  }],
  nativeCurrency: {
      name: "Goerli Ether",
      symbol: "ETH",
      decimals: 18
  },
  name: "Goerli",
  shortName: "gor"
}, {
  chainId: 10,
  explorers: [{
      name: "etherscan",
      url: "https://optimistic.etherscan.io",
      standard: "EIP3091"
  }, {
      name: "blockscout",
      url: "https://optimism.blockscout.com",
      icon: "blockscout",
      standard: "EIP3091"
  }, {
      name: "dexguru",
      url: "https://optimism.dex.guru",
      icon: "dexguru",
      standard: "EIP3091"
  }, {
      name: "Routescan",
      url: "https://mainnet.superscan.network",
      standard: "EIP3091"
  }],
  nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18
  },
  name: "OP Mainnet",
  shortName: "oeth"
}, {
  chainId: 25,
  explorers: [{
      name: "Cronos Explorer",
      url: "https://explorer.cronos.org",
      standard: "none"
  }],
  nativeCurrency: {
      name: "Cronos",
      symbol: "CRO",
      decimals: 18
  },
  name: "Cronos Mainnet",
  shortName: "cro"
}, {
  chainId: 30,
  explorers: [{
      name: "Rootstock Explorer",
      url: "https://explorer.rsk.co",
      standard: "EIP3091"
  }, {
      name: "blockscout",
      url: "https://rootstock.blockscout.com",
      icon: "blockscout",
      standard: "EIP3091"
  }],
  nativeCurrency: {
      name: "Smart Bitcoin",
      symbol: "RBTC",
      decimals: 18
  },
  name: "Rootstock Mainnet",
  shortName: "rsk"
}, {
  chainId: 40,
  explorers: [{
      name: "teloscan",
      url: "https://teloscan.io",
      standard: "EIP3091"
  }],
  nativeCurrency: {
      name: "Telos",
      symbol: "TLOS",
      decimals: 18
  },
  name: "Telos EVM Mainnet",
  shortName: "TelosEVM"
}, {
  chainId: 56,
  explorers: [{
      name: "bscscan",
      url: "https://bscscan.com",
      standard: "EIP3091"
  }, {
      name: "dexguru",
      url: "https://bnb.dex.guru",
      icon: "dexguru",
      standard: "EIP3091"
  }],
  nativeCurrency: {
      name: "BNB Chain Native Token",
      symbol: "BNB",
      decimals: 18
  },
  name: "BNB Smart Chain Mainnet",
  shortName: "bnb"
}, {
  chainId: 66,
  explorers: [{
      name: "OKLink",
      url: "https://www.oklink.com/en/okc",
      standard: "EIP3091"
  }],
  nativeCurrency: {
      name: "OKXChain Global Utility Token",
      symbol: "OKT",
      decimals: 18
  },
  name: "OKXChain Mainnet",
  shortName: "okt"
}, {
  chainId: 97,
  explorers: [{
      name: "bscscan-testnet",
      url: "https://testnet.bscscan.com",
      standard: "EIP3091"
  }],
  nativeCurrency: {
      name: "BNB Chain Native Token",
      symbol: "tBNB",
      decimals: 18
  },
  name: "BNB Smart Chain Testnet",
  shortName: "bnbt"
}, {
  chainId: 100,
  explorers: [{
      name: "gnosisscan",
      url: "https://gnosisscan.io",
      standard: "EIP3091"
  }, {
      name: "blockscout",
      url: "https://gnosis.blockscout.com",
      icon: "blockscout",
      standard: "EIP3091"
  }, {
      name: "dexguru",
      url: "https://gnosis.dex.guru",
      icon: "dexguru",
      standard: "EIP3091"
  }],
  nativeCurrency: {
      name: "xDAI",
      symbol: "XDAI",
      decimals: 18
  },
  name: "Gnosis",
  shortName: "gno"
}, {
  chainId: 108,
  explorers: [{
      name: "thundercore-viewblock",
      url: "https://viewblock.io/thundercore",
      standard: "EIP3091"
  }],
  nativeCurrency: {
      name: "ThunderCore Token",
      symbol: "TT",
      decimals: 18
  },
  name: "ThunderCore Mainnet",
  shortName: "TT"
}, {
  chainId: 122,
  explorers: [{
      name: "blockscout",
      url: "https://explorer.fuse.io",
      icon: "blockscout",
      standard: "EIP3091"
  }],
  nativeCurrency: {
      name: "Fuse",
      symbol: "FUSE",
      decimals: 18
  },
  name: "Fuse Mainnet",
  shortName: "fuse"
}, {
  chainId: 128,
  explorers: [{
      name: "hecoinfo",
      url: "https://hecoinfo.com",
      standard: "EIP3091"
  }],
  nativeCurrency: {
      name: "Huobi ECO Chain Native Token",
      symbol: "HT",
      decimals: 18
  },
  name: "Huobi ECO Chain Mainnet",
  shortName: "heco"
}, {
  chainId: 137,
  explorers: [{
      name: "polygonscan",
      url: "https://polygonscan.com",
      standard: "EIP3091"
  }, {
      name: "dexguru",
      url: "https://polygon.dex.guru",
      icon: "dexguru",
      standard: "EIP3091"
  }],
  nativeCurrency: {
      name: "POL",
      symbol: "POL",
      decimals: 18
  },
  name: "Polygon Mainnet",
  shortName: "pol"
}, {
  chainId: 146,
  explorers: [{
      name: "sonic",
      url: "https://explorer.soniclabs.com",
      icon: "sonic",
      standard: "none"
  }],
  nativeCurrency: {
      name: "Sonic",
      symbol: "S",
      decimals: 18
  },
  name: "Sonic Mainnet",
  shortName: "sonic"
}, {
  chainId: 169,
  explorers: [{
      name: "manta-pacific Explorer",
      url: "https://pacific-explorer.manta.network",
      standard: "EIP3091"
  }],
  nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18
  },
  name: "Manta Pacific Mainnet",
  shortName: "manta"
}, {
  chainId: 199,
  explorers: [{
      name: "BitTorrent Chain Explorer",
      url: "https://bttcscan.com",
      standard: "EIP3091"
  }],
  nativeCurrency: {
      name: "BitTorrent",
      symbol: "BTT",
      decimals: 18
  },
  name: "BitTorrent Chain Mainnet",
  shortName: "BTT"
}, {
  chainId: 250,
  explorers: [{
      name: "ftmscan",
      url: "https://ftmscan.com",
      icon: "ftmscan",
      standard: "EIP3091"
  }, {
      name: "dexguru",
      url: "https://fantom.dex.guru",
      icon: "dexguru",
      standard: "EIP3091"
  }],
  nativeCurrency: {
      name: "Fantom",
      symbol: "FTM",
      decimals: 18
  },
  name: "Fantom Opera",
  shortName: "ftm"
}, {
  chainId: 288,
  explorers: [{
      name: "Bobascan",
      url: "https://bobascan.com",
      standard: "none"
  }],
  nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18
  },
  name: "Boba Network",
  shortName: "Boba",
  parent: {
      type: "L2",
      chain: "eip155-1",
      bridges: [{
          url: "https://gateway.boba.network"
      }]
  }
}, {
  chainId: 314,
  explorers: [{
      name: "Filfox",
      url: "https://filfox.info/en",
      standard: "none"
  }, {
      name: "Beryx",
      url: "https://beryx.zondax.ch",
      standard: "none"
  }, {
      name: "Glif Explorer",
      url: "https://explorer.glif.io",
      standard: "EIP3091"
  }, {
      name: "Dev.storage",
      url: "https://dev.storage",
      standard: "none"
  }, {
      name: "Filscan",
      url: "https://filscan.io",
      standard: "none"
  }, {
      name: "Filscout",
      url: "https://filscout.io/en",
      standard: "none"
  }],
  nativeCurrency: {
      name: "filecoin",
      symbol: "FIL",
      decimals: 18
  },
  name: "Filecoin - Mainnet",
  shortName: "filecoin"
}, {
  chainId: 324,
  explorers: [{
      name: "zkSync Era Block Explorer",
      url: "https://explorer.zksync.io",
      icon: "zksync-era",
      standard: "EIP3091"
  }],
  nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18
  },
  name: "zkSync Mainnet",
  shortName: "zksync",
  parent: {
      type: "L2",
      chain: "eip155-1",
      bridges: [{
          url: "https://bridge.zksync.io/"
      }]
  }
}, {
  chainId: 1088,
  explorers: [{
      name: "blockscout",
      url: "https://andromeda-explorer.metis.io",
      standard: "EIP3091"
  }],
  nativeCurrency: {
      name: "Metis",
      symbol: "METIS",
      decimals: 18
  },
  name: "Metis Andromeda Mainnet",
  shortName: "metis-andromeda",
  parent: {
      type: "L2",
      chain: "eip155-1",
      bridges: [{
          url: "https://bridge.metis.io"
      }]
  }
}, {
  chainId: 1101,
  explorers: [{
      name: "blockscout",
      url: "https://zkevm.polygonscan.com",
      icon: "zkevm",
      standard: "EIP3091"
  }],
  nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18
  },
  name: "Polygon zkEVM",
  shortName: "zkevm",
  parent: {
      type: "L2",
      chain: "eip155-1",
      bridges: [{
          url: "https://bridge.zkevm-rpc.com"
      }]
  }
}, {
  chainId: 1116,
  explorers: [{
      name: "Core Scan",
      url: "https://scan.coredao.org",
      icon: "core",
      standard: "EIP3091"
  }],
  nativeCurrency: {
      name: "Core Blockchain Native Token",
      symbol: "CORE",
      decimals: 18
  },
  name: "Core Blockchain Mainnet",
  shortName: "core"
}, {
  chainId: 1284,
  explorers: [{
      name: "moonscan",
      url: "https://moonbeam.moonscan.io",
      standard: "none"
  }],
  nativeCurrency: {
      name: "Glimmer",
      symbol: "GLMR",
      decimals: 18
  },
  name: "Moonbeam",
  shortName: "mbeam"
}, {
  chainId: 1285,
  explorers: [{
      name: "moonscan",
      url: "https://moonriver.moonscan.io",
      standard: "none"
  }],
  nativeCurrency: {
      name: "Moonriver",
      symbol: "MOVR",
      decimals: 18
  },
  name: "Moonriver",
  shortName: "mriver"
}, {
  chainId: 2222,
  explorers: [{
      name: "Kava EVM Explorer",
      url: "https://kavascan.com",
      standard: "EIP3091",
      icon: "kava"
  }],
  nativeCurrency: {
      name: "Kava",
      symbol: "KAVA",
      decimals: 18
  },
  name: "Kava",
  shortName: "kava"
}, {
  chainId: 4002,
  explorers: [{
      name: "ftmscan",
      url: "https://testnet.ftmscan.com",
      icon: "ftmscan",
      standard: "EIP3091"
  }],
  nativeCurrency: {
      name: "Fantom",
      symbol: "FTM",
      decimals: 18
  },
  name: "Fantom Testnet",
  shortName: "tftm"
}, {
  chainId: 5e3,
  explorers: [{
      name: "mantlescan",
      url: "https://mantlescan.xyz",
      standard: "EIP3091"
  }, {
      name: "Mantle Explorer",
      url: "https://explorer.mantle.xyz",
      standard: "EIP3091"
  }],
  nativeCurrency: {
      name: "Mantle",
      symbol: "MNT",
      decimals: 18
  },
  name: "Mantle",
  shortName: "mantle",
  parent: {
      type: "L2",
      chain: "eip155-1",
      bridges: [{
          url: "https://bridge.mantle.xyz"
      }]
  }
}, {
  chainId: 7e3,
  explorers: [{
      name: "ZetaChain Mainnet Explorer",
      url: "https://explorer.zetachain.com",
      standard: "none"
  }],
  nativeCurrency: {
      name: "Zeta",
      symbol: "ZETA",
      decimals: 18
  },
  name: "ZetaChain Mainnet",
  shortName: "zetachain-mainnet"
}, {
  chainId: 8453,
  explorers: [{
      name: "basescan",
      url: "https://basescan.org",
      standard: "EIP3091"
  }, {
      name: "basescout",
      url: "https://base.blockscout.com",
      icon: "blockscout",
      standard: "EIP3091"
  }, {
      name: "dexguru",
      url: "https://base.dex.guru",
      icon: "dexguru",
      standard: "EIP3091"
  }, {
      name: "Routescan",
      url: "https://base.superscan.network",
      standard: "EIP3091"
  }],
  nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18
  },
  name: "Base",
  shortName: "base"
}, {
  chainId: 11235,
  explorers: [{
      name: "Mainnet HAQQ Explorer",
      url: "https://explorer.haqq.network",
      standard: "EIP3091"
  }],
  nativeCurrency: {
      name: "Islamic Coin",
      symbol: "ISLM",
      decimals: 18
  },
  name: "Haqq Network",
  shortName: "ISLM"
}, {
  chainId: 33111,
  explorers: [{
      name: "Curtis Explorer",
      url: "https://explorer.curtis.apechain.com",
      standard: "EIP3091"
  }],
  nativeCurrency: {
      name: "ApeCoin",
      symbol: "APE",
      decimals: 18
  },
  name: "Curtis",
  shortName: "curtis"
}, {
  chainId: 33139,
  explorers: [{
      name: "ApeChain Explorer",
      url: "https://apescan.io",
      standard: "EIP3091"
  }],
  nativeCurrency: {
      name: "ApeCoin",
      symbol: "APE",
      decimals: 18
  },
  name: "ApeChain",
  shortName: "apechain"
}, {
  chainId: 34443,
  explorers: [{
      name: "modescout",
      url: "https://explorer.mode.network",
      standard: "none"
  }, {
      name: "Routescan",
      url: "https://modescan.io",
      standard: "none"
  }],
  nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18
  },
  name: "Mode",
  shortName: "mode"
}, {
  chainId: 42161,
  explorers: [{
      name: "Arbiscan",
      url: "https://arbiscan.io",
      standard: "EIP3091"
  }, {
      name: "Arbitrum Explorer",
      url: "https://explorer.arbitrum.io",
      standard: "EIP3091"
  }, {
      name: "dexguru",
      url: "https://arbitrum.dex.guru",
      icon: "dexguru",
      standard: "EIP3091"
  }],
  nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18
  },
  name: "Arbitrum One",
  shortName: "arb1",
  parent: {
      type: "L2",
      chain: "eip155-1",
      bridges: [{
          url: "https://bridge.arbitrum.io"
      }]
  }
}, {
  chainId: 42170,
  explorers: [{
      name: "Arbitrum Nova Chain Explorer",
      url: "https://nova-explorer.arbitrum.io",
      icon: "blockscout",
      standard: "EIP3091"
  }],
  nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18
  },
  name: "Arbitrum Nova",
  shortName: "arb-nova",
  parent: {
      type: "L2",
      chain: "eip155-1",
      bridges: [{
          url: "https://bridge.arbitrum.io"
      }]
  }
}, {
  chainId: 42220,
  explorers: [{
      name: "Celoscan",
      url: "https://celoscan.io",
      standard: "EIP3091"
  }, {
      name: "blockscout",
      url: "https://explorer.celo.org",
      standard: "none"
  }],
  nativeCurrency: {
      name: "CELO",
      symbol: "CELO",
      decimals: 18
  },
  name: "Celo Mainnet",
  shortName: "celo"
}, {
  chainId: 43111,
  explorers: [{
      name: "blockscout",
      url: "https://explorer.hemi.xyz",
      icon: "blockscout",
      standard: "EIP3091"
  }],
  nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18
  },
  name: "Hemi",
  shortName: "hemi",
  parent: {
      type: "L2",
      chain: "eip155-1"
  }
}, {
  chainId: 43113,
  explorers: [{
      name: "Etherscan",
      url: "https://testnet.snowscan.xyz",
      standard: "EIP3091"
  }, {
      name: "Routescan",
      url: "https://testnet.snowtrace.io",
      standard: "EIP3091"
  }, {
      name: "Avascan",
      url: "https://testnet.avascan.info",
      standard: "EIP3091"
  }],
  nativeCurrency: {
      name: "Avalanche",
      symbol: "AVAX",
      decimals: 18
  },
  name: "Avalanche Fuji Testnet",
  shortName: "Fuji"
}, {
  chainId: 43114,
  explorers: [{
      name: "Etherscan",
      url: "https://snowscan.xyz",
      standard: "EIP3091"
  }, {
      name: "Routescan",
      url: "https://snowtrace.io",
      standard: "EIP3091"
  }, {
      name: "Avascan",
      url: "https://avascan.info",
      standard: "EIP3091"
  }],
  nativeCurrency: {
      name: "Avalanche",
      symbol: "AVAX",
      decimals: 18
  },
  name: "Avalanche C-Chain",
  shortName: "avax"
}, {
  chainId: 43288,
  explorers: [{
      name: "Boba Avax Explorer",
      url: "https://blockexplorer.avax.boba.network",
      standard: "none"
  }],
  nativeCurrency: {
      name: "Boba Token",
      symbol: "BOBA",
      decimals: 18
  },
  name: "Boba Avax",
  shortName: "bobaavax"
}, {
  chainId: 56288,
  explorers: [{
      name: "Boba BNB block explorer",
      url: "https://bobascan.com",
      standard: "none"
  }],
  nativeCurrency: {
      name: "Boba Token",
      symbol: "BOBA",
      decimals: 18
  },
  name: "Boba BNB Mainnet",
  shortName: "BobaBnb",
  parent: {
      type: "L2",
      chain: "eip155-56",
      bridges: [{
          url: "https://gateway.boba.network"
      }]
  }
}, {
  chainId: 59144,
  explorers: [{
      name: "Etherscan",
      url: "https://lineascan.build",
      standard: "EIP3091",
      icon: "linea"
  }, {
      name: "Blockscout",
      url: "https://explorer.linea.build",
      standard: "EIP3091",
      icon: "linea"
  }, {
      name: "L2scan",
      url: "https://linea.l2scan.co",
      standard: "EIP3091",
      icon: "linea"
  }],
  nativeCurrency: {
      name: "Linea Ether",
      symbol: "ETH",
      decimals: 18
  },
  name: "Linea",
  shortName: "linea",
  parent: {
      type: "L2",
      chain: "eip155-1",
      bridges: [{
          url: "https://bridge.linea.build"
      }]
  }
}, {
  chainId: 80001,
  explorers: [{
      name: "polygonscan",
      url: "https://mumbai.polygonscan.com",
      standard: "EIP3091"
  }],
  nativeCurrency: {
      name: "MATIC",
      symbol: "MATIC",
      decimals: 18
  },
  name: "Mumbai",
  shortName: "maticmum"
}, {
  chainId: 81457,
  explorers: [{
      name: "Blastscan",
      url: "https://blastscan.io",
      icon: "blast",
      standard: "EIP3091"
  }, {
      name: "Blast Explorer",
      url: "https://blastexplorer.io",
      icon: "blast",
      standard: "EIP3091"
  }],
  nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18
  },
  name: "Blast",
  shortName: "blastmainnet",
  parent: {
      type: "L2",
      chain: "eip155-1"
  }
}, {
  chainId: 167e3,
  explorers: [{
      name: "etherscan",
      url: "https://taikoscan.io",
      standard: "EIP3091"
  }, {
      name: "Routescan",
      url: "https://taikoexplorer.com",
      standard: "EIP3091"
  }],
  nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18
  },
  name: "Taiko Alethia",
  shortName: "tko-mainnet"
}, {
  chainId: 421614,
  explorers: [{
      name: "arbiscan-sepolia",
      url: "https://sepolia.arbiscan.io",
      standard: "EIP3091"
  }, {
      name: "Arbitrum Sepolia Rollup Testnet Explorer",
      url: "https://sepolia-explorer.arbitrum.io",
      standard: "EIP3091"
  }],
  nativeCurrency: {
      name: "Sepolia Ether",
      symbol: "ETH",
      decimals: 18
  },
  name: "Arbitrum Sepolia",
  shortName: "arb-sep",
  parent: {
      type: "L2",
      chain: "eip155-11155111",
      bridges: [{
          url: "https://bridge.arbitrum.io"
      }]
  }
}, {
  chainId: 534352,
  explorers: [{
      name: "Scrollscan",
      url: "https://scrollscan.com",
      standard: "EIP3091"
  }],
  nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18
  },
  name: "Scroll",
  shortName: "scr",
  parent: {
      type: "L2",
      chain: "eip155-1",
      bridges: [{
          url: "https://scroll.io/bridge"
      }]
  }
}, {
  chainId: 810180,
  explorers: [{
      name: "zkLink Nova Block Explorer",
      url: "https://explorer.zklink.io",
      icon: "zklink-nova",
      standard: "EIP3091"
  }],
  nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18
  },
  name: "zkLink Nova Mainnet",
  shortName: "zklink-nova",
  parent: {
      type: "L2",
      chain: "eip155-59144",
      bridges: [{
          url: "https://portal.zklink.io"
      }]
  }
}, {
  chainId: 0xaa36a7,
  explorers: [{
      name: "etherscan-sepolia",
      url: "https://sepolia.etherscan.io",
      standard: "EIP3091"
  }, {
      name: "otterscan-sepolia",
      url: "https://sepolia.otterscan.io",
      standard: "EIP3091"
  }, {
      name: "Routescan",
      url: "https://11155111.testnet.routescan.io",
      standard: "EIP3091"
  }],
  nativeCurrency: {
      name: "Sepolia Ether",
      symbol: "ETH",
      decimals: 18
  },
  name: "Ethereum Sepolia",
  shortName: "sep"
}, {
  chainId: 16666e5,
  explorers: [{
      name: "Harmony Block Explorer",
      url: "https://explorer.harmony.one",
      standard: "EIP3091"
  }],
  nativeCurrency: {
      name: "ONE",
      symbol: "ONE",
      decimals: 18
  },
  name: "Harmony Mainnet Shard 0",
  shortName: "hmy-s0"
}, {
  chainId: 0x79f99296,
  explorers: [{
      name: "Blockscout",
      url: "https://elated-tan-skat.explorer.mainnet.skalenodes.com",
      standard: "EIP3091"
  }],
  nativeCurrency: {
      name: "sFUEL",
      symbol: "sFUEL",
      decimals: 18
  },
  name: "SKALE Europa Hub",
  shortName: "europa",
  parent: {
      type: "L2",
      chain: "eip155-1",
      bridges: [{
          url: "https://ruby.exchange/bridge.html"
      }]
  }
}, {
  chainId: 0x2a15c308d,
  explorers: [{
      name: "Chainlens",
      url: "https://palm.chainlens.com",
      standard: "EIP3091"
  }, {
      name: "Dora",
      url: "https://www.ondora.xyz/network/palm",
      standard: "none"
  }],
  nativeCurrency: {
      name: "PALM",
      symbol: "PALM",
      decimals: 18
  },
  name: "Palm",
  shortName: "palm"
}, {
  chainId: 33139,
  explorers: [{
      name: "ApeChain Explorer",
      url: "https://apescan.io",
      standard: "EIP3091"
  }],
  nativeCurrency: {
      name: "ApeCoin",
      symbol: "APE",
      decimals: 18
  },
  name: "ApeChain",
  shortName: "apechain"
}]

// 链常量名与 chainId 映射
const ChainIdMap = {
  ETHEREUM: 1,
  GÖRLI: 5,
  POLYGON: 137,
  POLYGON_TESTNET: 80001,
  FANTOM: 250,
  FANTOM_TESTNET: 4002,
  GNOSIS: 100,
  BSC: 56,
  BSC_TESTNET: 97,
  ARBITRUM: 42161,
  ARBITRUM_NOVA: 42170,
  ARBITRUM_TESTNET: 421614,
  AVALANCHE: 43114,
  AVALANCHE_TESTNET: 43113,
  HECO: 128,
  HARMONY: 1666600000,
  OKEX: 66,
  CELO: 42220,
  PALM: 705969163,
  MOONRIVER: 1285,
  FUSE: 122,
  TELOS: 40,
  MOONBEAM: 1284,
  OPTIMISM: 10,
  KAVA: 2222,
  METIS: 1088,
  BOBA: 288,
  BOBA_AVAX: 43288,
  BOBA_BNB: 56288,
  BTTC: 199,
  SEPOLIA: 11155111,
  POLYGON_ZKEVM: 1101,
  THUNDERCORE: 108,
  FILECOIN: 314,
  HAQQ: 11235,
  CORE: 1116,
  ZKSYNC_ERA: 324,
  LINEA: 59144,
  BASE: 8453,
  SCROLL: 534352,
  ZETACHAIN: 7000,
  CRONOS: 25,
  BLAST: 81457,
  SKALE_EUROPA: 2046399126,
  ROOTSTOCK: 30,
  MANTLE: 5000,
  CURTIS: 33111,
  MANTA: 169,
  MODE: 34443,
  TAIKO: 167000,
  ZKLINK: 810180,
  APE: 33139,
  SONIC: 146,
  HEMI: 43111
}; 