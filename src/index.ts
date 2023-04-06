import { AppDataSource, populateDB } from './data-source';
import 'reflect-metadata';
import { setupApi } from './api';
import * as cron from "node-cron";
import { cfg } from "./constants";
import { setupSlack } from './slack';

AppDataSource.initialize()
  .then(async () => {
    // Scan proposals every 5 minutes
    console.log(cfg.ProposalScanFrequency)
    cron.schedule(cfg.ProposalScanFrequency, async () => {
      console.log("ziocan")
      populateDB();
    });
    
    // Setup Governance API (Default port 3031)
    setupApi()

    // Setup Slack API (Default port 3000)
    setupSlack();


  })
  .catch((error) => {
    console.error(error);
  });
