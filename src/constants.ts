import * as dotenv from 'dotenv';

export const CHAINS = [
  {
    name: 'cosmoshub',
    chain_id: 'cosmoshub-4',
    prefix: 'cosmos',
    voter_address: 'cosmos1sjllsnramtg3ewxqwwrwjxfgc4n4ef9u0tvx7u',
  },
  { name: 'juno', chain_id: 'juno-1', prefix: 'juno', voter_address: 'juno1sjllsnramtg3ewxqwwrwjxfgc4n4ef9uee0aeq' },
  { name: 'osmosis', chain_id: 'osmosis-1', prefix: 'osmo', voter_address: 'osmo1sjllsnramtg3ewxqwwrwjxfgc4n4ef9u8slkgw' },
  { name: 'kava', chain_id: 'kava_2222-10', prefix: 'kava', voter_address: 'kava1ffcujj05v6220ccxa6qdnpz3j48ng024fqdz47' },
  { name: 'agoric', chain_id: 'agoric-3', prefix: 'agoric', voter_address: 'agoric1z5xat323j3pzwln893zseksg8pavhred2vwpds' },
  { name: 'irisnet', chain_id: 'irishub-1', prefix: 'iaa', voter_address: 'iaa1vk4kps6gala40ue4nltghym0vdq8z5ep308tve' },
  {
    name: 'persistence',
    chain_id: 'core-1',
    prefix: 'persistence',
    voter_address: 'persistence1a8e70jds75rftrs9e5d2qmu4y38d3km7yxhns2',
  },
  { name: 'evmos', chain_id: 'evmos_9001-2', prefix: 'evmos', voter_address: 'evmos1tcty2k97cdv5sc6xcdf2atrrxq0zg7vvl2xq67' },
  { name: 'regen', chain_id: 'regen-1', prefix: 'regen', voter_address: 'regen15qepg86xxesg7k633ent5t9vaweyf5zt5fhyuc' },
  { name: 'sentinel', chain_id: 'sentinelhub-2', prefix: 'sent', voter_address: 'sent15nr70ed65h8gnwpn879u8pvtjcy7mt6cy4qatm' },
];

// Setup env
dotenv.config();

export const cfg = {
    ProposalScanFrequency: process.env.PROPOSAL_SCAN_FREQUENCY || "0 */5 * * *",
  
    ApiPort: process.env.API_PORT || 3031,

    SlackBotToken: process.env.SLACK_BOT_TOKEN || "",
    SlackSigningSecret: process.env.SLACK_SIGNING_SECRET || "",
    SlackChannelID: process.env.SLACK_CHANNEL_ID || "",
    SlackAPIPort: process.env.SLAC_API_PORT || 3000
}