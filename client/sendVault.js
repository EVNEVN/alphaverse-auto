import { readFile } from 'fs/promises';
import StakeApi from './StakeApi.mjs';

const processArguments = process.argv.slice(2);
let receiver = processArguments[0];
if (!receiver) {
    console.error('Missing first argument for receiver. Example: node client/sendVault.js <receiver>');
    process.exit(1);
}

receiver = receiver.trim();

const jsonConfig = JSON.parse(await readFile(new URL('../client_config.json', import.meta.url)));
let config = {
    id: null,
    apiKey: process.env.CLIENT_API_KEY || jsonConfig.apiKey,
    password: process.env.CLIENT_PASSWORD || jsonConfig.password,
    twoFaSecret: process.env.CLIENT_2FA_SECRET || jsonConfig.twoFaSecret || null,
    currency: process.env.CLIENT_CURRENCY || jsonConfig.currency,
    funds: null
};

const apiClient = new StakeApi(config.apiKey);

console.log('Fetching funds...');
config.funds = await apiClient.getFunds(config.currency);
const amount = config.funds.vault;

if (config.funds.vault <= 0) {
    console.error('Nothing in vault.');
    process.exit(1);
}

console.log('Withdrawing everything from vault...');
await apiClient.withdrawFromVault(config.currency, amount, config.password, config.twoFaSecret);

console.log(`Sending ${amount.toFixed(8)} ${config.currency.toUpperCase()} to ${receiver}...`);
await apiClient.tip(config.currency, amount - 0.00000001, receiver, config.twoFaSecret);