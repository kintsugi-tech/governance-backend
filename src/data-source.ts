import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Proposal } from './entity/Proposal';
import { Vote } from './entity/Vote';
import { CHAINS } from './constants';
import { getAllProposals, getProposalVoteFromLog, getTxInfo } from './cosmos-client';
import { SendSlackNotification } from './slack';
import { Queue } from './entity/Queue';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'postgres',
  synchronize: true,
  logging: false,
  entities: [Proposal, Vote, Queue],
  migrations: [],
  subscribers: [],
});

export const populateDB = async () => {

  let newProps = 0;
  let totalProps = 0;

  // Chain names are coming from cosmos-directory https://cosmos.directory/
  for (const chain of CHAINS) {
    // Query governance proposals of interested chains and save to database
    const proposals = await getAllProposals(chain.name);

    // Insert into database
    for (const prop of proposals) {
      prop.chain_id = chain.name;
      totalProps++;

      try {
        await AppDataSource.manager.save(prop);
        newProps++;

        // notificate new proposal
        SendSlackNotification(prop);
      } catch (error) {
        // Log duplicate proposal
        if (error.code === '23505') {
          console.info(`Proposal with ID ${prop.id} and Chain ${chain.name} already in database`);
        }
      }
    }
  }

  return [totalProps, newProps];
};

export const indexTx = async (chain_name: string, hash: string) => {
  const tx_data = await getTxInfo(chain_name, hash);

  if (tx_data == null) {
    throw Error('Proposal not found');
  }

  const vote_data = getProposalVoteFromLog(tx_data.tx_response.raw_log);

  // Save vote
  const vote = new Vote();
  vote.proposal_id = vote_data.id;
  vote.chain_id = chain_name;
  vote.address = vote_data.voter;
  vote.option = vote_data.option;
  vote.transaction_hash = tx_data.tx_response.txhash;
  vote.block_height = tx_data.tx_response.height;
  vote.date = tx_data.tx_response.timestamp;
  vote.rationale = tx_data.tx.body.memo;

  await AppDataSource.manager.save(vote);

  return vote;
}

// Save transaction hash to index later in the database
export const addTxToIndexingQueue = async (chain_name: string, hash: string) => {

  const queue = new Queue();
  queue.chain_name = chain_name;
  queue.hash = hash;
  queue.try_count = 0;
  await AppDataSource.manager.save(queue);

  return queue;
} 

export const processIndexingQueue = async () => {
  let queueRepo = AppDataSource.getRepository(Queue);

  let queue = await queueRepo.find()

  // Loop queue
  for (const tx of queue) {

    // Try to index
    try {
      let vote = await indexTx(tx.chain_name, tx.hash);
      
      // Clear queue
      await AppDataSource.manager.delete(Queue, tx.hash);
      console.log(`Indexed vote with hash ${vote.transaction_hash} option: ${vote.option}`)

    } catch (e) {
      console.error(e)
      tx.try_count = tx.try_count+1;
      await AppDataSource.manager.save(tx);
    }
  }

  console.log("Processed all the queue.")
}