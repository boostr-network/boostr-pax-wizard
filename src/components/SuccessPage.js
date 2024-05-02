import React, { useContext, useState, useEffect } from 'react';
import JSConfetti from 'js-confetti';
import { AppContext } from '../state/store';
import { truncateString } from '../utils/formatUtils';

const SuccessPage = () => {
  const {
    collectionName,
    collectionDescription,
    assets,
    activeTab,
    packConfigs,
    packCover,
    deployResult,
    erc20TokenSymbol,
    packShares,
    claimerAddress,
    amountClaimable
  } = useContext(AppContext);

  const {
    creatorAndClaimer,
    maxSupply,
    priceInWei,
    assetsMetadataFolderUri,
    packsMetadataFolderUri,
    sharesAddresses,
    sharesQuantities,
    contract,
    smartPackContractAddress,
    collectibleAddress,
    erc20TokenContractAddress,
    priceInERC20
  } = deployResult;

  const [showAssets, setShowAssets] = useState(false);
  const [active, setActive] = useState(false);
  const [dataCopied, setDataCopied] = useState(false);

  useEffect(() => {
    if (activeTab === 5) {
      setActive(true);
    }
  }, [activeTab]);

  useEffect(() => {
    const jsConfetti = new JSConfetti();
    jsConfetti.addConfetti();
  }, []);

  const toggleShowAssets = () => {
    const prevState = showAssets;
    setShowAssets(!prevState);
  }

  const handleDataCopy = () => {
    const data = {
      smartPackContract: smartPackContractAddress,
      smartCollectibleContract: collectibleAddress,
      network: packConfigs.network.name,
      priceInNativeToken: packConfigs.priceInNative,
      maxSupply,
      smartCollectibleMetadataUri: assetsMetadataFolderUri,
      smartPackMetadataUri: packsMetadataFolderUri,
    }
    try {
      navigator.clipboard.writeText(JSON.stringify(data));
      setDataCopied(true);
    } catch (e) {
      console.log(e);
      setDataCopied(false);
    }
  }

  return (
    <section className={`text-gray-400 body-font bg-gray-900 transition-opacity ease-in duration-900 ${active ? 'opacity-100' : 'opacity-0'}`}>
      {/* Collection Info */}
      <div className="mx-auto flex px-5 py-10 items-center justify-center flex-col">
        {packCover && packCover.type.includes('video') && (
          <video
            src={packCover.preview}
            muted
            autoPlay
            loop
            className="lg:w-2/6 md:w-3/6 w-5/6 mb-10 object-cover object-center rounded"
            type="video/mp4"
          />
        )}
        {packCover && packCover.type.includes('image') && (
          <img alt="Pack Cover" className="lg:w-2/6 md:w-3/6 w-5/6 mb-10 object-cover object-center rounded" src={packCover.preview} />
        )}
        <div className="text-center lg:w-2/3 w-full">
          <h1 className="title-font sm:text-4xl text-3xl mb-4 font-medium text-white">{collectionName || 'No collection name...'}</h1>
          <p className="leading-relaxed mb-8">{collectionDescription || 'No collection description...'}</p>
          {/* Contract Info Start */}
          {deployResult && (
            <div className="flex flex-wrap w-full sm:mx-auto sm:mb-2 -mx-2">
              <div className="p-2 w-full">
                <div className="bg-gray-800 rounded flex p-4 h-full items-center">
                  <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" className="text-indigo-400 w-6 h-6 flex-shrink-0 mr-4" viewBox="0 0 24 24">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path>
                    <path d="M22 4L12 14.01l-3-3"></path>
                  </svg>
                  <span className="title-font font-bold text-white">
                    Packs contract: <span className="font-normal">{smartPackContractAddress}</span>
                  </span>
                </div>
              </div>
              <div className="p-2 w-full">
                <div className="bg-gray-800 rounded flex p-4 h-full items-center">
                  <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" className="text-indigo-400 w-6 h-6 flex-shrink-0 mr-4" viewBox="0 0 24 24">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path>
                    <path d="M22 4L12 14.01l-3-3"></path>
                  </svg>
                  <span className="title-font font-bold text-white">
                    Assets contract: <span className="font-normal">{collectibleAddress}</span>
                  </span>
                </div>
              </div>
              <div className="p-2 w-full">
                <div className="bg-gray-800 rounded flex p-4 h-full items-center">
                  <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" className="text-indigo-400 w-6 h-6 flex-shrink-0 mr-4" viewBox="0 0 24 24">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path>
                    <path d="M22 4L12 14.01l-3-3"></path>
                  </svg>
                  <span className="title-font font-bold text-white">
                    Network: <span className="font-normal">{` ${packConfigs.network.name}`}</span>
                  </span>
                </div>
              </div>
              <div className="p-2 w-full">
                <div className="bg-gray-800 rounded flex p-4 h-full items-center">
                  <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" className="text-indigo-400 w-6 h-6 flex-shrink-0 mr-4" viewBox="0 0 24 24">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path>
                    <path d="M22 4L12 14.01l-3-3"></path>
                  </svg>
                  {erc20TokenContractAddress ? (
                    <span className="title-font font-bold text-white">
                      Price in {erc20TokenSymbol}:<span className="font-normal">{` ${priceInERC20}`}</span>
                    </span>
                  ) : (
                    <span className="title-font font-bold text-white">
                      Price in WEI:<span className="font-normal">{` ${priceInWei}`}</span>
                    </span>
                  )}
                </div>
              </div>
              <div className="p-2 w-full">
                <div className="bg-gray-800 rounded flex p-4 h-full items-center">
                  <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" className="text-indigo-400 w-6 h-6 flex-shrink-0 mr-4" viewBox="0 0 24 24">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path>
                    <path d="M22 4L12 14.01l-3-3"></path>
                  </svg>
                  <span className="title-font font-bold text-white">
                    Maximum Supply:<span className="font-normal">{` ${maxSupply}`}</span>
                  </span>
                </div>
              </div>
              <div className="p-2 w-full">
                <div className="bg-gray-800 rounded flex p-4 h-full items-center">
                  <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" className="text-indigo-400 w-6 h-6 flex-shrink-0 mr-4" viewBox="0 0 24 24">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path>
                    <path d="M22 4L12 14.01l-3-3"></path>
                  </svg>
                  <span className="title-font font-bold text-white">
                    Assets Metadata: <span className="font-normal">{` ${assetsMetadataFolderUri}`}</span>
                  </span>
                </div>
              </div>
              <div className="p-2 w-full">
                <div className="bg-gray-800 rounded flex p-4 h-full items-center">
                  <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" className="text-indigo-400 w-6 h-6 flex-shrink-0 mr-4" viewBox="0 0 24 24">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path>
                    <path d="M22 4L12 14.01l-3-3"></path>
                  </svg>
                  <span className="title-font font-bold text-white">
                    Packs Metadata: <span className="font-normal">{` ${packsMetadataFolderUri}`}</span>
                  </span>
                </div>
              </div>
              {amountClaimable > 0 && claimerAddress && (
                <>
                  <div className="p-2 w-full">
                    <div className="bg-gray-800 rounded flex p-4 h-full items-center">
                      <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" className="text-indigo-400 w-6 h-6 flex-shrink-0 mr-4" viewBox="0 0 24 24">
                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path>
                        <path d="M22 4L12 14.01l-3-3"></path>
                      </svg>
                      <span className="title-font font-bold text-white">
                        Claimable amount: <span className="font-normal">{` ${amountClaimable}`}</span>
                      </span>
                    </div>
                  </div>
                  <div className="p-2 w-full">
                    <div className="bg-gray-800 rounded flex p-4 h-full items-center">
                      <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" className="text-indigo-400 w-6 h-6 flex-shrink-0 mr-4" viewBox="0 0 24 24">
                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path>
                        <path d="M22 4L12 14.01l-3-3"></path>
                      </svg>
                      <span className="title-font font-bold text-white">
                        Claimer Address: <span className="font-normal">{` ${claimerAddress}`}</span>
                      </span>
                    </div>
                  </div>
                </>
              )}
              <div className="p-2 w-full">
                <div className="bg-gray-800 rounded flex p-4 h-full items-center">
                  <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" className="text-indigo-400 w-6 h-6 flex-shrink-0 mr-4" viewBox="0 0 24 24">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path>
                    <path d="M22 4L12 14.01l-3-3"></path>
                  </svg>
                  <span className="title-font font-bold text-white">
                    Shares:
                  </span>
                  <ul className="list-disc ml-8 text-left grow text-white">
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
            </div>
          )}
          {/* Contract Info End */}
          <div className="flex justify-center">
            <button
              className="inline-flex text-white bg-indigo-500 border-2 border-indigo-500 py-2 px-6 focus:outline-none hover:bg-indigo-600 rounded text-lg mr-1"
              onClick={() => toggleShowAssets()}
            >
              {showAssets ? 'Hide Assets' : 'Show Assets'}
            </button>
            <button
              className={`inline-flex text-white  border-2 py-2 px-8 focus:outline-none rounded text-lg ml-1 ${dataCopied ? 'bg-green-500 bg-opacity-50' : 'bg-opacity-0 hover:bg-indigo-600'}`}
              onClick={() => handleDataCopy()}
            >
            {dataCopied ? 'Data copied!' : 'Copy data'}
            </button>
          </div>
        </div>
      </div>

      {/* Assets */}
      <div className={`container px-5 py-5 mx-auto transition-opacity overflow-hidden ease-in duration-900 ${showAssets ? 'opacity-100 h-auto' : 'opacity-0 h-0'}`}>
        <div className="flex flex-wrap -m-4">
          {assets.length > 0 && assets.map((asset, i) => {
            return (
              <React.Fragment key={`${asset.ipfsHash}${i}`}>
                {asset.ipfsHash && (
                  <div className="xl:w-1/5 md:w-1/2 p-4">
                    <div className="bg-gray-800 bg-opacity-40 p-6 rounded-lg text-center h-full">
                      {asset.type.includes('video') && (
                        <video
                          src={asset.preview}
                          muted
                          autoPlay
                          loop
                          className="h-40 rounded w-full object-cover object-center mb-6"
                          type="video/mp4"
                        />
                      )}
                      {asset.type.includes('image') && (
                        <img alt="Pack Cover" className="h-40 rounded w-full object-cover object-center mb-6" src={asset.preview} alt={asset.title} />
                      )}
                      <h3 className="tracking-widest text-indigo-400 text-xs font-light title-font">{asset.rarity}</h3>
                      <h2 className="text-lg text-white font-light title-font mb-4">{asset.title}</h2>
                      <p className="leading-relaxed text-base">{truncateString(asset.description, 100)}</p>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default SuccessPage;
