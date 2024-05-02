import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../state/store';
import {
  GridContextProvider,
  GridDropZone,
  GridItem,
  swap
} from "react-grid-dnd";

const MetadataEditor = (props) => {
  const {
    assets,
    setAssets,
    setActiveTab,
    validatedSteps,
    setValidatedSteps,
    activeTab,
    collectionName,
    collectionDescription
  } = useContext(AppContext);

  const [hasError, setHasError] = useState(false);
  const [allClasses, setAllClasses] = useState(false);
  const [active, setActive] = useState(false);
  
  function initializeAssetsWithRarity(assets) {
    const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
    const totalAssets = assets.length;
  
    // Calculate distribution ensuring each rarity has at least one asset more than the next rarer category
    const distribution = calculateDistribution(totalAssets, rarities.length);
  
    // Assign rarities based on the calculated distribution
    let currentIndex = 0;
    for (let i = 0; i < rarities.length; i++) {
      for (let j = 0; j < distribution[i]; j++) {
        if (assets[currentIndex]) {
          assets[currentIndex].rarity = rarities[i];
          currentIndex++;
        }
      }
    }
  
    return assets;
  }
  
  function calculateDistribution(totalAssets, rarityLevels) {
    let distribution = new Array(rarityLevels).fill(1); // Ensure at least one of each rarity
    let remainingAssets = totalAssets - rarityLevels; // Assets left to distribute
  
    // Distribute remaining assets, starting with the most common
    let i = 0;
    while (remainingAssets > 0) {
      distribution[i % rarityLevels]++;
      i++;
      remainingAssets--;
    }
  
    // Specific adjustment: If 3 'epic' and 1 'legendary', adjust to 2 and 2
    const epicIndex = rarityLevels - 2; // 'epic' index
    const legendaryIndex = rarityLevels - 1; // 'legendary' index
    if (distribution[epicIndex] === 3 && distribution[legendaryIndex] === 1) {
      distribution[epicIndex]--;
      distribution[legendaryIndex]++;
    }
  
    return distribution;
  }

  useEffect(() => {
    setAssets(initializeAssetsWithRarity(assets));
  }, []);

  useEffect(() => {
    if (activeTab === 2) { setActive(true) }
  }, [activeTab])

  const handleOnChange = (index, key, value) => {
    const updatedArray = assets;
    updatedArray[index][key] = value;
    setAssets([...updatedArray]);
  }

  const validateStep = () => {
    let stepsArray = validatedSteps;
    const missingMetadata = assets.some((asset) => asset.title === '' || !asset.rarity || asset.description === '');
    let missingClasses = true;
    if (!missingMetadata) {
      let atLeastOneCommon = false, atLeastOneUncommon = false, atLeastOneRare = false, atLeastOneEpic = false, atLeastOneLegendary = false, atLeastOneExclusive = false;

      for (let i = 0; i < assets.length; i++) {
        if (!missingClasses) { break; }

        switch (assets[i].rarity) {
          case 'common':
            atLeastOneCommon = true;
            if (atLeastOneCommon && atLeastOneUncommon && atLeastOneRare && atLeastOneEpic && atLeastOneLegendary) {
              missingClasses = false;
            }
            break;
          case 'uncommon':
            atLeastOneUncommon = true;
            if(atLeastOneCommon && atLeastOneUncommon && atLeastOneRare && atLeastOneEpic && atLeastOneLegendary) {
              missingClasses = false;
            }
            break;
          case 'rare':
            atLeastOneRare = true;
            if(atLeastOneCommon && atLeastOneUncommon && atLeastOneRare && atLeastOneEpic && atLeastOneLegendary) {
              missingClasses = false;
            }
            break;
          case 'epic':
            atLeastOneEpic = true;
            if(atLeastOneCommon && atLeastOneUncommon && atLeastOneRare && atLeastOneEpic && atLeastOneLegendary) {
              missingClasses = false;
            }
            break;
          case 'legendary':
            atLeastOneLegendary = true;
            if (atLeastOneCommon && atLeastOneUncommon && atLeastOneRare && atLeastOneEpic && atLeastOneLegendary) {
              missingClasses = false;
            }
            break;
        }
      }

      if (!missingClasses) {
        setHasError(false);
        setAllClasses(true);
        stepsArray[2].isValidated = true;
        setValidatedSteps([...stepsArray]);
        setActiveTab(3);
      } else {
        setAllClasses(false);
        setHasError(true);
        stepsArray[2].isValidated = false;
        setValidatedSteps([...stepsArray]);
      }

    } else {
      setHasError(true);
      stepsArray[2].isValidated = false;
      setValidatedSteps([...stepsArray]);
    }
  }

  const handleRemove = (index) => {
    const updatedAssets = assets;
    updatedAssets.splice(index, 1);
    setAssets([...updatedAssets]);
    if (updatedAssets.length === 0) {
      let stepsArray = validatedSteps;
      stepsArray[1].isValidated = false;
      stepsArray[1].hasError = false;
      stepsArray[2].isValidated = false;
      stepsArray[2].hasError = false;
      setValidatedSteps([...stepsArray]);
      setActiveTab(1);
    }
  }

  const onDragSort = (sourceId, sourceIndex, targetIndex, targetId) => {
    const nextState = swap(assets, sourceIndex, targetIndex);
    nextState.forEach((asset, index) => {
      asset.title = `${collectionName} Collectible #${index}`;
    });
    setAssets(nextState);
  }

  return (
    <section className={`text-gray-400 bg-gray-900 body-font transition-opacity ease-in duration-900 ${active ? 'opacity-100' : 'opacity-0'}`}>
      <div className="container px-5 py-5 mx-auto h-full">
        <GridContextProvider onChange={onDragSort}>
          <GridDropZone
            id="assets"
            boxesPerRow={2}
            rowHeight={400}
            style={{ width: '100%', height: Math.ceil(assets.length / 2) * 400 }}
          >
            {assets.map((asset, i) => (
              <GridItem key={`md-${asset.name}`} className="h-full w-full m-4 border border-slate-500/20">
                <div className="p-12 h-full w-full">
                  <div
                    className="absolute right-4 top-4 transition-opacity opacity-40 hover:opacity-100 cursor-pointer"
                    onClick={() => handleRemove(i)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" className="h-4 w-4" fill="currentColor">
                      <path d="M376.6 427.5c11.31 13.58 9.484 33.75-4.094 45.06c-5.984 4.984-13.25 7.422-20.47 7.422c-9.172 0-18.27-3.922-24.59-11.52L192 305.1l-135.4 162.5c-6.328 7.594-15.42 11.52-24.59 11.52c-7.219 0-14.48-2.438-20.47-7.422c-13.58-11.31-15.41-31.48-4.094-45.06l142.9-171.5L7.422 84.5C-3.891 70.92-2.063 50.75 11.52 39.44c13.56-11.34 33.73-9.516 45.06 4.094L192 206l135.4-162.5c11.3-13.58 31.48-15.42 45.06-4.094c13.58 11.31 15.41 31.48 4.094 45.06l-142.9 171.5L376.6 427.5z"/>
                    </svg>
                  </div>
                  <div className="h-full flex sm:flex-row flex-col items-center sm:justify-start justify-center text-center sm:text-left">
                    <div style={{ width: 198, height: 247 }} className="h-full relative">
                      <div className="bg-black h-full w-full opacity-0 hover:opacity-30 transition-opacity z-10 absolute top-0 left-0 cursor-pointer flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="fill-white w-8 h-8 mx-auto">
                          <path d="M512 256c0 6.797-2.891 13.28-7.938 17.84l-80 72C419.6 349.9 413.8 352 408 352c-3.312 0-6.625-.6875-9.766-2.078C389.6 346.1 384 337.5 384 328V288h-96v96l40-.0013c9.484 0 18.06 5.578 21.92 14.23s2.25 18.78-4.078 25.83l-72 80C269.3 509.1 262.8 512 255.1 512s-13.28-2.89-17.84-7.937l-71.1-80c-6.328-7.047-7.938-17.17-4.078-25.83s12.44-14.23 21.92-14.23l39.1 .0013V288H128v40c0 9.484-5.578 18.06-14.23 21.92C110.6 351.3 107.3 352 104 352c-5.812 0-11.56-2.109-16.06-6.156l-80-72C2.891 269.3 0 262.8 0 256s2.891-13.28 7.938-17.84l80-72C95 159.8 105.1 158.3 113.8 162.1C122.4 165.9 128 174.5 128 184V224h95.1V128l-39.1-.0013c-9.484 0-18.06-5.578-21.92-14.23S159.8 94.99 166.2 87.94l71.1-80c9.125-10.09 26.56-10.09 35.69 0l72 80c6.328 7.047 7.938 17.17 4.078 25.83s-12.44 14.23-21.92 14.23l-40 .0013V224H384V184c0-9.484 5.578-18.06 14.23-21.92c8.656-3.812 18.77-2.266 25.83 4.078l80 72C509.1 242.7 512 249.2 512 256z"/></svg>
                      </div>
                      {asset.type.includes('video') && (
                        <video
                          src={asset.preview}
                          muted
                          autoPlay
                          loop
                          style={{ width: 198 }}
                          className="flex-shrink-0 h-full object-cover object-center sm:mb-0 mb-4 z-0 absolute top-0 left-0"
                          type="video/mp4"
                        />
                      )}
                      {asset.type.includes('image') && (
                        <img alt="NFT" style={{ width: 198 }} className="flex-shrink-0 h-full object-cover object-center sm:mb-0 mb-4 z-0 absolute top-0 left-0" src={asset.preview} />
                      )}
                    </div>
                    <div className="flex-grow sm:pl-8">
                      <div className="relative mb-2">
                        <label htmlFor="nft-token-id" className="leading-7 text-sm text-white">Token ID</label>
                        <input
                          type="text"
                          value={i}
                          name="nft-token-id"
                          disabled
                          className={`w-full bg-gray-800 rounded border text-base outline-none text-gray-100 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out border-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-900'}`}
                        />
                      </div>
                      <div className="relative mb-2">
                        <label htmlFor="nft-title" className="leading-7 text-sm text-white">Title</label>
                        <input
                          type="text"
                          key={i}
                          defaultValue={asset.title}
                          onChange={(e) => handleOnChange(i, 'title', e.target.value)}
                          name="nft-title"
                          className={`w-full bg-gray-800 rounded border text-base outline-none text-gray-100 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out ${(hasError && !asset.title) ? 'border-red-700 focus:border-red-500 focus:ring-2 focus:ring-red-900' : 'border-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-900'}`}
                          placeholder="Enter sticker title"
                        />
                      </div>
                      <div className="relative mb-2">
                        <label htmlFor="nft-description" className="leading-7 text-sm text-white">Description</label>
                        <input
                          type="text"
                          defaultValue={asset.description ? asset.description : collectionDescription}
                          onChange={(e) => handleOnChange(i, 'description', e.target.value)}
                          name="nft-description"
                          className={`w-full bg-gray-800 rounded border text-base outline-none text-gray-100 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out ${(hasError && !asset.description) ? 'border-red-700 focus:border-red-500 focus:ring-2 focus:ring-red-900' : 'border-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-900'}`}
                          placeholder="Enter sticker description"
                        />
                      </div>
                      {asset.type.includes('video') && (
                        <div className="relative mb-2" style={{ maxWidth: 275 }}>
                          <label htmlFor="nft-description" className="leading-7 text-sm text-white">Placeholder Image</label>
                          <input type="file" name="file" accept="image/png, image/jpeg"  size="275" onChange={e => handleOnChange(i, 'placeholderImage', e.target.files[0])} />
                        </div>
                      )}
                      <label htmlFor="nft-class" className="leading-7 text-sm text-white">Rarity</label>
                      <div className="relative mb-2">
                        <select name="nft-class" onChange={(e) => handleOnChange(i, 'rarity', e.target.value)} defaultValue={asset.rarity || "0"} className={`rounded border appearance-none bg-gray-800 py-2 focus:ring-2 focus:outline-none text-gray-100 text-base outline-none pl-3 pr-10 w-full ${(hasError && !asset.rarity) ? 'border-red-700 focus:ring-red-900 focus:border-red-500' : 'border-gray-700 focus:ring-indigo-900 focus:border-indigo-500'}`}>
                          <option disabled value="0">Select sticker rarity</option>
                          <>
                            <option value="common">Common</option>
                            <option value="uncommon">Uncommon</option>
                            <option value="rare">Rare</option>
                            <option value="epic">Epic</option>
                            <option value="legendary">Legendary</option>
                          </>
                        </select>
                        <span className="absolute right-0 top-0 h-full w-10 text-center text-gray-600 pointer-events-none flex items-center justify-center">
                          <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="w-4 h-4" viewBox="0 0 24 24">
                            <path d="M6 9l6 6 6-6"></path>
                          </svg>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </GridItem>
            ))}
          </GridDropZone>
        </GridContextProvider>
        <div className="lg:w-1/3 md:w-1/2 rounded-lg p-8 flex flex-col mx-auto w-full mt-10 md:mt-0 relative z-10">
          {hasError && !allClasses && <p className="leading-relaxed font-semibold text-red-500 text-center">There should be at least one asset for each rarity...</p>}
          <button
            className="text-white bg-indigo-500 border-0 py-2 px-6 focus:outline-none hover:bg-indigo-600 rounded text-lg"
            onClick={() => validateStep()}
          >
            Save & Continue
          </button>
        </div>
      </div>
    </section>
  );
}

export default MetadataEditor;
