# Cosmos Governance Slack Bot

This project is a governance bot designed to interact with Cosmos blockchain and Slack, providing users the facility to vote on blockchain proposals directly from Slack. It is especially beneficial for teams and individuals who want to streamline their voting process within a familiar environment.

## Short Description
The Cosmos Governance Slack Bot allows specified Slack users to fetch and vote on proposals from different Cosmos SDK versions. It integrates the CosmJS library for blockchain interactions and axios for HTTP requests, creating a seamless bridge between Cosmos blockchain and Slack.

![Screenshot 2023-09-28 alle 12 00 32](https://github.com/kintsugi-tech/governance-backend/assets/543292/ecba3353-46e8-4571-a1de-0fe67001ed9d)

## Environment Setup

### Manual Setup
1. **Clone the Repository**
   ```sh
   git clone https://github.com/yourusername/projectname.git
   ```
2. **Install Dependencies**
   ```sh
   cd projectname
   yarn install # or npm install
   ```
3. **Setup Environment Variables**
   Copy `.env.example` to `.env` and fill in the actual values.
   ```sh
   cp .env.example .env
   nano .env # use any text editor to edit the file
   ```
4. **Setup PostgreSQL Database**
   Setup a PostgreSQL database and update the `.env` file with the database credentials.

### Using Docker
If you have Docker installed, you can use it to run the application in a container. This will handle the database setup and manage the application dependencies for you.

1. **Build Docker Image**
   ```sh
   docker build -t cosmos-bot .
   ```
2. **Run Docker Container**
   ```sh
   docker run -d --name cosmos-bot -p 3000:3000 cosmos-bot
   ```

### Run as Daemon
You can use `pm2` to run the application in the background as a daemon.
1. **Install PM2**
   ```sh
   npm install pm2 -g
   ```
2. **Start Application with PM2**
   ```sh
   pm2 start npm --name "cosmos-bot" -- start
   ```
### ENV file
- **`SLACK_BOT_TOKEN`**: This token is used to authenticate the bot with Slack. It usually starts with `xoxb-`.
  
- **`SLACK_APP_TOKEN`**: This token is used to authenticate the app installation user within Slack. It usually starts with `xapp-`.
  
- **`SLACK_SIGNING_SECRET`**: This secret is used to verify that HTTP requests sent to your app's endpoints are from Slack.

- **`SLACK_CHANNEL_ID`**: This is the ID of the Slack channel where the bot is intended to post messages.

- **`SLACK_ALLOWED_VOTE_USERS`**: This is a comma-separated list of user IDs allowed to vote.
  
- **`PROPOSAL_SCAN_FREQUENCY`**: Determines how often the bot should scan for new proposals. It's written in cron format.
  
- **`OPENAI_API_KEY`**: This key is used to authenticate with the OpenAI service. It usually starts with `sk-`.

- **`VOTING_WALLET_MNEMONIC`**: This mnemonic is used for generating voting wallet keys. Replace the placeholder with the actual mnemonic.

- **`POSTGRES_USER`**: The username for the PostgreSQL database.

- **`POSTGRES_PASSWORD`**: The password for the PostgreSQL database.
  
- **`POSTGRES_DB`**: The name of the PostgreSQL database.
  
Refer to [Slack’s official documentation](https://api.slack.com/authentication) to generate the necessary Slack tokens and to obtain the signing secret. Remember to never share or expose these tokens, as they can be used to gain access to your Slack workspace.


## Voting Wallet Authz Setup
This section will guide you through setting up Authz for the voting wallet.

Authz enables one account, the granter, to grant another account, the grantee, permissions to execute messages on its behalf.

## Setup:

### Grant Permission
Granter gives permission to the grantee by creating an authorization using MsgGrant.

```bash
gaiad tx authz grant [grantee_address] generic --from [granter_key_name] --msg-type /cosmos.gov.v1beta1.MsgVote
```

### Revocation:
Revoke Permission: Granter can revoke the authorization granted using MsgRevoke.

```bash
gaiad tx authz revoke [granter_addr] /cosmos.gov.v1beta1.MsgVote --from [granter_key_name]
```

## Contribute
To contribute to this project, please create a fork of the repository, make your changes and submit a pull request. Ensure that your code adheres to the existing style and all tests are passing.

## Further Information
For any additional information or queries, feel free to contact us.
