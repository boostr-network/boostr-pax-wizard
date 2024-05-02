import React, { useRef, useState } from 'react';

export const AppContext = React.createContext(null);

export default ({ children }) => {
    const [activeTab, setActiveTab] = useState(0);
    const [collectionName, setCollectionName] = useState('');
    const [collectionDescription, setCollectionDescription] = useState('');
    const [assets, setAssets] = useState([]);
    const [packCover, setPackCover] = useState(null);
    const [deployResult, setDeployResult] = useState(null);
    const [amountClaimable, setAmountClaimable] = useState(0);
    const [claimerAddress, setClaimerAddress] = useState('');
    const [erc20TokenContractAddress, setErc20TokenContractAddress] = useState('');
    const [erc20TokenSymbol, setErc20TokenSymbol] = useState(null);
    const [erc20Decimals, setErc20Decimals] = useState(18);
    const [isThreeClasses, setIsThreeClasses] = useState(false);

    const [validatedSteps, setValidatedSteps] = useState([
      { isValidated: false },
      { isValidated: false },
      { isValidated: false },
      { isValidated: false },
    ]);

    const availableNetworks = {
      "taraxa-mainnet": {
        name: 'Taraxa Mainnet',
        value: 'taraxa-mainnet',
        token: 'TARA',
        chainId: 841,
        chainIdHex: '0x349',
        rpcUrl: 'https://rpc.mainnet.taraxa.io',
      },
      "taraxa-testnet": {
        name: 'Taraxa Testnet',
        value: 'taraxa-testnet',
        token: 'TARA',
        chainId: 842,
        chainIdHex: '0x34A',
        rpcUrl: 'https://rpc.testnet.taraxa.io',
      },
    };

    const defaultNetwork = "taraxa-testnet";

    const [packConfigs, setPackConfigs] = useState({
      priceInUsd: null,
      priceInNative: null,
      priceInERC20: null,
      maxSupply: null,
      network: availableNetworks[defaultNetwork],
      token: null,
    });

    const [packShares, setPackShares] = useState([
      {
        address: null,
        quantity: null,
      },
    ]);

    const store = {
      activeTab,
      setActiveTab,
      collectionName,
      setCollectionName,
      collectionDescription,
      setCollectionDescription,
      assets,
      setAssets,
      validatedSteps,
      setValidatedSteps,
      packConfigs,
      setPackConfigs,
      packCover,
      setPackCover,
      availableNetworks,
      packShares,
      setPackShares,
      deployResult,
      setDeployResult,
      amountClaimable,
      setAmountClaimable,
      claimerAddress,
      setClaimerAddress,
      erc20TokenContractAddress,
      setErc20TokenContractAddress,
      erc20TokenSymbol,
      setErc20TokenSymbol,
      erc20Decimals,
      setErc20Decimals,
      isThreeClasses,
      setIsThreeClasses
    };

    return (
      <AppContext.Provider value={store}>
        {children}
      </AppContext.Provider>
    );
}
