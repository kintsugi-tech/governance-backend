import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Proposal } from './Proposal';

@Entity()
export class Vote {
  @PrimaryColumn({ comment: 'Proposal ID from onchain' })
  proposal_id: number;

  @PrimaryColumn({ comment: 'Chain name or id like: (juno-1, cosmoshub-4)' })
  chain_id: string;

  @PrimaryColumn({ comment: 'Voter address' })
  address: string;

  @Column({ type: 'text', comment: 'Vote option' })
  option: string;

  @Column({ comment: 'Vote transaction hash' })
  transaction_hash: string;

  @Column({ comment: 'Vote block height' })
  block_height: number;

  @Column({ comment: 'Rationale', nullable: true })
  rationale: string;

  @Column({ comment: 'Rationale Link', nullable: true })
  rationale_link: string;

  @Column({ comment: 'Vote date' })
  date: Date;

  @ManyToOne(() => Proposal, (prop) => prop.votes, { eager: true })
  @JoinColumn([
    { name: 'chain_id', referencedColumnName: 'chain_id' },
    { name: 'proposal_id', referencedColumnName: 'id' },
  ])
  proposal: Proposal;
}
