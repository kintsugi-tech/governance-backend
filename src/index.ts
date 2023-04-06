import { AppDataSource, populateDB } from './data-source';
import 'reflect-metadata';
import { setupApi } from './api';
import * as cron from "node-cron";
import { cfg } from "./constants";
import { setupSlack } from './slack';

AppDataSource.initialize()
  .then(async () => {
    // Setup Governance API (Default port 3031)
    setupApi()

    // Setup Slack API (Default port 3000)
    setupSlack();

    // Scan proposals every 5 minutes
    cron.schedule(cfg.ProposalScanFrequency, async () => {
      populateDB();
    });
  })
  .catch((error) => {
    console.error(error);
  });
