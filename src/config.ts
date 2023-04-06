import * as dotenv from 'dotenv';

// Setup env
dotenv.config();

export const cfg = {
    ProposalScanFrequency: process.env.PROPOSAL_SCAN_FREQUENCY || "0 */5 * * *",
  
    ApiPort: process.env.API_PORT || 3031
}