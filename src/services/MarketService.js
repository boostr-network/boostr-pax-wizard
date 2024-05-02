import axios from 'axios';
const COIN_MARKET_CAP_API_KEY = process.env.COIN_MARKET_CAP_API_KEY;
const COIN_MARKET_CAP_API_BASE_URL = process.env.COIN_MARKET_CAP_API_BASE_URL;

const convertCurrency = async (currencyFrom, currencyTo, amountToConvert) => {
  let data = null;
  const url = `${COIN_MARKET_CAP_API_BASE_URL}/v2/tools/price-conversion`;
  const headers = {
    "X-CMC_PRO_API_KEY": COIN_MARKET_CAP_API_KEY
  };
  const params = {
    symbol: currencyFrom.toUpperCase(),
    convert: currencyTo.toUpperCase(),
    amount: amountToConvert,
  }

  try {
    const response = await axios.get(url, { params, headers });
    if (response.status === 200) { data = response.data.data[0] }
  } catch (e) {
    console.log('Error converting currency', e);
  }
  return data;
}

export { convertCurrency };
