import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Proposal } from './entity/Proposal';
import { Vote } from './entity/Vote';
import { CHAINS } from './constants';
import { getAllProposals } from './cosmos-client';
import { SendSlackNotification } from './slack';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'postgres',
  synchronize: true,
  logging: false,
  entities: [Proposal, Vote],
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
        SendSlackNotification(prop)
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
