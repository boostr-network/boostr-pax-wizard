import React, { useContext, useEffect, useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { AppContext } from '../state/store';
import { checkContractData } from '../services/ContractsService';

const PRICE_IN_USD = 'PRICE_IN_USD';
const PRICE_IN_NATIVE = 'PRICE_IN_NATIVE';

const ConfigEditor = (props) => {
  const {
    collectionName,
    collectionDescription,
    packConfigs,
    setPackConfigs,
    packCover,
    setPackCover,
    validatedSteps,
    setValidatedSteps,
    setActiveTab,
    availableNetworks,
    packShares,
    setPackShares,
    activeTab,
    claimerAddress,
    setClaimerAddress,
    amountClaimable,
    setAmountClaimable,
    erc20TokenContractAddress,
    setErc20TokenContractAddress,
    setErc20TokenSymbol,
    erc20TokenSymbol,
    erc20Decimals,
    setErc20Decimals,
  } = useContext(AppContext);

  const [hasError, setHasError] = useState(false);
  const [active, setActive] = useState(false);
  const [validatingToken, setValidatingToken] = useState(false);
  const [validErc20Token, setValidErc20Token] = useState(null);
  const [priceInNativeOrUsd, setPriceInNativeOrUsd] = useState(PRICE_IN_NATIVE);
  const [minDecimalValue, setMinDecimalValue] = useState(Number('0.000001'));

  useEffect(() => {
    if (activeTab === 3) { setActive(true) }
  }, [activeTab]);

  const tokenAddressInput = useRef();
  const priceInUsdInput = useRef();
  const priceInNativeInput = useRef();

  const {getRootProps, getInputProps} = useDropzone({
    accept: {
      'image/*': [],
      'video/mp4': ['.mp4']
    },
    maxFiles: 1,
    onDrop: acceptedFiles => {
      const coverFile = Object.assign(acceptedFiles[0], {
        preview: URL.createObjectURL(acceptedFiles[0]),
        isUploaded: false,
        title: `${collectionName} pack cover`,
        collection: collectionName,
        description: collectionDescription,
        ipfsHash: null,
      });
      setPackCover(coverFile);
    }
  });

  const handleOnChange = (index = null, key, value) => {
    if(key === 'address' || key === 'quantity') {
      const updatedShares = packShares;
      updatedShares[index][key] = value;
      setPackShares([...updatedShares]);
    } else {
      const updatedConfigs = packConfigs;
      updatedConfigs[key] = key === 'network' ? availableNetworks[value] : value;
      if (key === 'priceInUsd') { updatedConfigs.priceInNative = null; }
      if (key === 'priceInNative') { updatedConfigs.priceInUsd = null; }
      if (key === 'token') {
        if (value === 'native') {
          setErc20TokenContractAddress('');
          updatedConfigs.priceInERC20 = null;
        } else {
          updatedConfigs.priceInUsd = null;
          updatedConfigs.priceInNative = null;
        }
      }
      setPackConfigs({...updatedConfigs});
      window.packConfigs = updatedConfigs;
    }
  }

  const handlePriceCurrencyChange = (usdOrNative) => {
    setPriceInNativeOrUsd(usdOrNative);
    // Reset values on currency change
    if (usdOrNative === PRICE_IN_USD) {
      handleOnChange(null, 'priceInNative', 0);
      priceInNativeInput.current.value = '';
    }
    if (usdOrNative === PRICE_IN_NATIVE) {
      handleOnChange(null, 'priceInUsd', 0);
      priceInUsdInput.current.value = '';
    }
  }

  const validateStep = () => {
    const {
      priceInUsd,
      priceInNative,
      priceInERC20,
      maxSupply,
      network,
    } = packConfigs;

    //Regex to match ETH & ETH Classic addresses format
    const regex = new RegExp('^0x[a-fA-F0-9]{40}$', 'g');

    let stepsArray = validatedSteps;

    const invalidShares = packShares.some((share) => !share.address || !share.quantity || share.quantity < 1 || !regex.test(share.address));

    if (priceInNativeOrUsd === PRICE_IN_USD && packConfigs.token !== 'erc20' && (!priceInUsd || priceInUsd < 1)) {
      setHasError(true);
      return;
    }

    if (priceInNativeOrUsd === PRICE_IN_NATIVE && packConfigs.token !== 'erc20' && (!priceInNative || !priceInNative > 0)) {
      setHasError(true);
      return;
    }

    if (packConfigs.token === 'erc20' && (!priceInERC20 || priceInERC20 < 1)) {
      setHasError(true);
      return;
    }

    if (!maxSupply || maxSupply < 1 || !network || invalidShares || !packCover) {
      setHasError(true);
      return;
    }

    if ((Number(amountClaimable) > Number(maxSupply)) || (amountClaimable && !claimerAddress)) {
      setHasError(true);
      return;
    }

    if (packConfigs.token === 'erc20' && !validErc20Token) {
      setHasError(true);
      return;
    }

    setHasError(false);
    stepsArray[3].isValidated = true;
    setValidatedSteps([...stepsArray]);
    setActiveTab(4);
  }

  const addShares = () => {
    const updatedShares = packShares;
    updatedShares.push({ address: null, quantiy: null });
    setPackShares([...updatedShares]);
  }

  const removeShare = (index) => {
    const updatedShares = packShares;
    updatedShares.splice(index, 1);
    setPackShares([...updatedShares]);
  }

  const checkTokenContract = async (contractAddress) => {
    setValidErc20Token(null);
    setValidatingToken(true);
    const contractData = await checkContractData(contractAddress, packConfigs.network);
    if (contractData.symbol) {
      setErc20TokenSymbol(contractData.symbol);
      setErc20TokenContractAddress(contractAddress);
      setValidErc20Token(true);
      setValidatingToken(false);
      if (contractData.decimals && erc20Decimals !== contractData.decimals) {
        setErc20Decimals(contractData.decimals);
        let minValue = '0.';
        for (var i = 0; i < contractData.decimals; i++) {
          if (i === contractData.decimals - 1) {
            minValue += '1';
          } else {
            minValue += '0';
          }
        }
        setMinDecimalValue(Number(minValue));
      }
    } else {
      setValidErc20Token(false);
      setValidatingToken(false);
    }
  }

  return (
    <section className={`text-gray-400 bg-gray-900 body-font overflow-hidden transition-opacity ease-in duration-900 ${active ? 'opacity-100' : 'opacity-0'}`}>
      <div className="container px-5 py-5 mx-auto">
        <div className="lg:w-4/5 mx-auto flex flex-wrap">
          <div className="lg:w-1/2 w-full lg:h-auto lg:max-h-128 h-64 object-cover object-center rounded">
            <div {...getRootProps({className: `w-full h-full bg-gray-800 shadow-md rounded-lg p-8 flex flex-col justify-center mx-auto w-full lg:mt-10 md:mt-0 relative z-10 border-dashed border-2 cursor-pointer ${(hasError && !packCover) ? 'border-red-500' : 'border-sky-500'}`})}>
              <input {...getInputProps()} />
              {packCover ? (
                <>
                  {packCover.type.includes('video') && (
                    <video
                      src={packCover.preview}
                      muted
                      autoPlay
                      loop
                      className="block w-auto h-full mx-auto"
                      type="video/mp4"
                    />
                  )}
                  {packCover.type.includes('image') && (
                    <img alt="Pack Cover" className="block w-auto h-full mx-auto" src={packCover.preview} />
                  )}
                </>
              ) : <p className="text-center leading-relaxed text-base">Drag and drop the art of the Smart Pack, or click here to select the file(s) manually (only images and videos are allowed)</p>
              }
            </div>
          </div>
          <div className="lg:w-1/2 w-full lg:pl-10 lg:py-6 mb-6 lg:mb-0">
            <h2 className="text-sm title-font text-gray-500 tracking-widest">SMART PACK®</h2>
            <h1 className="text-white text-3xl title-font font-medium mb-4">{collectionName || 'No collection name...'}</h1>
            <div className="flex mb-4">
              <a className="flex-grow text-indigo-400 border-b-2 border-indigo-500 py-2 text-lg px-1">Description</a>
            </div>
            <p className="leading-relaxed mb-4">{collectionDescription || 'No description...'}</p>
            {/* <div className="flex border-t border-gray-800 p-2 items-center justify-between relative">
              <span className="text-gray-500">Network</span>
              <select
                name="network"
                onChange={(e) => handleOnChange(null, 'network', e.target.value)}
                defaultValue={packConfigs.network || "placeholder"}
                className={`w-3/5 rounded border appearance-none bg-gray-800 py-2 focus:ring-2 focus:outline-none text-gray-100 text-base outline-none pl-3 pr-10 ${(hasError && !packConfigs.network) ? 'border-red-700 focus:ring-red-900 focus:border-red-500' : 'border-gray-700 focus:ring-indigo-900 focus:border-indigo-500'}`}
              >
                <option disabled value="placeholder">Select network to deploy on...</option>
                {availableNetworks.map((network, i) => {
                  return (
                    <option key={`${network.value}`} value={i}>
                      {network.name}
                    </option>
                  )
                })}
              </select>
              <span className="absolute right-0 top-0 h-full w-10 text-center text-gray-600 pointer-events-none flex items-center justify-center">
                <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M6 9l6 6 6-6"></path>
                </svg>
              </span>
            </div> */}
            {/* <div className="flex border-t border-gray-800 p-2 items-center justify-between relative">
              <span className="text-gray-500">Payment Token</span>
              <select
                name="token"
                onChange={(e) => handleOnChange(null, 'token', e.target.value)}
                defaultValue={packConfigs.token || "placeholder"}
                className={`w-3/5 rounded border appearance-none bg-gray-800 py-2 focus:ring-2 focus:outline-none text-gray-100 text-base outline-none pl-3 pr-10 ${(hasError && !packConfigs.network) ? 'border-red-700 focus:ring-red-900 focus:border-red-500' : 'border-gray-700 focus:ring-indigo-900 focus:border-indigo-500'}`}
              >
                <option disabled value="placeholder">Select token...</option>
                <option value="native">{`Native${packConfigs.network ? (" (" + packConfigs.network.token + ")") : ''}`}</option>
                <option value="erc20">ERC20</option>
              </select>
              <span className="absolute right-0 top-0 h-full w-10 text-center text-gray-600 pointer-events-none flex items-center justify-center">
                <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M6 9l6 6 6-6"></path>
                </svg>
              </span>
            </div> */}
            {packConfigs.token === 'erc20' && packConfigs.network && (
              <div className="flex border-t border-gray-800 p-2 items-center justify-between">
                <span className="text-gray-500">
                  Contract Address
                </span>
                {validatingToken && (
                  <div className="grow text-right">
                    <svg role="status" className="inline w-4 h-4 mr-2 text-gray-200 animate-spin dark:text-indigo-600 fill-indigo-600 dark:fill-gray-100" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                    </svg>
                  </div>
                )}
                {!validatingToken && validErc20Token && (
                  <div className="grow text-right">
                    <svg xmlns="http://www.w3.org/2000/svg" className="inline w-4 h-4 mr-2 fill-green-500" viewBox="0 0 512 512" fill="currentColor">
                      <path d="M0 256C0 114.6 114.6 0 256 0C397.4 0 512 114.6 512 256C512 397.4 397.4 512 256 512C114.6 512 0 397.4 0 256zM371.8 211.8C382.7 200.9 382.7 183.1 371.8 172.2C360.9 161.3 343.1 161.3 332.2 172.2L224 280.4L179.8 236.2C168.9 225.3 151.1 225.3 140.2 236.2C129.3 247.1 129.3 264.9 140.2 275.8L204.2 339.8C215.1 350.7 232.9 350.7 243.8 339.8L371.8 211.8z"/>
                    </svg>
                  </div>
                )}
                {!validatingToken && validErc20Token === false && (
                  <div className="grow text-right">
                    <svg xmlns="http://www.w3.org/2000/svg" className="inline w-4 h-4 mr-2 fill-red-500" viewBox="0 0 512 512" fill="currentColor">>
                      <path d="M0 256C0 114.6 114.6 0 256 0C397.4 0 512 114.6 512 256C512 397.4 397.4 512 256 512C114.6 512 0 397.4 0 256zM175 208.1L222.1 255.1L175 303C165.7 312.4 165.7 327.6 175 336.1C184.4 346.3 199.6 346.3 208.1 336.1L255.1 289.9L303 336.1C312.4 346.3 327.6 346.3 336.1 336.1C346.3 327.6 346.3 312.4 336.1 303L289.9 255.1L336.1 208.1C346.3 199.6 346.3 184.4 336.1 175C327.6 165.7 312.4 165.7 303 175L255.1 222.1L208.1 175C199.6 165.7 184.4 165.7 175 175C165.7 184.4 165.7 199.6 175 208.1V208.1z"/>
                    </svg>
                  </div>
                )}
                <input
                  type="text"
                  name="token-contract-address"
                  className={`w-3/5 rounded border appearance-none bg-gray-800 py-2 invalid:bg-red-900 invalid:bg-opacity-40 invalid:border-red-500 invalid:ring-red-900 focus:ring-2 focus:outline-none text-gray-100 text-base outline-none pl-3 pr-10 ${hasError && (packConfigs.network && !erc20TokenContractAddress) ? 'border-red-700 focus:ring-red-900 focus:border-red-500' : 'border-gray-700 focus:ring-indigo-900 focus:border-indigo-500'}`}
                  placeholder="0x..."
                  pattern="^0x[a-fA-F0-9]{40}$"
                  onChange={(e) => e.target.validity.valid ? checkTokenContract(e.target.value) : null}
                  defaultValue={erc20TokenContractAddress}
                  disabled={validatingToken}
                >
                </input>
              </div>
            )}
            {(!packConfigs.token || packConfigs.token === 'native') ? (
              <div className="flex border-t border-gray-800 p-2 items-center justify-between">
                <span className="text-gray-500">Price</span>
                <div className="flex items-center justify-between w-3/5 relative">
                  {priceInNativeOrUsd === PRICE_IN_USD ? (
                    <input
                      type="number"
                      id="price-in-usd"
                      name="price-in-usd"
                      className={`w-3/5 bg-gray-800 rounded invalid:bg-red-900 invalid:bg-opacity-40 invalid:border-red-500 invalid:ring-red-900 border focus:ring-2 text-base outline-none text-gray-100 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out ${(hasError && !packConfigs.priceInUsd) ? 'border-red-700 focus:border-red-500 focus:ring-red-900' : 'border-gray-700 focus:border-indigo-500 focus:ring-indigo-900'}`}
                      placeholder="1"
                      onChange={(e) => handleOnChange(null, 'priceInUsd', e.target.value)}
                      defaultValue={packConfigs.priceInUsd}
                      min="1"
                      step="1"
                      ref={priceInUsdInput}
                    />
                  ) : (
                    <input
                      type="number"
                      id="price-in-native"
                      name="price-in-native"
                      className={`w-3/5 bg-gray-800 rounded invalid:bg-red-900 invalid:bg-opacity-40 invalid:border-red-500 invalid:ring-red-900 border focus:ring-2 text-base outline-none text-gray-100 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out ${(hasError && !packConfigs.priceInNative) ? 'border-red-700 focus:border-red-500 focus:ring-red-900' : 'border-gray-700 focus:border-indigo-500 focus:ring-indigo-900'}`}
                      placeholder="0.0001"
                      onChange={(e) => handleOnChange(null, 'priceInNative', e.target.value)}
                      defaultValue={packConfigs.priceInNative}
                      step={.0001}
                      min="0.0001"
                      ref={priceInNativeInput}
                    />
                  )}
                  <select
                    name="currency"
                    onChange={(e) => handlePriceCurrencyChange(e.target.value)}
                    defaultValue={packConfigs.token || "placeholder"}
                    className='rounded border appearance-none bg-gray-800 py-2 focus:ring-2 focus:outline-none text-gray-100 text-base outline-none pl-2 pr-10 border-gray-700 focus:ring-indigo-900 focus:border-indigo-500'
                  >
                    {/* <option value={PRICE_IN_USD}>USD</option> */}
                    {packConfigs.network && <option value={PRICE_IN_NATIVE}>{packConfigs.network.token}</option>}
                  </select>
                  <span className="absolute right-0 top-0 h-full w-10 text-center text-gray-600 pointer-events-none flex items-center justify-center">
                    <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="w-4 h-4" viewBox="0 0 24 24">
                      <path d="M6 9l6 6 6-6"></path>
                    </svg>
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex border-t border-gray-800 p-2 items-center justify-between">
                {erc20TokenSymbol && <span className="text-gray-500">Price ({erc20TokenSymbol})</span>}
                {!erc20TokenSymbol && <span className="text-gray-500">Price (ERC20)</span>}
                <input
                  type="number"
                  id="price-in-erc20"
                  name="price-in-erc20"
                  className={`w-3/5 bg-gray-800 rounded invalid:bg-red-900 invalid:bg-opacity-40 invalid:border-red-500 invalid:ring-red-900 border focus:ring-2 text-base outline-none text-gray-100 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out ${(hasError && !packConfigs.priceInERC20) ? 'border-red-700 focus:border-red-500 focus:ring-red-900' : 'border-gray-700 focus:border-indigo-500 focus:ring-indigo-900'}`}
                  placeholder={minDecimalValue.toString()}
                  onChange={(e) => handleOnChange(null, 'priceInERC20', e.target.value)}
                  defaultValue={packConfigs.priceInERC20}
                  min={minDecimalValue}
                  step={minDecimalValue}
                />
              </div>
            )}
            <div className="flex border-t border-gray-800 p-2 items-center justify-between">
              <span className="text-gray-500">Maximum Supply</span>
              <input
                type="number"
                id="max-supply"
                name="max-supply"
                className={`w-3/5 bg-gray-800 rounded border invalid:bg-red-900 invalid:bg-opacity-40 invalid:border-red-500 invalid:ring-red-900 focus:ring-2 text-base outline-none text-gray-100 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out ${(hasError && !packConfigs.maxSupply) ? 'border-red-700 focus:border-red-500 focus:ring-red-900' : 'border-gray-700 focus:border-indigo-500 focus:ring-indigo-900'}`}
                placeholder="1"
                min="1"
                step="1"
                onChange={(e) => handleOnChange(null, 'maxSupply', e.target.value)}
                defaultValue={packConfigs.maxSupply}
              />
            </div>
            <div className="flex border-t border-gray-800 p-2 items-center justify-between">
              <span className="text-gray-500">Claimable Amount</span>
              <input
                type="number"
                id="claimable-amount"
                name="claimable-amount"
                className={`w-3/5 bg-gray-800 rounded border invalid:bg-red-900 invalid:bg-opacity-40 invalid:border-red-500 invalid:ring-red-900 focus:ring-2 text-base outline-none text-gray-100 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out ${(hasError && ((Number(amountClaimable) > 0 && !claimerAddress) || (Number(amountClaimable) > Number(packConfigs.maxSupply)))) ? 'border-red-700 focus:ring-red-900 focus:border-red-500' : 'border-gray-700 focus:ring-indigo-900 focus:border-indigo-500'}`}
                placeholder="0"
                min="0"
                step="1"
                onChange={(e) => setAmountClaimable(e.target.value)}
                defaultValue={amountClaimable || null}
              />
            </div>
            <div className="flex border-t border-gray-800 p-2 items-center justify-between">
              <span className="text-gray-500">Claimer Address</span>
              <input
                type="text"
                name="claimer-address"
                className={`w-3/5 rounded border appearance-none bg-gray-800 py-2 invalid:bg-red-900 invalid:bg-opacity-40 invalid:border-red-500 invalid:ring-red-900 focus:ring-2 focus:outline-none text-gray-100 text-base outline-none pl-3 pr-10 ${hasError && (!amountClaimable && claimerAddress) ? 'border-red-700 focus:ring-red-900 focus:border-red-500' : 'border-gray-700 focus:ring-indigo-900 focus:border-indigo-500'}`}
                placeholder="0x..."
                pattern="^0x[a-fA-F0-9]{40}$"
                onChange={(e) => setClaimerAddress(e.target.value)}
                defaultValue={claimerAddress}
              />
            </div>
            {packShares.map((share, i) => {
              const isExtraAddress = i > 0;
              return (
                <div className={`${isExtraAddress ? "flex items-center" : ""}`} key={`share-${i}`}>
                  <div className={`border rounded-md px-2 py-1 border-gray-800 mb-2 ${isExtraAddress && 'w-11/12'}`}>
                    <div className={`flex py-2 items-center justify-between border-b border-gray-800`}>
                      <span className="text-gray-500">Address (ETH)</span>
                      <input
                        type="text"
                        name="address"
                        className={`w-3/5 bg-gray-800 rounded border invalid:bg-red-900 invalid:bg-opacity-40 invalid:border-red-500 invalid:ring-red-900 focus:ring-2 text-base outline-none text-gray-100 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out ${(hasError && !packShares[i].address) ? 'border-red-700 focus:border-red-500 focus:ring-red-900' : 'border-gray-700 focus:border-indigo-500 focus:ring-indigo-900'}`}
                        placeholder="0x..."
                        pattern="^0x[a-fA-F0-9]{40}$"
                        onChange={(e) => handleOnChange(i, 'address', e.target.value)}
                        defaultValue={packShares[i].address}
                      />
                    </div>
                    <div className={`flex py-2 items-center justify-between`}>
                      <span className="text-gray-500">Shares</span>
                      <input
                        type="number"
                        name="quantity"
                        className={`w-3/5 bg-gray-800 rounded invalid:bg-red-900 invalid:bg-opacity-40 invalid:border-red-500 invalid:ring-red-900 border focus:ring-2 text-base outline-none text-gray-100 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out ${(hasError && !packShares[i].quantity) ? 'border-red-700 focus:border-red-500 focus:ring-red-900' : 'border-gray-700 focus:border-indigo-500 focus:ring-indigo-900'}`}
                        placeholder="1"
                        onChange={(e) => handleOnChange(i, 'quantity', e.target.value)}
                        defaultValue={packShares[i].quantity}
                        min="1"
                        step="1"
                      />
                    </div>
                  </div>
                  {isExtraAddress && (
                    <div className='h-full w-1/12 flex justify-center'>
                      <button onClick={() => removeShare(i)} className=" fill-gray-500 hover:fill-white">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" className="w-5 h-5 justify-center">
                          <path d="M310.6 361.4c12.5 12.5 12.5 32.75 0 45.25C304.4 412.9 296.2 416 288 416s-16.38-3.125-22.62-9.375L160 301.3L54.63 406.6C48.38 412.9 40.19 416 32 416S15.63 412.9 9.375 406.6c-12.5-12.5-12.5-32.75 0-45.25l105.4-105.4L9.375 150.6c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0L160 210.8l105.4-105.4c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25l-105.4 105.4L310.6 361.4z"/>
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
            <div className="flex">
              <button
                className="text-white bg-indigo-500 border-0 py-2 px-6 focus:outline-none hover:bg-indigo-600 rounded text-lg mx-auto mt-5 w-full"
                onClick={() => addShares()}
              >
                Add Address/Shares
              </button>
            </div>
            <div className="flex">
              <button
                className="text-white bg-indigo-500 border-0 py-2 px-6 focus:outline-none hover:bg-indigo-600 rounded text-lg mx-auto mt-5 w-full"
                onClick={() => validateStep()}
              >
                Save & Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ConfigEditor;
