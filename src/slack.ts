import { cfg } from "./constants"
import { WebClient, LogLevel } from "@slack/web-api";
import { Proposal } from "entity/Proposal";
import { App } from "@slack/bolt";

export const setupSlack = () => {

    // Setup slack bot
    const slack = new App({
        token: cfg.SlackBotToken,
        signingSecret: cfg.SlackSigningSecret
    });

    slack.start(cfg.SlackAPIPort)

    console.log(`Slack API listeining on port ${cfg.SlackAPIPort}.`)
}

export const SendSlackNotification = async (proposal: Proposal) => {

    const voting_end = new Date(proposal.voting_end)

    let msg = {
        "channel": cfg.SlackChannelID,
        "text": `[${proposal.chain_id}] #${proposal.id}: ${proposal.title}`,
        "blocks": [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": `[${proposal.chain_id}] #${proposal.id}: ${proposal.title}`,
                    "emoji": true
                }
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": `*Chain:* ${proposal.chain_id}`
                    },
                    {
                        "type": "mrkdwn",
                        "text": `*Expiring:* ${voting_end.toLocaleDateString()} ${voting_end.toLocaleTimeString()}`
                    }
                ]
            },
            {
                "type": "section",
                "text": {
                    "type": "plain_text",
                    "text": `${proposal.description}`,
                    "emoji": true
                }
            },
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "emoji": true,
                            "text": "👍 Yes"
                        },
                        "value": "yes"
                    },
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "emoji": true,
                            "text": "👎 No"
                        },
                        "value": "no"
                    },
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "emoji": true,
                            "text": "🤷 Abstain"
                        },
                        "value": "abstain"
                    },
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "emoji": true,
                            "text": "🚨 Veto"
                        },
                        "style": "danger",
                        "value": "veto"
                    }
                ]
            },
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": `↗️ <https://mintscan.io/${proposal.chain_id}/proposals/${proposal.id}|Proposal Details>`
                    }
                ]
            }
        ]
    }

    const client = new WebClient(cfg.SlackBotToken, {
        // LogLevel can be imported and used to make debugging simpler
        logLevel: LogLevel.DEBUG
      });


    try {
        // Call the chat.postMessage method using the WebClient
        const result = await client.chat.postMessage(msg);
        return result
    }
    catch (error) {
        throw error;
    }
}