import { v1 } from '../contracts';
const { buyableSmartPack, buyableWithERC20SmartPack } = v1;
const { ethers } = require("ethers");

const deployBoosterPack = async (collectionName, assets, maxSupply, priceInWei = null, assetsMetadataFolderHash, packsMetadataFolderHash, shares, selectedNetwork, amountClaimable, claimerAddress, erc20TokenContractAddress = null, priceInERC20 = null) => {
  let boosterPackContractFactory, contract, collectibleAddress;
  // Get provider, signer and check network
  const provider = new ethers.BrowserProvider(window.ethereum);
  // Connect wallet
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  const currentAddress = await signer.getAddress();
  const connectedNetwork = await provider.getNetwork();

  // Request network change if necessary
  if(connectedNetwork.chainId !== selectedNetwork.chainId) {
    const result = await changeNetwork(null, selectedNetwork);
  }

  // creatorAndClaimer: Array of two elements. First element must be the address of collection creator, and the second element must be the address of the claimer
  let creatorAndClaimer;
  if (currentAddress === claimerAddress || !claimerAddress) {
    creatorAndClaimer = [currentAddress, currentAddress];
  } else {
    creatorAndClaimer = [currentAddress, claimerAddress];
  }

  // tokenClasses: Multi-dimensional array of token ids of all the 5 different classes
  const commonTokens = [];
  const uncommonTokens = [];
  const rareTokens = [];
  const epicTokens = [];
  const legendaryTokens = [];

  // Separate tokens by rarity class
  for (var i = 0; i < assets.length; i++) {
    if (assets[i].rarity === 'common') { commonTokens.push(i) };
    if (assets[i].rarity === 'uncommon') { uncommonTokens.push(i) };
    if (assets[i].rarity === 'rare') { rareTokens.push(i) };
    if (assets[i].rarity === 'epic') { epicTokens.push(i) };
    if (assets[i].rarity === 'legendary') { legendaryTokens.push(i) };
  }

  // royalties: Array of addresses that the contract will split the payments to
  // shares: Array of shares for each address of the royalties array. Both arrays must be the same length
  const sharesAddresses = [];
  const sharesQuantities = [];
  for (var i = 0; i < shares.length; i++) {
    sharesAddresses.push(shares[i].address);
    sharesQuantities.push(shares[i].quantity);
  }

  if (erc20TokenContractAddress) {
    // buyableWithERC20SmartPack Contract factory instance
    boosterPackContractFactory = new ethers.ContractFactory(buyableWithERC20SmartPack.ABI, buyableWithERC20SmartPack.BYTECODE, signer);
    contract = await boosterPackContractFactory.deploy(creatorAndClaimer, amountClaimable, collectionName, [commonTokens, uncommonTokens, rareTokens, epicTokens, legendaryTokens], maxSupply, priceInERC20, erc20TokenContractAddress, `ipfs://${assetsMetadataFolderHash}/`, `ipfs://${packsMetadataFolderHash}/`, sharesAddresses, sharesQuantities);
  } else {
    // buyableSmartPack Contract factory instance
    boosterPackContractFactory = new ethers.ContractFactory(buyableSmartPack.ABI, buyableSmartPack.BYTECODE, signer);
    contract = await boosterPackContractFactory.deploy(creatorAndClaimer, amountClaimable, collectionName, [commonTokens, uncommonTokens, rareTokens, epicTokens, legendaryTokens], maxSupply, priceInWei, `ipfs://${assetsMetadataFolderHash}/`, `ipfs://${packsMetadataFolderHash}/`, sharesAddresses, sharesQuantities);
    console.log(creatorAndClaimer, amountClaimable, collectionName, [commonTokens, uncommonTokens, rareTokens, epicTokens, legendaryTokens], maxSupply, priceInWei, `ipfs://${assetsMetadataFolderHash}/`, `ipfs://${packsMetadataFolderHash}/`, sharesAddresses, sharesQuantities);
  }

  await contract.deploymentTransaction().wait(2);
  const smartPackContractAddress = await contract.getAddress();
  collectibleAddress = await contract.smartCollectibleContract();

  // Testing
  // console.log('signer', signer);
  // console.log('boosterPackContractFactory', boosterPackContractFactory);
  // console.log('creatorAndClaimer', creatorAndClaimer);
  // console.log('amountClaimable', amountClaimable);
  // console.log('collectionName', collectionName);
  // console.log('commonTokens', commonTokens);
  // console.log('uncommonTokens', uncommonTokens);
  // console.log('rareTokens', rareTokens);
  // console.log('epicTokens', epicTokens);
  // console.log('legendaryTokens', legendaryTokens);
  // console.log('maxSupply', maxSupply);
  // console.log('priceInWei', priceInWei);
  // console.log('assetsMetadataFolderHash', assetsMetadataFolderHash);
  // console.log('packsMetadataFolderHash', packsMetadataFolderHash);
  // console.log('sharesAddresses', sharesAddresses);
  // console.log('sharesQuantities', sharesQuantities);
  // console.log('contract', contract);
  // console.log('collectibleAddress', collectibleAddress);

  if (collectibleAddress) {
    return {
      success: true,
      creatorAndClaimer,
      amountClaimable,
      collectionName,
      attrbutes: [commonTokens, uncommonTokens, rareTokens, epicTokens, legendaryTokens],
      maxSupply,
      priceInWei,
      assetsMetadataFolderUri: `ipfs://${assetsMetadataFolderHash}`,
      packsMetadataFolderUri: `ipfs://${packsMetadataFolderHash}`,
      sharesAddresses,
      sharesQuantities,
      contract,
      smartPackContractAddress,
      collectibleAddress,
      erc20TokenContractAddress,
      priceInERC20,
    }
  } else {
    return {
      success: false,
    }
  }
}

const changeNetwork = async (callback, selectedNetwork) => {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: selectedNetwork.chainIdHex }],
    });
    if (callback) {
      callback();
    }
  } catch (e) {
    if (e.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: selectedNetwork.chainId,
              rpcUrl: selectedNwtwork.rpcUrl,
            },
          ],
        });
        if (callback) {
          callback();
        }
      } catch (addError) {
        console.log(addError);
      }
    }
    console.log(e);
  }
}

export { deployBoosterPack, changeNetwork };
