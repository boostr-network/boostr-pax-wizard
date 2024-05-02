import React, { useEffect, useContext, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { AppContext } from '../state/store';

const FileUploader = (props) => {
  const {
    assets,
    setAssets,
    setActiveTab,
    validatedSteps,
    setValidatedSteps,
    collectionName,
    collectionDescription,
    activeTab,
  } = useContext(AppContext);

  const [active, setActive] = useState(false);

  useEffect(() => {
    if (activeTab === 1) { setActive(true) }
  }, [activeTab])

  const {getRootProps, getInputProps} = useDropzone({
    accept: {
      'image/*': [],
      'video/mp4': ['.mp4']
    },
    onDrop: acceptedFiles => {
      const updatedAssets = assets;
      acceptedFiles.map((acceptedFile, index) => {
        let fileExists = false;
        if (updatedAssets.length > 0) { fileExists = updatedAssets.find(asset => asset.name === acceptedFile.name); }
        if (!fileExists) {
          Object.assign(acceptedFile, {
            preview: URL.createObjectURL(acceptedFile),
            isUploaded: false,
            title: `${collectionName} Collectible #${index}`,
            collection: collectionName,
            description: collectionDescription,
            rarity: null,
            ipfsHash: null,
          });
          updatedAssets.push(acceptedFile);
        }
      });

      setAssets([...updatedAssets]);
    },
  });

  const validateStep = () => {
    let stepsArray = validatedSteps;
    if (assets.length > 4) {
      stepsArray[1].isValidated = true;
      stepsArray[1].hasError = false;
      setValidatedSteps([...stepsArray]);
      setActiveTab(2);
    } else {
      stepsArray[1].isValidated = false;
      stepsArray[1].hasError = true;
      setValidatedSteps([...stepsArray]);
    }
  };

  const handleRemoveAssets = () => {
    let stepsArray = validatedSteps;
    stepsArray[1].isValidated = false;
    stepsArray[1].hasError = false;
    setValidatedSteps([...stepsArray]);
    setAssets([]);
  }

  const thumbs = assets.map(asset => (
    <div className="inline-flex rounded-xs mb-1 mr-1 w-28 h-28 p-1 border box-border" key={asset.name}>
      <div className="min-w-0 flex overflow-hidden mx-auto">
        {asset.type.includes('video') && (
          <video
            src={asset.preview}
            muted
            autoPlay
            loop
            className="block w-auto h-full mx-auto"
            type="video/mp4"
          />
        )}
        {asset.type.includes('image') && (
          <img
            src={asset.preview}
            className="block w-auto h-full mx-auto"
          />
        )}
      </div>
    </div>
  ));

  return (
    <section className={`container px-5 py-5 mx-auto flex flex-col transition-opacity ease-in duration-900 ${active ? 'opacity-100' : 'opacity-0'}`}>
      <div {...getRootProps({className: 'lg:w-1/3 md:w-1/2 bg-gray-800 shadow-md rounded-lg p-8 flex flex-col mx-auto w-full mt-10 md:mt-0 relative z-10 border-dashed border-2 border-sky-500 cursor-pointer'})}>
        <input {...getInputProps()} />
        <p className="text-center leading-relaxed text-base">Drag and drop the art of your album stickers, or click here to select the files manually (only images and videos are allowed)</p>
      </div>
      <div className="lg:w-1/2 flex flex-row flex-wrap mt-5 mx-auto w-full">
        {thumbs}
      </div>
      {assets.length > 0 && assets.length < 5 && (
        <p className="leading-relaxed font-semibold text-red-500 text-center">There should be at least 5 assets to upload, one for each rarity...</p>
      )}
      {assets.length > 4 && (
        <button
          className="lg:w-1/3 md:1/3 text-white bg-indigo-500 border-0 py-2 px-6 focus:outline-none hover:bg-indigo-600 rounded text-lg mx-auto mt-5 w-full"
          onClick={() => validateStep()}
        >
          Save & Continue
        </button>
      )}
      {assets.length > 0 && (
        <button
          className="lg:w-1/3 md:1/3 text-white bg-transparent border-2 transition-colors border-red-600 py-2 px-6 focus:outline-none hover:bg-red-600 rounded text-lg mx-auto mt-5 w-full"
          onClick={() => handleRemoveAssets()}
        >
          Remove All
        </button>
      )}
    </section>
  );
}

export default FileUploader;
