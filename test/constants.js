const utils = require("./utils");

const token = {
  "ticker": "MTK",
  "name": "MyToken",
  "decimals": 18,
  "supply": 0,
  "isMintable": true,
  "globalmincap": 0
};

const investor = {
  addr: "0x005364854d51A0A12cb3cb9A402ef8b30702a565",
  reservedTokens: utils.toFixed(10*10**token.decimals),
  reservedTokensInPercentage: 20
};

const whiteListItem = {
  addr: "0x005364854d51A0A12cb3cb9A402ef8b30702a565",
  status: true,
  minCap: utils.toFixed(1*10**token.decimals),
  maxCap: utils.toFixed(10*10**token.decimals),
};

const startCrowdsale = parseInt(new Date().getTime()/1000);
let endCrowdsale = new Date().setDate(new Date().getDate() + 4);
endCrowdsale = parseInt(new Date(endCrowdsale).setUTCHours(0)/1000);

const crowdsale = {
  "multisig": "0x005364854d51A0A12cb3cb9A402ef8b30702a565",
  "start": startCrowdsale,
  "end": endCrowdsale,
  "minimumFundingGoal": 0,
  "maximumSellableTokens": 1000,
  "isUpdatable": true,
  "isWhiteListed": true
}

const pricingStrategy = {
  "rate": 1000
};

module.exports = {
  token: token,
  investor: investor,
  whiteListItem: whiteListItem,
  crowdsale: crowdsale,
  pricingStrategy: pricingStrategy
}