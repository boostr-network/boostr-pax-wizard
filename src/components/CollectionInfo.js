import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../state/store';
import { capitalizeFirstLetter } from '../utils/formatUtils';

const CollectionInfo = (props) => {
  const {
    collectionName,
    setCollectionName,
    collectionDescription,
    setCollectionDescription,
    validatedSteps,
    setValidatedSteps,
    setActiveTab,
    activeTab,
  } = useContext(AppContext);

  const [hasError, setHasError] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (activeTab === 0) { setActive(true) }
  }, [activeTab])

  const validateStep = () => {
    let stepsArray = validatedSteps;
    // TO-DO: Define validation rules.
    if (collectionName && collectionDescription) {
      setHasError(false);
      stepsArray[0].isValidated = true;
      setValidatedSteps([...stepsArray]);
      setActiveTab(1);
    } else {
      setHasError(true);
      stepsArray[0].isValidated = false;
      setValidatedSteps([...stepsArray]);
    }
  }

  return (
    <div className={`container px-5 py-5 mx-auto flex transition-opacity ease-in duration-900 ${active ? 'opacity-100' : 'opacity-0'}`}>
      <div className="lg:w-1/3 md:w-1/2 bg-gray-800 shadow-md rounded-lg p-8 flex flex-col mx-auto w-full mt-10 md:mt-0 relative z-10">
        <h2 className="text-white text-lg mb-1 font-medium title-font">BoostrPax Wizard</h2>
        <p className="leading-relaxed mb-5">Welcome to the BoostrPax wizard. Complete the fields below to start.</p>
        <div className="relative mb-4">
          <label htmlFor="collection-name" className="leading-7 text-sm text-gray-200">Title (Max. 80 characters)</label>
          <input maxLength="80" onChange={(e) => setCollectionName(capitalizeFirstLetter(e.target.value))} value={collectionName} type="text" id="collection-name" name="collection-name" className={`w-full bg-gray-800 rounded border border-gray-700 text-base outline-none text-gray-100 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out ${(hasError && !collectionName) ? 'border-red-700 focus:border-red-500 focus:ring-2 focus:ring-red-900' : 'border-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-900'}`} placeholder="Enter collection title"/>
        </div>
        <div className="relative mb-4">
          <label htmlFor="collection-description" className="leading-7 text-sm text-gray-200">Description (Max. 200 characters)</label>
          <textarea maxLength="200" onChange={(e) => setCollectionDescription(capitalizeFirstLetter(e.target.value))} value={collectionDescription} id="collection-description" name="collection-description" className={`w-full bg-gray-800 rounded border h-32 text-base outline-none text-gray-100 py-1 px-3 resize-none leading-6 transition-colors duration-200 ease-in-out ${(hasError && !collectionDescription) ? 'border-red-700 focus:border-red-500 focus:ring-2 focus:ring-red-900' : 'border-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-900'}`} placeholder="Enter collection description"/>
        </div>
        <button
          className="text-white bg-indigo-500 border-0 py-2 px-6 focus:outline-none hover:bg-indigo-600 rounded text-lg"
          onClick={() => validateStep()}
        >
          Save & Continue
        </button>
        <p className="text-xs text-gray-400 text-opacity-90 mt-3 text-center">This collection name and description is what your users will see in the BoostrPax collection.</p>
      </div>
    </div>
  );
}

export default CollectionInfo;
