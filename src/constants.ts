import * as dotenv from 'dotenv';

// Setup env
dotenv.config();

export const cfg = {
  DBUser: process.env.POSTGRES_USER || 'postgres',
  DBPass: process.env.POSTGRES_PASSWORD || 'postgres',
  DBPort: parseInt(process.env.POSTGRES_PORT) || 5432,
  DBHost: process.env.POSTGRES_HOST || 'localhost',
  DBName: process.env.POSTGRES_DB || 'postgres',

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
