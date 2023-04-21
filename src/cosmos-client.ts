import axios from 'axios';
import { Proposal } from './entity/Proposal';
import { bech32 } from 'bech32';
import { CHAINS } from './constants';

// Return an array of all cosmos addresses by passing one of any chain
export const getAllAddresses = (address: string) => {
  const decoded = bech32.decode(address);

  let addresses = [];
  for (const chain of CHAINS) {
    addresses.push(bech32.encode(chain.prefix, decoded.words));
  }

  addresses = [...addresses, ...CHAINS.map((el) => el.voter_address)];
  return addresses;
};

export const getAllProposals = async (chain_name: string) => {
  try {

    console.log(`Fetching proposals for ${chain_name}..`)

    // GET only voting period proposals
    const res = await axios.get(`https://rest.cosmos.directory/${chain_name}/cosmos/gov/v1beta1/proposals?proposal_status=2&pagination.limit=5000`);

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
    console.error(`Failed to fetch proposals for chain: ${chain_name}`);
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
    console.error(`Failed to fetch transaction for chain: ${chain_name}`);
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
