import { Proposal } from './entity/Proposal';
import * as express from 'express';
import { AppDataSource, addTxToIndexingQueue, indexTx, populateDB } from './data-source';
import * as bp from 'body-parser';
import * as cors from 'cors';

import { CHAINS, cfg } from './constants';
import { Vote } from './entity/Vote';
import { Between, FindOptionsWhere, MoreThan } from 'typeorm';
import { getAllAddresses, getProposalVoteFromLog, getTxInfo } from './cosmos-client';
import { getMondayOfWeek } from './utils';
import { SendSlackNotification } from './slack';

export const setupApi = () => {
  const app = express();
  const port = cfg.ApiPort;

  app.use(bp.json());
  app.use(bp.urlencoded({ extended: true }));
  app.use(cors());

  app.get('/', async (req, res) => {
    res.json({
      success: true,
    });
  });

  // Get proposals
  app.get('/proposals', async (req, res) => {
    const propRepo = AppDataSource.getRepository(Proposal);

    const options: FindOptionsWhere<Proposal> = {};
    const proposals = await propRepo.findBy(options);

    let response = {};

    if (proposals === undefined) {
      response = {
        success: false,
        message: 'No proposals found',
      };
    } else {
      response = {
        success: true,
        data: proposals,
      };
    }

    res.json(response);
  });

  // Get active proposals
  app.get('/active_proposals', async (req, res) => {
    const propRepo = AppDataSource.getRepository(Proposal);
    const proposals = await propRepo.find({
      where: {
        voting_end: MoreThan(new Date()),
      },
      relations: ['votes'],
    });

    let response = {};

    if (proposals === undefined) {
      response = {
        success: false,
        message: 'No proposals found',
      };
    } else {
      response = {
        success: true,
        data: proposals,
      };
    }

    res.json(response);
  });

  // Get all proposals and votes from specific address
  app.get('/proposals/:address', async (req, res) => {
    const propRepo = AppDataSource.getRepository(Proposal);

    // Calculate all the other addresses
    const addresses = getAllAddresses(req.params.address);

    const proposals = await propRepo
      .createQueryBuilder('proposal')
      .leftJoinAndSelect('proposal.votes', 'votes', 'votes.address IN(:...address)', {
        address: addresses,
      })
      .orderBy('proposal.voting_end', 'DESC')
      .getMany();

    let response = {};

    if (proposals === undefined) {
      response = {
        success: false,
        message: 'No proposals found',
      };
    } else {
      response = {
        success: true,
        data: proposals,
      };
    }

    res.json(response);
  });

  // Get active proposals and votes from specific address
  app.get('/active_proposals/:address', async (req, res) => {
    const propRepo = AppDataSource.getRepository(Proposal);

    // Calculate all the other addresses
    const addresses = getAllAddresses(req.params.address);

    const proposals = await propRepo
      .createQueryBuilder('proposal')
      .leftJoinAndSelect('proposal.votes', 'votes', 'votes.address IN(:...address)', {
        address: addresses,
      })
      .where('proposal.voting_end > NOW()')
      .getMany();

    let response = {};

    if (proposals === undefined) {
      response = {
        success: false,
        message: 'No proposals found',
      };
    } else {
      response = {
        success: true,
        data: proposals,
      };
    }

    res.json(response);
  });

  // Get specific chain proposals
  app.get('/chain/:chain/proposals', async (req, res) => {
    const propRepo = AppDataSource.getRepository(Proposal);
    const proposals = await propRepo.findBy({
      chain_id: req.params.chain,
    });

    let response = {};

    if (proposals === undefined) {
      response = {
        success: false,
        message: 'No proposals found',
      };
    } else {
      response = {
        success: true,
        data: proposals,
      };
    }

    res.json(response);
  });

  app.get('/votes/:year/:week', async (req, res) => {
    const { year, week } = req.params;

    if (week == undefined || year == undefined) {
      res.json({ success: false, message: 'Missing params' });
      return;
    }

    // Get first monday of that week
    const monday = getMondayOfWeek(parseInt(year), parseInt(week));

    if (monday == null) {
      res.json({ success: false, message: 'Invalid week or year' });
      return;
    }

    // Get sunday
    const sunday = new Date(Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate() + 6, 23, 59, 59, 59));

    // Fetch votes
    const voteRepo = AppDataSource.getRepository(Vote);
    const votes = await voteRepo.findBy({
      date: Between(monday, sunday),
    });

    res.json({ monday, sunday, votes });
  });

  // Save vote
  app.post('/vote/:chain/:proposal_id', async (req, res) => {
    // Validate
    const { chain, proposal_id } = req.params;

    if (chain === undefined || proposal_id === undefined) {
      res.json({ success: false, message: 'Missing params' });
      return;
    }

    if (CHAINS.find((el) => el.name === chain) === undefined) {
      res.json({ success: false, message: 'Chain not found' });
      return;
    }

    // Check if proposal exists
    const propRepo = AppDataSource.getRepository(Proposal);
    const prop = await propRepo.findOneBy({ id: parseInt(proposal_id), chain_id: chain });

    if (prop === undefined || prop === null) {
      res.json({ success: false, message: 'Proposal not found' });
      return;
    }

    // Save vote in database
    const data = req.body;

    // Validate input
    if (
      data.proposal_id === undefined ||
      data.chain_id === undefined ||
      data.address === undefined ||
      data.option === undefined ||
      data.transaction_hash === undefined ||
      data.block_height === undefined ||
      data.date === undefined
    ) {
      res.json({ success: false, message: 'Missing params' });
      return;
    }

    // Save
    const vote = new Vote();
    vote.proposal_id = data.proposal_id;
    vote.chain_id = data.chain_id;
    vote.address = data.address;
    vote.option = data.option;
    vote.transaction_hash = data.transaction_hash;
    vote.block_height = data.block_height;
    vote.date = data.date;

    await AppDataSource.manager.save(vote);
    res.json(vote);
  });

  // Index txs
  app.put('/index_tx/:hash', async (req, res) => {
    const { hash } = req.params;

    if (hash === undefined) {
      res.json({ success: false, message: 'Missing params' });
      return;
    }

    // Fetch input data
    const data = req.body;

    // Check if chain id is defined
    if (data.chain_name !== undefined) {
      const chain = CHAINS.find((el) => el.name === data.chain_name);
      if (chain === undefined) {
        res.json({ success: false, message: 'Chain not found' });
        return;
      }

      try {
        let vote = await indexTx(data.chain_name, hash);
        res.json(vote);
      } catch (error) {
        console.log(error);

        // If tx fails because LCD is not responding, save hash somewhere so we can query later
        addTxToIndexingQueue(data.chain_name, hash).catch((e) => console.log(`Error adding to queue: ${e}`));

        res.json({ success: false, message: error });
      }
    } else {
      // TODO: try to guess chain id

      res.json({ success: false, message: 'Missing params' });
      return;
    }
  });

  app.get("/test", async (req, res) => {

    const propRepo = AppDataSource.getRepository(Proposal);
    const proposals = await propRepo.findOne({
      where: {
        chain_id: "juno",
        id: 280
      },
      relations: ['votes'],
    });

    let response = await SendSlackNotification(proposals)
    res.json(response)
  })

  app.listen(port, () => {
    console.log(`Governance API listening on port ${port}.`);
  });
  return app;
};
