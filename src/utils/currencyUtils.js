const { ethers } = require("ethers");

const convertToWei = (amount) => {
  if (isNaN(amount)) {
    console.log('Error parsing amount to convert to wei...');
    return null;
  }
  // Convert the amount to a string to prevent precision loss,
  // then use ethers.js utilities to accurately calculate the wei value.
  return ethers.parseEther(amount.toString());
}

export { convertToWei };
