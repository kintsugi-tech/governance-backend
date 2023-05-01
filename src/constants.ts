import * as dotenv from 'dotenv';

export const CHAINS = [
  {
    name: 'cosmoshub',
    chain_id: 'cosmoshub-4',
    prefix: 'cosmos',
    voter_address: 'cosmos1usvshtypjw57edkwxq3tagme665398f0japmst',
    gasPrice: '0.0025uatom',
  },
  {
    name: 'juno',
    chain_id: 'juno-1',
    prefix: 'juno',
    voter_address: 'juno1juczud9nep06t0khghvm643hf9usw45r4v7lq6',
    gasPrice: '0.0025ujuno',
  },
  {
    name: 'osmosis',
    chain_id: 'osmosis-1',
    prefix: 'osmo',
    voter_address: 'osmo1juczud9nep06t0khghvm643hf9usw45rt9w535',
    gasPrice: '0.001uosmo',
  },
  {
    name: 'crescent',
    chain_id: 'crescent-1',
    prefix: 'cre',
    voter_address: 'cre1zegq2j52zh7g23k8dzfawwmz64j8d52uzand6e',
    gasPrice: '0.001ucre',
  },
  {
    name: 'stride',
    chain_id: 'stride-1',
    prefix: 'stride',
    voter_address: 'stride1crzkfx6tnm5zfnp3x5j3k62n3m0cw6ezlgzeca',
    gasPrice: '0.001ustrd',
  },
  {
    name: 'chihuahua',
    chain_id: 'chihuahua-1',
    prefix: 'chihuahua',
    voter_address: 'chihuahua1t6t8ttmlzw5fgehx5wlfc02sefj5etwv9dylkw',
    gasPrice: '0.001uhuahua',
  },
  {
    name: 'stargaze',
    chain_id: 'stargaze-1',
    prefix: 'stars',
    voter_address: 'stars1s33zct2zhhaf60x4a90cpe9yquw99jj0qh8pdx',
    gasPrice: '0.001ustars',
  },
  {
    name: 'comdex',
    chain_id: 'comdex-1',
    prefix: 'comdex',
    voter_address: 'comdex1e64ezvwfy0tquprzum7e2aauxkqecnfpg0u222',
    gasPrice: '0.001ucmdx',
  },
  {
    name: 'bitsong',
    chain_id: 'bitsong-2b',
    prefix: 'bitsong',
    voter_address: 'bitsong1fkj2cn209yeexxyets98evrcmmds23hchtrdja',
    gasPrice: '0.001ubtsg',
  },
  {
    name: 'desmos',
    chain_id: 'desmos-mainnet',
    prefix: 'desmos',
    voter_address: 'desmos1u0xqasxgl6qkkckd860pt4xjqryxek4y3e66wg',
    gasPrice: '0.001udsm',
  },
];

// Setup env
dotenv.config();

export const cfg = {
  ProposalScanFrequency: process.env.PROPOSAL_SCAN_FREQUENCY || '0 */5 * * *',

  ApiPort: process.env.API_PORT || 3031,

  SlackBotToken: process.env.SLACK_BOT_TOKEN || '',
  SlackSigningSecret: process.env.SLACK_SIGNING_SECRET || '',
  SlackAppToken: process.env.SLACK_APP_TOKEN || '',
  SlackChannelID: process.env.SLACK_CHANNEL_ID || '',
  SlackAllowedVoteUsers: process.env.SLACK_ALLOWED_VOTE_USERS.split(',') || [],

  VotingWalletMnemonic: process.env.VOTING_WALLET_MNEMONIC || '',

  OpenAIAPIKey: process.env.OPENAI_API_KEY || '',
};
