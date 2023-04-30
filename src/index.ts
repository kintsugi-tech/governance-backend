import { AppDataSource, populateDB, processIndexingQueue } from './data-source';
import 'reflect-metadata';
import { setupApi } from './api';
import * as cron from 'node-cron';
import { cfg } from './constants';
import { setupSlack } from './slack';

AppDataSource.initialize()
  .then(async () => {
    // Scan proposals every x minutes
    cron.schedule(cfg.ProposalScanFrequency, async () => {
      // Scan proposals
      populateDB();

      // Process indexing queue
      processIndexingQueue();
    });

    // Setup Governance API (Default port 3031)
    setupApi();

    // Setup Slack API (Default port 3000)
    setupSlack();
  })
  .catch((error) => {
    console.error(error);
  });
