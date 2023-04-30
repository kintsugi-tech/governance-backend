import { cfg } from './constants';
import { WebClient, LogLevel } from '@slack/web-api';
import { Proposal } from './entity/Proposal';
import { App, BlockAction, BlockElementAction, ButtonAction, SlackAction } from '@slack/bolt';
import summarizeProposalDescription from './governance-ai';
import { VoteOption } from 'cosmjs-types/cosmos/gov/v1beta1/gov';
import { voteProposal, VoteRequest } from './cosmos-signer';
import { AppDataSource } from './data-source';

export const setupSlack = () => {
  // Setup slack bot
  const slack = new App({
    token: cfg.SlackBotToken,
    signingSecret: cfg.SlackSigningSecret,
    appToken: cfg.SlackAppToken,
    socketMode: true
  });

  slack.start();

  console.log(`Slack API listeining on socket.`);

  // Listen for vote button clicks and open a new modal asking for reason
  slack.action('vote', async ({ body, ack, say, client, logger }) => {
    let typed_body = <BlockAction>body;

    // Check if user is allowed
    if (cfg.SlackAllowedVoteUsers.indexOf(body.user.id) < 0) {
      await say({text: `User ${typed_body.user.name} is not allowed to vote proposals!`, thread_ts: typed_body.message.ts})
      await ack();
      return
    }

    // Get chain name and proposal id
    let [proposal_chain, proposal_id] = (<ButtonAction>typed_body.actions[0]).value.split("-")
    
    // Open modal
    try {
      let modal = await client.views.open({
        trigger_id: typed_body.trigger_id,
        view: {
          type: 'modal',
          private_metadata: JSON.stringify({proposal: {id: proposal_id, chain: proposal_chain}, ts: typed_body.message.ts}),
          // View identifier
          callback_id: 'vote_proposal',
          title: {
            type: 'plain_text',
            text: 'Vote Proposal'
          },
          blocks: [
            {
              type: "context",
              elements: [
                {
                  type: "plain_text",
                  text: `Chain: ${proposal_chain}`,
                  emoji: true
                },
                {
                  type: "plain_text",
                  text: `ID: ${proposal_id}`,
                  emoji: true
                }
              ]
            },
            {
              type: 'input',
              block_id: 'input_memo',
              label: {
                type: 'plain_text',
                text: `Write the reason of your vote on ${proposal_chain} proposal #${proposal_id}`
              },
              element: {
                type: 'plain_text_input',
                action_id: 'memo_action',
                multiline: false
              }
            },
            {
              type: "input",
              block_id: 'input_vote',
              element: {
                type: "static_select",
                placeholder: {
                  type: "plain_text",
                  text: "Select a vote option",
                  emoji: true
                },
                options: [
                  {
                    text: {
                      type: "plain_text",
                      text: "YES 👍",
                      emoji: true
                    },
                    value: "yes"
                  },
                  {
                    text: {
                      type: "plain_text",
                      text: "No ❌",
                    },
                    value: "no"
                  },
                  {
                    text: {
                      type: "plain_text",
                      text: "Abstian 🤷",
                      emoji: true
                    },
                    value: "abstain"
                  },
                  {
                    text: {
                      type: "plain_text",
                      text: "Veto 🚨",
                      emoji: true
                    },
                    value: "veto"
                  }
                ],
                action_id: "vote_action"
              },
              label: {
                type: "plain_text",
                text: "How do you want to vote?",
                emoji: true
              }
            },
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: `Make sure to read the full proposal before voting!\n ↗️ <https://mintscan.io/${proposal_chain}/proposals/${proposal_id}|Proposal Details>`,
                },
              ],
            }
          ],
          submit: {
            type: 'plain_text',
            text: 'Vote Now',
          }
        }
      })

      logger.info(modal);


    } catch (error) {
      logger.error(error);
    }

    // Acknowledge action request
    await ack();
  });

  // Listen for view submit, broadcast vote transaction with memo
  slack.view('vote_proposal', async ({ ack, body, view, client, logger }) => {

    // unpack meta
    let {proposal, ts} = JSON.parse(view.private_metadata);

    // Get vote option & memo
    const memo = view.state.values['input_memo']['memo_action'].value;
    const vote_option = view.state.values['input_vote']['vote_action'].selected_option.value;

    logger.info(memo)
    logger.info(vote_option)

    // Acknowledge the view_submission request
    await ack();
    
    // Vote Proposal
    const propRepo = AppDataSource.getRepository(Proposal);
    const propDb = await propRepo.findOneBy({id: proposal.id});

    voteProposal(propDb, {vote_option: voteInputToOption(vote_option), memo}).then(async (tx) => {
      // send message in thread
      await client.chat.postMessage({ text: `✅ Voted ${vote_option} on ${proposal.chain} proposal #${proposal.id}! Tx hash: ${tx.transactionHash}`, thread_ts: ts, channel: cfg.SlackChannelID })
    }).catch(async (error) => {
      logger.error(error)
      await client.chat.postMessage({ text: `⚠ Error voting ${vote_option} on ${proposal.chain} proposal #${proposal.id}! ${error}`, thread_ts: ts, channel: cfg.SlackChannelID })
    });

  });
};

export const SendSlackNotification = async (proposal: Proposal) => {
  const voting_end = new Date(proposal.voting_end);

  // Summirize description
  const summuray = await summarizeProposalDescription(proposal);

  const msg = {
    channel: cfg.SlackChannelID,
    text: `[${proposal.chain_id}] #${proposal.id}: ${proposal.title}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `[${proposal.chain_id}] #${proposal.id}: ${proposal.title}`,
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Chain:* ${proposal.chain_id}`,
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
            value: `${proposal.chain_id}-${proposal.id}`,
            action_id: 'vote'
          }
        ],
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `↗️ <https://mintscan.io/${proposal.chain_id}/proposals/${proposal.id}|Proposal Details>`,
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
}