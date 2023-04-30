import { GasPrice, SigningStargateClient } from "@cosmjs/stargate"
import { Proposal } from "./entity/Proposal"
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing"
import { CHAINS, cfg } from "./constants"
import { MsgExec } from "cosmjs-types/cosmos/authz/v1beta1/tx";
import { MsgVote } from "cosmjs-types/cosmos/gov/v1beta1/tx.js";
import { VoteOption } from "cosmjs-types/cosmos/gov/v1beta1/gov";

export interface VoteRequest {
    vote_option: VoteOption,
    memo: string
}

export const buildExecMessage = (grantee: string, messages: Array<any>) => {
    return {
      typeUrl: "/cosmos.authz.v1beta1.MsgExec",
      value: MsgExec.fromPartial({
        grantee: grantee,
        msgs: messages
      })
    }
  }

export const voteProposal = async (proposal: Proposal, request: VoteRequest) => {

    // Get chain info
    const chain_info = CHAINS.find((e) => e.name === proposal.chain_id);

    console.log(chain_info, proposal.chain_id)
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(cfg.VotingWalletMnemonic, {
        prefix: chain_info.prefix
    })

    const account = await wallet.getAccounts()

    const client = await SigningStargateClient.connectWithSigner(`https://rpc.cosmos.directory/${proposal.chain_id}`, wallet, {
        gasPrice: GasPrice.fromString(chain_info.gasPrice)
    })

    client.registry.register("/cosmos.authz.v1beta1.MsgExec", MsgExec);

    let message = {
        typeUrl: "/cosmos.gov.v1beta1.MsgVote",
        value: MsgVote.encode(MsgVote.fromPartial({
            proposalId: proposal.id,
            voter: chain_info.voter_address,
            option: request.vote_option
        })).finish()
    }

    return await client.signAndBroadcast(account[0].address, [buildExecMessage(account[0].address, [message])], "auto", request.memo);
}

