import axios from 'axios';
import { Proposal } from './entity/Proposal';
import { bech32 } from 'bech32';
import { AppDataSource } from './data-source';
import { Chain } from './entity/Chain';

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
    console.error(`Failed to fetch proposals for chain: ${chain.name}`, error);
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
    console.error(`Failed to fetch proposals for chain: ${chain.name}`, error);
    return [];
  }
}

export const getAllProposals = async (chain: Chain) => {
  try {
    switch (chain.sdk_version) {
      case "v47":
      case "v46":
        return await parseSDK47Proposals(chain);
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

export const getProposalVoteFromLog = (rawlog: string) => {
  // Parse log
  const [log] = JSON.parse(rawlog);

  // find proposal_vote event
  const vote_event = log.events.find((e) => e.type === 'proposal_vote');

  // get option
  const option_attr = vote_event.attributes.find((e) => e.key === 'option');
  // parse value
  const { option, weight } = JSON.parse(option_attr.value);

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
