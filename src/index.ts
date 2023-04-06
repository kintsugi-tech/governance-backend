import { AppDataSource, populateDB } from './data-source';
import 'reflect-metadata';
import { setupApi } from './api';
import * as cron from "node-cron";
import { cfg } from "./config";

AppDataSource.initialize()
  .then(async () => {
    setupApi();

    // Scan proposals every 5 minutes
    cron.schedule(cfg.ProposalScanFrequency, async () => {
      populateDB();
    });

  })
  .catch((error) => {
    console.error(error);
  });
