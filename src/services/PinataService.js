import axios from 'axios';
const FormData = require('form-data');
const PINATA_API_BASE_URL = process.env.PINATA_API_BASE_URL;
const PINATA_JWT = process.env.PINATA_JWT;
import { slugify, getFileExtension, capitalizeFirstLetter } from '../utils/formatUtils';
import { getTodayString } from '../utils/dateUtils';

const uploadAsset = async (asset, assetId, isPackCover = false) => {
  // Options
  const fileExtension = getFileExtension(asset.name);
  const pinataOptions = JSON.stringify({ cidVersion: 1 });
  let pinataMetadata;
  if (isPackCover) {
    pinataMetadata = JSON.stringify(
      {
        name: `${slugify(asset.collection)}-pack-cover.${fileExtension}`,
        keyvalues: {
          title: asset.title,
          description: asset.description,
          collection: asset.collection,
          timestamp: getTodayString(true)
        }
      }
    );
  } else {
    pinataMetadata = JSON.stringify(
      {
        name: `${assetId}-${slugify(asset.collection)}.${fileExtension}`,
        keyvalues: {
          id: assetId,
          title: asset.title,
          description: asset.description,
          rarity: asset.rarity,
          collection: asset.collection,
          timestamp: getTodayString(true)
        }
      }
    );
  }

  // Convert to blob for uploading
  let blob = await fetch(asset.preview).then(r => r.blob());

  // Compose data object
  let data = new FormData();
  data.append('file', blob);
  data.append('pinataOptions', pinataOptions);
  data.append('pinataMetadata', pinataMetadata);

  // Post
  let response = await axios({
    method: 'post',
    url: `${PINATA_API_BASE_URL}/pinning/pinFileToIPFS`,
    data,
    maxBodyLength: 'Infinity',
    headers: {
      'Authorization': `Bearer ${PINATA_JWT}`,
      'Content-Type': `multipart/form-data; boundary=${data._boundary}`
    },
  });

  // Update and return assets
  let updatedAsset = asset;

  if(response.status === 200) {
    updatedAsset.ipfsHash = response.data.IpfsHash;
  } else {
    updatedAsset.ipfsHash = null;
  }

  if (asset?.placeholderImage) {
    // TODO: Upload placeholder image to IPFS
    pinataMetadata = JSON.stringify(
      {
        name: `${assetId}-${slugify(asset.collection)}-placeholder.${fileExtension}`,
        keyvalues: {
          id: assetId,
          title: asset.title,
          description: asset.description,
          rarity: asset.rarity,
          collection: asset.collection,
          timestamp: getTodayString(true)
        }
      }
    );

    // Compose data object
    data = new FormData();
    data.append('file', asset.placeholderImage);
    data.append('pinataOptions', pinataOptions);
    data.append('pinataMetadata', pinataMetadata);

    // Post
    response = await axios({
      method: 'post',
      url: `${PINATA_API_BASE_URL}/pinning/pinFileToIPFS`,
      data,
      maxBodyLength: 'Infinity',
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`,
        'Content-Type': `multipart/form-data; boundary=${data._boundary}`
      },
    });

    if (response.status === 200) {
      updatedAsset.placeholderIpfsHash = response.data.IpfsHash;
      console.log("Placehodler uploaded successfully! IPFS hash: ", response.data.IpfsHash);
    } else {
      console.log("Error while uploading placeholder");
    }
  }

  return {
    updatedAsset,
    payload: response
  };
};

const uploadAssets = async (assets) => {
  let allAssetsUploaded = false;
  const updatedAssets = new Array(assets.length);
  for (var i = 0; i < assets.length; i++) {
    const uploadResult = await uploadAsset(assets[i], i);
    allAssetsUploaded = uploadResult.updatedAsset.ipfsHash ? true : false;
    if (uploadResult.updatedAsset.placeholderImage) {
      allAssetsUploaded = uploadResult.updatedAsset.placeholderIpfsHash ? true : false;
    }
    updatedAssets[i] = uploadResult.updatedAsset;
    if (!allAssetsUploaded) {
      break;
    }
  }
  return {
    updatedAssets,
    allAssetsUploaded,
  };
};

const generateMetadata = (asset, assetId, isPackMetadata) => {
  let metadata = {
    id: assetId,
    image: asset.type.includes('image') ? `ipfs://${asset.ipfsHash}` : asset?.placeholderIpfsHash ? `ipfs://${asset.placeholderIpfsHash}` : null,
    // image_data: null,
    // external_url: '',
    name: asset.title || null,
    description: asset.description || null,
    attributes: isPackMetadata ? [{
      trait_type: "Feature",
      value: "2-year HODL period boost for obtaining rarer NFTs when opening this pack"
    }] : [{ trait_type: "Rarity", value: capitalizeFirstLetter(asset.rarity) }],
    // background_color: null,
    animation_url: asset.type.includes('video') ? `ipfs://${asset.ipfsHash}` : null,
    // youtube_url: null,
    timestamp: getTodayString(true),

  };

  // Convert JSON to blob for uploading
  const str = JSON.stringify(metadata);
  const bytes = new TextEncoder().encode(str);
  const metadataBlob = new Blob([bytes], {
      type: "application/json;charset=utf-8"
  });

  return metadataBlob;
}

const uploadMetadataFile = async (asset, collectionDescription, isPackMetadata = false) => {
  // Generate metadata for assets
  const metadataBlob = generateMetadata(asset, 0, isPackMetadata);

  // Upload Metadata to IPFS
  let data = new FormData();
  const pinataOptions = JSON.stringify({ cidVersion: 1 });
  const path = `${slugify(asset.collection)}`;

  const pinataMetadata = JSON.stringify(
    {
      name: isPackMetadata ? slugify(asset.title) : `${path}-assets-metadata`,
      keyvalues: {
        title: isPackMetadata ? asset.title : asset.collection,
        collection: asset.collection,
        description: collectionDescription,
        timestamp: getTodayString(true)
      }
    }
  );

  // Populate data
  data.append('file', metadataBlob, slugify(asset.title));
  data.append('pinataOptions', pinataOptions);
  data.append('pinataMetadata', pinataMetadata);

  // Post
  const response = await axios({
    method: 'post',
    url: `${PINATA_API_BASE_URL}/pinning/pinFileToIPFS`,
    data,
    maxBodyLength: 'Infinity',
    headers: {
      'Authorization': `Bearer ${PINATA_JWT}`,
      'Content-Type': `multipart/form-data; boundary=${data._boundary}`
    },
  });

  if (response.status === 200) {
    return response.data.IpfsHash;
  };

  const res = {
    payload: response,
    errorType: isPackMetadata ? 'packsMetadataBlobsUpload' : 'assetsMetadataBlobsUpload',
    isPackMetadata,
  };
  console.error(res);
  return res;
}

const uploadMetadataFolder = async (assets, collectionDescription, isPackMetadata = false) => {
  // Generate metadata for assets
  const metadataBlobs = [];
  for (var i = 0; i < assets.length; i++) {
    metadataBlobs.push(generateMetadata(assets[i], i, isPackMetadata));
  }

  // Check if all metadata blobs were generated
  if (assets.length !== metadataBlobs.length) {
    return {
      folderHash: null,
      payload: metadataBlobs,
      errorType: isPackMetadata ? 'packsMetadataBlobsGeneration' : 'assetsMetadataBlobsGeneration',
      isPackMetadata,
    };
  }

  // Upload Metadata to IPFS
  let data = new FormData();
  const pinataOptions = JSON.stringify({ cidVersion: 1 });
  const path = `${slugify(assets[0].collection)}`;

  const pinataMetadata = JSON.stringify(
    {
      name: isPackMetadata ? slugify(assets[0].title) : `${path}-assets-metadata`,
      keyvalues: {
        title: isPackMetadata ? assets[0].title : assets[0].collection,
        collection: assets[0].collection,
        description: collectionDescription,
        timestamp: getTodayString(true)
      }
    }
  );

  // Populate data
  for (var i = 0; i < metadataBlobs.length; i++) {
    data.append('file', metadataBlobs[i], isPackMetadata ? `${slugify(assets[0].title)}/${i}` : `${path}-assets-metadata/${i}`);
  }
  data.append('pinataOptions', pinataOptions);
  data.append('pinataMetadata', pinataMetadata);

  // Post
  const response = await axios({
    method: 'post',
    url: `${PINATA_API_BASE_URL}/pinning/pinFileToIPFS`,
    data,
    maxBodyLength: 'Infinity',
    headers: {
      'Authorization': `Bearer ${PINATA_JWT}`,
      'Content-Type': `multipart/form-data; boundary=${data._boundary}`
    },
  });
  if (response.status === 200) {
    return {
      folderHash: response.data.IpfsHash,
      payload: response,
      errorType: null,
      isPackMetadata,
    };
  };
  return {
    folderHash: null,
    payload: response,
    errorType: isPackMetadata ? 'packsMetadataBlobsUpload' : 'assetsMetadataBlobsUpload',
    isPackMetadata,
  };
}

export { uploadAsset, uploadAssets, uploadMetadataFolder, uploadMetadataFile };
