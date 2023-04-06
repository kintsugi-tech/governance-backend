import { AppDataSource } from './data-source';
import 'reflect-metadata';
import { setupApi } from './api';

AppDataSource.initialize()
  .then(async () => {
    setupApi();
  })
  .catch((error) => {
    console.error(error);
  });
