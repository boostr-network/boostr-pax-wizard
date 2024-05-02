import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../state/store';
import { truncateString } from '../utils/formatUtils';
import { convertToWei } from '../utils/currencyUtils';
import { uploadAsset, uploadAssets, uploadMetadataFolder, uploadMetadataFile } from '../services/PinataService';
import { deployBoosterPack } from '../services/DeployService';
import { convertCurrency } from '../services/MarketService';

const DeployStep = (props) => {
  // State
  const {
    collectionName,
    collectionDescription,
    packConfigs,
    packCover,
    packShares,
    assets,
    setAssets,
    validatedSteps,
    activeTab,
    setActiveTab,
    setDeployResult,
    amountClaimable,
    claimerAddress,
    erc20TokenContractAddress,
    erc20TokenSymbol
  } = useContext(AppContext);

  const [deploying, setDeploying] = useState(false);
  const [completedDeploySteps, setCompletedDeploySteps] = useState([false, false, false, false]);
  // Deploy step 0
  const [uploadingAssets, setUploadingAssets] = useState(false);
  const [assetsUploadError, setAssetsUploadError] = useState(false);
  // Deploy step 1
  const [uploadingAssetsMetadata, setUploadingAssetsMetadata] = useState(false);
  const [assetsMetadataUploadError, setAssetsMetadataUploadError] = useState(false);
  // Deploy step 2
  const [uploadingPacks, setUploadingPacks] = useState(false);
  const [packsUploadError, setPacksUploadError] = useState(false);
  // Deploy step 3
  const [deployingPackContract, setDeployingPackContract] = useState(false);
  const [packContractDeployError, setPackContractDeployError] = useState(false);
  // Others
  const [active, setActive] = useState(false);
  const [ipfsFolders, setIpfsFolders] = useState({
    assetsMetadataFolderHash: null,
    packsMetadataFolderHash: null,
  });


  // Hooks
  useEffect(() => {
    if (activeTab === 4) { setActive(true) }
  }, [activeTab]);

  // Helper functions
  const handleSetError = (type, resultPayload) => {
    switch (type) {
      case 'assetsUpload':
        setDeploying(false);
        setUploadingAssets(false);
        setAssetsUploadError(true);
        console.log('Error uploading some assets to IPFS', resultPayload);
        break;

      case 'assetsMetadataBlobsGeneration' || 'assetsMetadataBlobsUpload':
        setDeploying(false);
        setUploadingAssetsMetadata(false);
        setAssetsMetadataUploadError(true);
        if (type === 'assetsMetadataBlobsGeneration') { console.log('Error generating some assets metadata files', resultPayload); }
        if (type === 'assetsMetadataBlobsUpload') { console.log('Error uploading some assets metadata files to IPFS', resultPayload); }
        break;

      case 'packCoverUpload':
        setDeploying(false);
        setUploadingPacks(false);
        setPacksUploadError(true);
        console.log('Error uploading pack cover to IPFS', resultPayload);
        return;

      case 'packsMetadataBlobsGeneration' || 'packsMetadataBlobsUpload':
        setDeploying(false);
        setUploadingPacks(false);
        setPacksUploadError(true);
        if (type === 'packsMetadataBlobsGeneration') { console.log('Error generating some assets metadata files', resultPayload); }
        if (type === 'packsMetadataBlobsUpload') { console.log('Error uploading packs metadata files to IPFS', resultPayload); }
        return;

      case 'priceConversion':
        setDeploying(false);
        setPackContractDeployError(true);
        setDeployingPackContract(false);
        console.log('Error converting priceInUsd to WEI', resultPayload);
        return;

      case 'packContractDeploy':
        setDeploying(false);
        setPackContractDeployError(true);
        setDeployingPackContract(false);
        console.log('Error deploying pack smart contract', resultPayload);
        return;

      default:
        break;
    }
  }

  const uploadPackContentsAssets = async () => {
    // State
    setUploadingAssets(true);
    return uploadAssets(assets);
  }

  const generateAndUploadAssetsMetadata = async (updatedAssets) => {
    // State
    setUploadingAssetsMetadata(true);
    return uploadMetadataFolder(updatedAssets, collectionDescription);
  }

  const generateAndUploadPacksMetadata = async (packCoverAsset) => {
    // Generate assets
    const packsMetadataAsset = {
      title: collectionName,
      collection: collectionName,
      description: collectionDescription,
      ipfsHash: packCoverAsset.ipfsHash,
      type: packCoverAsset.type,
    };
    return uploadMetadataFile(packsMetadataAsset, collectionDescription, true);
  }

  const getPriceInWei = async () => {
    if (packConfigs.priceInUsd) {
      const convertCurrencyResult = await convertCurrency('USD', packConfigs.network.token, packConfigs.priceInUsd);
      if(convertCurrencyResult) {
        return convertToWei(convertCurrencyResult.quote[packConfigs.network.token].price);
      }
    } else {
      return convertToWei(packConfigs.priceInNative);
    }
    return null;
  }

  const deployPackContract = async (updatedAssets, priceInWei, assetsMetadataFolderHash, packsMetadataFolderHash) => {
    // State
    setDeployingPackContract(true);
    return deployBoosterPack(collectionName, updatedAssets, packConfigs.maxSupply, priceInWei, assetsMetadataFolderHash, packsMetadataFolderHash, packShares, packConfigs.network, amountClaimable, claimerAddress, erc20TokenContractAddress, packConfigs.priceInERC20);
  }

  const handleDeploy = async () => {
    // State
    setDeploying(true);
    let updatedCompletedDeploySteps = completedDeploySteps;

    // 0. Upload Assets to IPFS and update objects adding ipfsHash
    const assetsUploadResult = await uploadPackContentsAssets();
    if (!assetsUploadResult.allAssetsUploaded) {
      handleSetError('assetsUpload', assetsUploadResult);
      // Stop deploy process
      return;
    }
    // UI State
    setAssetsUploadError(false);
    setUploadingAssets(false);
    updatedCompletedDeploySteps[0] = true;
    setCompletedDeploySteps([...updatedCompletedDeploySteps]);
    // Store updated Assets in app global state
    setAssets([...assetsUploadResult.updatedAssets]);


    // 1. Generate and upload metadata files to same directory in IPFS
    const assetsMetadataUploadResult = await generateAndUploadAssetsMetadata(assetsUploadResult.updatedAssets);
    if (!assetsMetadataUploadResult.folderHash) {
      handleSetError(assetsMetadataUploadResult.errorType, assetsMetadataUploadResult);
      // Stop deploy process
      return;
    }
    // UI State
    setAssetsMetadataUploadError(false);
    setUploadingAssetsMetadata(false);
    updatedCompletedDeploySteps[1] = true;
    setCompletedDeploySteps([...updatedCompletedDeploySteps]);
    // Store folder hash
    let updatedFoldersObject = ipfsFolders;
    updatedFoldersObject.assetsMetadataFolderHash = assetsMetadataUploadResult.folderHash;
    setIpfsFolders({...updatedFoldersObject});


    // 2. Upload PackCoverAsset
    setUploadingPacks(true);
    const packCoverUploadResult = await uploadAsset(packCover, 0, true);
    if (!packCoverUploadResult.updatedAsset.ipfsHash) {
      handleSetError('packCoverUpload', packCoverUploadResult);
      // Stop deploy process
      return;
    }

    // 2.1 Generate JSONs for each pack and upload to a IPFS folder
    const packsMetadataUploadResult = await generateAndUploadPacksMetadata(packCoverUploadResult.updatedAsset);
    if (packsMetadataUploadResult.errorType) {
      handleSetError(packsMetadataUploadResult.errorType, packsMetadataUploadResult);
      // Stop deploy process
      return;
    }
    // UI State
    setPacksUploadError(false);
    setUploadingPacks(false);
    updatedCompletedDeploySteps[2] = true;
    setCompletedDeploySteps([...updatedCompletedDeploySteps]);
    // Store folder hash
    updatedFoldersObject.packsMetadataFolderHash = packsMetadataUploadResult.folderHash;
    setIpfsFolders({...updatedFoldersObject});

    // 3 Calculate price in WEI
    let usdToWeiConversionResult = null;

    if (!erc20TokenContractAddress) {
      usdToWeiConversionResult = await getPriceInWei();

      if (!usdToWeiConversionResult) {
        handleSetError('priceConversion', usdToWeiConversionResult);
        // Stop deploy process
        return;
      }
    }

    // 3.1 Deploy pack smart contract
    const packContractDeployResult = await deployPackContract(assetsUploadResult.updatedAssets, usdToWeiConversionResult, assetsMetadataUploadResult.folderHash, packsMetadataUploadResult);

    if(!packContractDeployResult.success) {
      handleSetError('packContractDeploy', null);
    }
    // UI State
    setDeploying(false);
    setPackContractDeployError(false);
    setDeployingPackContract(false);
    updatedCompletedDeploySteps[3] = true;
    setCompletedDeploySteps([...updatedCompletedDeploySteps]);
    setDeployResult(packContractDeployResult);
    setActiveTab(5);
  }

  // Render
  return (
    <section className={`text-gray-400 bg-gray-900 body-font transition-opacity ease-in duration-900 ${active ? 'opacity-100' : 'opacity-0'}`}>
      <div className="container px-5 py-5 mx-auto flex flex-wrap">
        <div className="flex flex-wrap w-full items-center">
          {packCover && packCover.type.includes('video') && (
            <video
              src={packCover.preview}
              muted
              autoPlay
              loop
              className="lg:w-2/5 md:w-1/2 object-cover object-center rounded-lg md:mt-0 mt-12"
              type="video/mp4"
            />
          )}
          {packCover && packCover.type.includes('image') && (
            <img alt="Pack Cover" className="lg:w-2/5 md:w-1/2 object-cover object-center rounded-lg md:mt-0 mt-12" src={packCover.preview} />
          )}
          <div className="lg:w-3/5 md:w-1/2 md:pl-10 md:py-5">
            {/* Deploy steps start */}
            <div className="flex relative pb-12">
              <div className="h-full w-10 absolute inset-0 flex items-center justify-center">
                <div className={`h-full w-1 transition-colors ${validatedSteps[0].isValidated ? 'bg-green-500 bg-opacity-40' : 'bg-red-600 bg-opacity-30'}`}></div>
              </div>
              <div className={`flex-shrink-0 w-10 h-10 rounded-full inline-flex items-center justify-center text-white relative z-10 ${validatedSteps[0].isValidated ? 'bg-green-500' : 'bg-red-600 animate-pulse'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-5 h-5" fill="currentColor">
                  <path d="M256 0C114.6 0 0 114.6 0 256s114.6 256 256 256s256-114.6 256-256S397.4 0 256 0zM256 128c17.67 0 32 14.33 32 32c0 17.67-14.33 32-32 32S224 177.7 224 160C224 142.3 238.3 128 256 128zM296 384h-80C202.8 384 192 373.3 192 360s10.75-24 24-24h16v-64H224c-13.25 0-24-10.75-24-24S210.8 224 224 224h32c13.25 0 24 10.75 24 24v88h16c13.25 0 24 10.75 24 24S309.3 384 296 384z"/>
                </svg>
              </div>
              <div className="flex-grow pl-4">
                <h2 className="font-medium title-font text-sm text-white mb-1 tracking-wider font-extrabold">1: COLLECTION INFO</h2>
                <p className="leading-relaxed"><span className="font-semibold">Name:</span> {collectionName}</p>
                <p className="leading-relaxed"><span className="font-semibold">Description:</span> {collectionDescription}</p>
              </div>
            </div>

            <div className="flex relative pb-12">
              <div className="h-full w-10 absolute inset-0 flex items-center justify-center">
                <div className={`h-full w-1 transition-colors ${assetsUploadError ? 'animate-pulse bg-red-600 bg-opacity-50' : ''} ${completedDeploySteps[0] ? 'bg-green-500 bg-opacity-40' : 'bg-gray-800'}`}></div>
              </div>
              <div className={`flex-shrink-0 w-10 h-10 rounded-full inline-flex items-center justify-center text-white relative z-10 bg-indigo-500 ${assetsUploadError ? 'animate-pulse bg-red-600' : ''} ${uploadingAssets ? 'bg-indigo-500 animate-bounce' : 'bg-indigo-500'} ${completedDeploySteps[0] ? 'bg-green-500' : 'bg-indigo-500'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" className="w-5 h-5" fill="currentColor">
                  <path d="M256 0v128h128L256 0zM224 128L224 0H48C21.49 0 0 21.49 0 48v416C0 490.5 21.49 512 48 512h288c26.51 0 48-21.49 48-48V160h-127.1C238.3 160 224 145.7 224 128zM288.1 344.1C284.3 349.7 278.2 352 272 352s-12.28-2.344-16.97-7.031L216 305.9V408c0 13.25-10.75 24-24 24s-24-10.75-24-24V305.9l-39.03 39.03c-9.375 9.375-24.56 9.375-33.94 0s-9.375-24.56 0-33.94l80-80c9.375-9.375 24.56-9.375 33.94 0l80 80C298.3 320.4 298.3 335.6 288.1 344.1z"/>
                </svg>
              </div>
              <div className="flex-grow pl-4">
                <h2 className="font-medium title-font text-sm text-white mb-1 tracking-wider font-extrabold"><strong>2: ASSETS</strong></h2>
                {(!completedDeploySteps[0] && !uploadingAssets) && <p className="leading-relaxed">All assets are ready to upload to IPFS.</p>}
                {(!completedDeploySteps[0] && uploadingAssets) && <p className="leading-relaxed animate-pulse">Uploading assets to IPFS...</p>}
                {completedDeploySteps[0] && <p className="leading-relaxed">All assets were successfully uploaded to IPFS.</p>}
              </div>
            </div>

            <div className="flex relative pb-12">
              <div className="h-full w-10 absolute inset-0 flex items-center justify-center">
                <div className={`h-full w-1 transition-colors ${assetsMetadataUploadError ? 'animate-pulse bg-red-600 bg-opacity-50' : ''} ${completedDeploySteps[1] ? 'bg-green-500 bg-opacity-40' : 'bg-gray-800'}`}></div>
              </div>
              <div className={`flex-shrink-0 w-10 h-10 rounded-full inline-flex items-center justify-center text-white relative z-10 ${assetsMetadataUploadError ? 'animate-pulse bg-red-600' : ''} ${uploadingAssetsMetadata ? 'bg-indigo-500 animate-bounce' : 'bg-indigo-500'} ${completedDeploySteps[1] ? 'bg-green-500' : 'bg-indigo-500'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" className="w-5 h-5" fill="currentColor">
                  <path d="M336 64h-53.88C268.9 26.8 233.7 0 192 0S115.1 26.8 101.9 64H48C21.5 64 0 85.48 0 112v352C0 490.5 21.5 512 48 512h288c26.5 0 48-21.48 48-48v-352C384 85.48 362.5 64 336 64zM192 64c17.67 0 32 14.33 32 32s-14.33 32-32 32S160 113.7 160 96S174.3 64 192 64zM282.9 262.8l-88 112c-4.047 5.156-10.02 8.438-16.53 9.062C177.6 383.1 176.8 384 176 384c-5.703 0-11.25-2.031-15.62-5.781l-56-48c-10.06-8.625-11.22-23.78-2.594-33.84c8.609-10.06 23.77-11.22 33.84-2.594l36.98 31.69l72.52-92.28c8.188-10.44 23.3-12.22 33.7-4.062C289.3 237.3 291.1 252.4 282.9 262.8z"/>
                </svg>
              </div>
              <div className="flex-grow pl-4">
                <h2 className="font-medium title-font text-sm text-white mb-1 tracking-wider font-extrabold"><strong>3: NFTs METADATA</strong></h2>
                {(!completedDeploySteps[1] && !uploadingAssetsMetadata) && <p className="leading-relaxed">All assets metadata files are ready to upload to IPFS.</p> }
                {(!completedDeploySteps[1] && uploadingAssetsMetadata) && <p className="leading-relaxed animate-pulse">Uploading assets metadata files to IPFS...</p>}
                {completedDeploySteps[1] && <p className="leading-relaxed">All metadata assets metadata files were successfully uploaded to IPFS.</p>}
              </div>
            </div>

            <div className="flex relative pb-12">
              <div className="h-full w-10 absolute inset-0 flex items-center justify-center">
                <div className={`h-full w-1 transition-colors ${packsUploadError ? 'animate-pulse bg-red-600 bg-opacity-50' : ''} ${completedDeploySteps[2] ? 'bg-green-500 bg-opacity-40' : 'bg-gray-800'}`}></div>
              </div>
              <div className={`flex-shrink-0 w-10 h-10 rounded-full inline-flex items-center justify-center text-white relative z-10 ${packsUploadError ? 'animate-pulse bg-red-600' : ''} ${uploadingPacks ? 'bg-indigo-500 animate-bounce' : 'bg-indigo-500'} ${completedDeploySteps[2] ? 'bg-green-500' : 'bg-indigo-500'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-5 h-5" fill="currentColor">
                  <path d="M495.9 166.6C499.2 175.2 496.4 184.9 489.6 191.2L446.3 230.6C447.4 238.9 448 247.4 448 256C448 264.6 447.4 273.1 446.3 281.4L489.6 320.8C496.4 327.1 499.2 336.8 495.9 345.4C491.5 357.3 486.2 368.8 480.2 379.7L475.5 387.8C468.9 398.8 461.5 409.2 453.4 419.1C447.4 426.2 437.7 428.7 428.9 425.9L373.2 408.1C359.8 418.4 344.1 427 329.2 433.6L316.7 490.7C314.7 499.7 307.7 506.1 298.5 508.5C284.7 510.8 270.5 512 255.1 512C241.5 512 227.3 510.8 213.5 508.5C204.3 506.1 197.3 499.7 195.3 490.7L182.8 433.6C167 427 152.2 418.4 138.8 408.1L83.14 425.9C74.3 428.7 64.55 426.2 58.63 419.1C50.52 409.2 43.12 398.8 36.52 387.8L31.84 379.7C25.77 368.8 20.49 357.3 16.06 345.4C12.82 336.8 15.55 327.1 22.41 320.8L65.67 281.4C64.57 273.1 64 264.6 64 256C64 247.4 64.57 238.9 65.67 230.6L22.41 191.2C15.55 184.9 12.82 175.3 16.06 166.6C20.49 154.7 25.78 143.2 31.84 132.3L36.51 124.2C43.12 113.2 50.52 102.8 58.63 92.95C64.55 85.8 74.3 83.32 83.14 86.14L138.8 103.9C152.2 93.56 167 84.96 182.8 78.43L195.3 21.33C197.3 12.25 204.3 5.04 213.5 3.51C227.3 1.201 241.5 0 256 0C270.5 0 284.7 1.201 298.5 3.51C307.7 5.04 314.7 12.25 316.7 21.33L329.2 78.43C344.1 84.96 359.8 93.56 373.2 103.9L428.9 86.14C437.7 83.32 447.4 85.8 453.4 92.95C461.5 102.8 468.9 113.2 475.5 124.2L480.2 132.3C486.2 143.2 491.5 154.7 495.9 166.6V166.6zM256 336C300.2 336 336 300.2 336 255.1C336 211.8 300.2 175.1 256 175.1C211.8 175.1 176 211.8 176 255.1C176 300.2 211.8 336 256 336z"/>
                </svg>
              </div>
              <div className="flex-grow pl-4">
                <h2 className="font-medium title-font text-sm text-white mb-1 tracking-wider font-extrabold"><strong>4: BOOSTER PACK CONFIG</strong></h2>
                {uploadingPacks && <p className="leading-relaxed animate-pulse">Uploading pack cover and metadata...</p>}
                {erc20TokenContractAddress && <p className="leading-relaxed"><span className="font-semibold">Price:</span>{` ${packConfigs.priceInERC20} (${erc20TokenSymbol})`}</p>}
                {! erc20TokenContractAddress && <p className="leading-relaxed"><span className="font-semibold">Price:</span> {packConfigs.priceInNative ? `${packConfigs.priceInNative} (${packConfigs.network.token})` : `${packConfigs.priceInUsd} (USD)`}</p>}
                {erc20TokenContractAddress && <p className="leading-relaxed"><span className="font-semibold">ERC20 Address:</span> {erc20TokenContractAddress}</p>}
                <p className="leading-relaxed"><span className="font-semibold">Maximum Supply:</span> {packConfigs.maxSupply}</p>
                <p className="leading-relaxed"><span className="font-semibold">Network:</span> {packConfigs.network.name}</p>
                {amountClaimable > 0 && claimerAddress && (
                  <>
                    <p className="leading-relaxed"><span className="font-semibold">Claimable amount:</span> {amountClaimable}</p>
                    <p className="leading-relaxed"><span className="font-semibold">Claimer Address:</span> {claimerAddress}</p>
                  </>
                )}
                <p className="leading-relaxed mb-2"><span className="font-semibold">Shares:</span></p>
                <ul className="list-disc ml-5">
                {packShares.map((share, i) => {
                  return (
                    <React.Fragment key={`${share.address}-${i}`}>
                      <li className={`${i === 0 ? 'border-t border-gray-500' : ''}`}>
                        <p className="leading-relaxed">
                          <span className="font-semibold">Address:</span> {` ${share.address}`}
                        </p>
                      </li>
                      <li className="mb-1 border-b border-gray-500">
                        <p className="leading-relaxed">
                          <span className="font-semibold">Shares:</span> {share.quantity}
                        </p>
                      </li>
                    </React.Fragment>
                  )
                })}
                </ul>
              </div>
            </div>

            <div className="flex relative">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-indigo-500 inline-flex items-center justify-center text-white relative z-10 ${packContractDeployError ? 'animate-pulse bg-red-600' : ''} ${deployingPackContract ? 'bg-indigo-500 animate-bounce' : 'bg-indigo-500'} ${completedDeploySteps[3] ? 'bg-green-500' : 'bg-indigo-500'}`}>
                <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path>
                  <path d="M22 4L12 14.01l-3-3"></path>
                </svg>
              </div>
              <div className="flex-grow pl-4">
                <h2 className="font-medium title-font text-sm text-white mb-1 tracking-wider font-extrabold">5: DEPLOY</h2>
                {(!completedDeploySteps[3] && !deployingPackContract) && <p className="leading-relaxed">Booster pack ready to deploy, please check all the information before deploying the Booster Pack.</p> }
                {(!completedDeploySteps[3] && deployingPackContract) && <p className="leading-relaxed animate-pulse">Deploying Booster Pack...</p>}
                {completedDeploySteps[3] && <p className="leading-relaxed">Successfully deployed booster pack.</p>}
              </div>
            </div>
            {/* Deploy steps end */}
          </div>
        </div>
        <div className="lg:w-1/3 md:w-1/2 rounded-lg p-8 flex flex-col mx-auto w-full mt-10 md:mt-0 relative z-10">
          <button
            className={`text-white flex items-center justify-center border-0 py-2 px-6 focus:outline-none rounded text-lg mx-auto mt-5 w-full ${packContractDeployError ? 'bg-red-600' : 'bg-indigo-500'} ${deployingPackContract ? 'bg-indigo-500 animate-pulse' : 'bg-indigo-500'} ${completedDeploySteps[3] ? 'bg-green-500' : 'bg-indigo-500'}`}
            onClick={() => handleDeploy()}
            disabled={deploying || completedDeploySteps[3] || packContractDeployError}
          >
            {deploying ? (
              <>
                <svg role="status" className="inline w-4 h-4 mr-2 text-gray-200 animate-spin dark:text-indigo-600 fill-indigo-600 dark:fill-gray-100" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                </svg>
              <span>Deploying booster pack!</span>
              </>
            ) : (
              <>
                {packContractDeployError && <span>Error deploying Booster Pack</span>}
                {completedDeploySteps[3] && <span>Pack deployed, loading info...</span>}

                {!completedDeploySteps[3] && !packContractDeployError && <span>Deploy Booster Pack</span>}
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}

export default DeployStep;
