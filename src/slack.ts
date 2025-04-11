import { cfg } from './constants';
import { WebClient, LogLevel } from '@slack/web-api';
import { Proposal } from './entity/Proposal';
import { App, BlockAction, ButtonAction } from '@slack/bolt';
import summarizeProposalDescription from './governance-ai';
import { VoteOption } from 'cosmjs-types/cosmos/gov/v1beta1/gov';
import { voteProposal } from './cosmos-signer';
import { AppDataSource, addTxToIndexingQueue } from './data-source';
import { Chain } from './entity/Chain';

export const setupSlack = () => {
  // Setup slack bot
  const slack = new App({
    token: cfg.SlackBotToken,
    signingSecret: cfg.SlackSigningSecret,
    appToken: cfg.SlackAppToken,
    socketMode: true,
  });

  // Listen for vote button clicks and open a new modal asking for reason
  slack.action('vote', async ({ body, ack, client, logger }) => {
    const typed_body = <BlockAction>body;

    // Check if user is allowed
    if (cfg.SlackAllowedVoteUsers.indexOf(body.user.id) < 0) {
      await client.chat.postMessage({
        channel: body.channel.id,
        text: `User ${typed_body.user.name} (${typed_body.user.id}) is not allowed to vote proposals!`,
        thread_ts: typed_body.message.ts,
      });
      await ack();
      return;
    }

    let button_elements = (<ButtonAction>typed_body.actions[0]).value.split('-');
    const proposal_id = button_elements.pop(); // removes and returns the last element
    const proposal_chain = button_elements.join('-'); // joins the remaining parts

    // Get chain data
    const chain_repo = AppDataSource.getRepository(Chain);
    const chain_data = await chain_repo.findOneBy({ name: proposal_chain });

    // Open modal
    try {
      const modal = await client.views.open({
        trigger_id: typed_body.trigger_id,
        view: {
          type: 'modal',
          private_metadata: JSON.stringify({ proposal: { id: proposal_id, chain: proposal_chain }, ts: typed_body.message.ts }),
          // View identifier
          callback_id: 'vote_proposal',
          title: {
            type: 'plain_text',
            text: 'Vote Proposal',
          },
          blocks: [
            {
              type: 'context',
              elements: [
                {
                  type: 'plain_text',
                  text: `Chain: ${proposal_chain}`,
                  emoji: true,
                },
                {
                  type: 'plain_text',
                  text: `ID: ${proposal_id}`,
                  emoji: true,
                },
              ],
            },
            {
              type: 'input',
              block_id: 'input_memo',
              label: {
                type: 'plain_text',
                text: `Write the reason of your vote on ${proposal_chain} proposal #${proposal_id}`,
              },
              element: {
                type: 'plain_text_input',
                max_length: 256,
                action_id: 'memo_action',
                multiline: false,
                focus_on_load: true,
              },
            },
            {
              type: 'input',
              block_id: 'input_vote',
              element: {
                type: 'static_select',
                placeholder: {
                  type: 'plain_text',
                  text: 'Select a vote option',
                  emoji: true,
                },
                options: [
                  {
                    text: {
                      type: 'plain_text',
                      text: 'YES 👍',
                      emoji: true,
                    },
                    value: 'yes',
                  },
                  {
                    text: {
                      type: 'plain_text',
                      text: 'No ❌',
                    },
                    value: 'no',
                  },
                  {
                    text: {
                      type: 'plain_text',
                      text: 'Abstain 🤷',
                      emoji: true,
                    },
                    value: 'abstain',
                  },
                  {
                    text: {
                      type: 'plain_text',
                      text: 'Veto 🚨',
                      emoji: true,
                    },
                    value: 'veto',
                  },
                ],
                action_id: 'vote_action',
              },
              label: {
                type: 'plain_text',
                text: 'How do you want to vote?',
                emoji: true,
              },
            },
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: `Make sure to read the full proposal before voting!\n ↗️ <https://mintscan.io/${chain_data.explorer_url}/proposals/${proposal_id}|Proposal Details>`,
                },
              ],
            },
          ],
          submit: {
            type: 'plain_text',
            text: 'Vote Now',
          },
        },
      });

      logger.info(modal);
    } catch (error) {
      logger.error(error);
    }

    // Acknowledge action request
    await ack();
  });

  // Listen for view submit, broadcast vote transaction with memo
  slack.view('vote_proposal', async ({ ack, view, client, logger }) => {
    // unpack meta
    const { proposal, ts } = JSON.parse(view.private_metadata);

    // Get vote option & memo
    const memo = view.state.values['input_memo']['memo_action'].value;
    const vote_option = view.state.values['input_vote']['vote_action'].selected_option.value;

    logger.info(memo);
    logger.info(vote_option);

    // Acknowledge the view_submission request
    await ack();

    // Vote Proposal
    const propRepo = AppDataSource.getRepository(Proposal);
    const propDb = await propRepo.findOneBy({ id: proposal.id, chain_name_ex: proposal.chain });

    voteProposal(propDb, { vote_option: voteInputToOption(vote_option), memo })
      .then(async (tx) => {
        // send message in thread
        await client.chat.postMessage({
          mrkdwn: true,
          text: `✅ Voted ${vote_option} on *${proposal.chain}* proposal *#${proposal.id}*! \nTx Hash: \`${tx.transactionHash}\`. \n\n↗️ <https://mintscan.io/${propDb.chain.explorer_url}/txs/${tx.transactionHash}|See in explorer>`,
          thread_ts: ts,
          channel: cfg.SlackChannelID,
        });

        // add tx to indexing queue
        addTxToIndexingQueue(proposal.chain, tx.transactionHash).catch((e) =>
          logger.error(`Can't add tx to indexing queue. ${e}`),
        );
      })
      .catch(async (error) => {
        logger.error(error);
        await client.chat.postMessage({
          text: `⚠ Error voting ${vote_option} on ${proposal.chain} proposal #${proposal.id}! ⚠\n\`${error}\``,
          thread_ts: ts,
          channel: cfg.SlackChannelID,
        });
      });
  });

  (async () => {
    // Start your app
    await slack.start(process.env.PORT || 3000);

    console.log('⚡️ Bolt app is running!');
  })();
};

export const SendSlackNotification = async (proposal: Proposal) => {
  const voting_end = new Date(proposal.voting_end);

  // Summirize description
  const summuray = await summarizeProposalDescription(proposal);

  // Load chain data
  const chainRepo = AppDataSource.getRepository(Chain);
  const chainData = await chainRepo.findOneBy({ name: proposal.chain_name_ex });

  const msg = {
    channel: cfg.SlackChannelID,
    text: `[${proposal.chain_name_ex}] #${proposal.id}: ${proposal.title}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `[${proposal.chain_name_ex}] #${proposal.id}: ${proposal.title}`,
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Chain:* ${proposal.chain_name_ex}`,
          },
          {
            type: 'mrkdwn',
            text: `*Expiring:* ${voting_end.toLocaleDateString()} ${voting_end.toLocaleTimeString()}`,
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${summuray}`,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              emoji: true,
              text: 'Open Voting Modal',
            },
            value: `${proposal.chain_name_ex}-${proposal.id}`,
            action_id: 'vote',
          },
        ],
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `↗️ <https://mintscan.io/${chainData.explorer_url}/proposals/${proposal.id}|Proposal Details>`,
          },
        ],
      },
    ],
  };

  const client = new WebClient(cfg.SlackBotToken, {
    // LogLevel can be imported and used to make debugging simpler
    logLevel: LogLevel.DEBUG,
  });

  try {
    // Call the chat.postMessage method using the WebClient
    const result = await client.chat.postMessage(msg);
    return result;
  } catch (error) {
    throw error;
  }
};

export const voteInputToOption = (input: string): VoteOption => {
  switch (input) {
    case 'yes':
      return VoteOption.VOTE_OPTION_YES;
    case 'no':
      return VoteOption.VOTE_OPTION_NO;
    case 'abstain':
      return VoteOption.VOTE_OPTION_ABSTAIN;
    case 'veto':
      return VoteOption.VOTE_OPTION_NO_WITH_VETO;
    default:
      return VoteOption.VOTE_OPTION_UNSPECIFIED;
  }
};
