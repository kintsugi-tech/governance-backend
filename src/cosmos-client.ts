import axios from 'axios';
import { Proposal } from './entity/Proposal';
import { bech32 } from 'bech32';
import { AppDataSource } from './data-source';
import { Chain } from './entity/Chain';
import { VoteOption } from 'cosmjs-types/cosmos/gov/v1beta1/gov';

// Return an array of all cosmos addresses by passing one of any chain
export const getAllAddresses = async (address: string) => {
  const decoded = bech32.decode(address);

  const chainRepo = AppDataSource.getRepository(Chain);
  const chains = await chainRepo.find();

  const addresses = [];
  for (const chain of chains) {
    if (decoded.prefix !== chain.prefix) {
      addresses.push(bech32.encode(chain.prefix, decoded.words));
    } else {
      addresses.push(chain.voter_address);
    }
  }

  return addresses;
};

export const parseSDK45Proposals = async (chain: Chain) => {
  try {
    console.log(`Fetching proposals for ${chain.name}..`);

    // GET only voting period proposals
    const res = await axios.get(
      `https://rest.cosmos.directory/${chain.name}/cosmos/gov/v1beta1/proposals?proposal_status=2&pagination.limit=5000`,
    );

    const proposals = [];

    for (const prop of res.data.proposals) {
      const proposal = new Proposal();
      proposal.id = prop.proposal_id;
      proposal.voting_start = prop.voting_start_time;
      proposal.voting_end = prop.voting_end_time;
      proposal.meta = '{}';

      proposal.type = prop.content['@type'];
      proposal.title = prop.content.title;
      proposal.description = prop.content.description;

      proposals.push(proposal);
    }

    return proposals;
  } catch (error) {
    console.error(`Failed to fetch proposals for chain: ${chain.name} with SDK 45`, error);
    return [];
  }
}

export const parseSDK46Proposals = async (chain: Chain) => {
  try {
    console.log(`Fetching proposals for ${chain.name}..`);

    // GET only voting period proposals
    const res = await axios.get(
      `https://rest.cosmos.directory/${chain.name}/cosmos/gov/v1/proposals?proposal_status=2&pagination.limit=5000`,
    );

    const proposals = [];

    for (const prop of res.data.proposals) {

      // Parse meta data
      const meta = JSON.parse(prop.metadata);

      const proposal = new Proposal();
      proposal.id = prop.id;
      proposal.voting_start = prop.voting_start_time;
      proposal.voting_end = prop.voting_end_time;
      proposal.meta = '{}';

      proposal.type = "";
      proposal.title = meta.title;
      proposal.description = meta.summary;

      proposals.push(proposal);
    }

    return proposals;
  } catch (error) {
    console.error(`Failed to fetch proposals for chain: ${chain.name} with SDK 46`, error);
    return [];
  }
}

export const parseSDK47Proposals = async (chain: Chain) => {
  try {
    console.log(`Fetching proposals for ${chain.name}..`);

    // GET only voting period proposals
    const res = await axios.get(
      `https://rest.cosmos.directory/${chain.name}/cosmos/gov/v1/proposals?proposal_status=2&pagination.limit=5000`,
    );

    const proposals = [];

    for (const prop of res.data.proposals) {

      const proposal = new Proposal();
      proposal.id = prop.id;
      proposal.voting_start = prop.voting_start_time;
      proposal.voting_end = prop.voting_end_time;
      proposal.meta = '{}';

      proposal.type = "";
      proposal.title = prop.title;
      proposal.description = prop.summary;

      proposals.push(proposal);
    }

    return proposals;
  } catch (error) {
    console.error(`Failed to fetch proposals for chain: ${chain.name} with SDK 47`, error);
    return [];
  }
}

export const getAllProposals = async (chain: Chain) => {
  try {
    switch (chain.sdk_version) {
      case "v47":
        return await parseSDK47Proposals(chain);
      case "v46":
        return await parseSDK46Proposals(chain);
      case "v45":
      default:
        return await parseSDK45Proposals(chain);
    }
  } catch (error) {
    console.error(`Failed to fetch proposals for chain: ${chain.name}`, error);
    return [];
  }

  return;
};

export const getTxInfo = async (chain_name: string, tx_hash: string) => {
  try {
    // fetch tx
    const res = await axios.get(`https://rest.cosmos.directory/${chain_name}/cosmos/tx/v1beta1/txs/${tx_hash}`);

    if (res.data.tx_response.height === undefined) {
      throw Error('Not found');
    }
    return res.data;
  } catch (error) {
    console.error(`Failed to fetch transaction for chain: ${chain_name}`, error);
    return null;
  }

  return;
};

export const getProposalVoteFromLog = (rawlog: string, chain_name: string) => {
  // Parse log
  const [log] = JSON.parse(rawlog);

  // find proposal_vote event
  const vote_event = log.events.find((e) => e.type === 'proposal_vote');

  // get option
  const option_attr = vote_event.attributes.find((e) => e.key === 'option');

  let option = null;
  let weight = null;

  // Temp fix for mars (sdk 46). Ref: https://github.com/cosmos/cosmos-sdk/issues/16230
  if (chain_name === "mars") {

    let attr = option_attr.value.split(" ")[0].split(":")[1]
    option = VoteOption[attr];
    weight = "1.0";
  } else {
    // parse value
    const attr = JSON.parse(option_attr.value);

    option = attr.option;
    weight = attr.weight;
  }

  // get proposal_id
  const proposal_id_attr = vote_event.attributes.find((e) => e.key === 'proposal_id');
  const id = parseInt(proposal_id_attr.value);

  // find message event
  const message_event = log.events.find((e) => e.type === 'message');

  // Get voter address
  const sender = message_event.attributes.find((e) => e.key === 'sender');

  return {
    id,
    option,
    weight,
    voter: sender.value,
  };
};
