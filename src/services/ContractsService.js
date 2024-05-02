import { v1 } from '../contracts';
const { ERC20 } = v1;
const { ethers } = require("ethers");
import { changeNetwork } from './DeployService';

const checkContractData = async (contractAddress, selectedNetwork) => {
  let symbol = null;
  let decimals = null;
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const connectedNetwork = await provider.getNetwork();

  // Request network change if necessary
  if (connectedNetwork.chainId !== selectedNetwork.chainId) {
    await changeNetwork(null, selectedNetwork);
  }

  const contract = new ethers.Contract(contractAddress, ERC20.ABI, provider);

  try {
    symbol = await contract.symbol();
    decimals = await contract.decimals();
  } catch (e) {
    console.log(e);
    symbol = null;
    decimals = null;
  }

  return {
    symbol,
    decimals
  };
}

export { checkContractData };
