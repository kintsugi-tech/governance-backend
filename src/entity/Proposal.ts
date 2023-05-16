import { Entity, PrimaryColumn, Column, OneToMany, JoinColumn, ManyToOne } from 'typeorm';
import { Vote } from './Vote';
import { Chain } from './Chain';

@Entity()
export class Proposal {
  @PrimaryColumn({ comment: 'Proposal ID from onchain' })
  id: number;

  @PrimaryColumn({ comment: 'Chain name or id like: (juno-1, cosmoshub-4)' })
  chain_id: string;

  @Column({ comment: 'Title of the proposal, from onchain' })
  title: string;

  @Column({ type: 'text', comment: 'Description of the proposal, usually Markdown' })
  description: string;

  @Column({ comment: 'Voting start date, UTC' })
  voting_start: Date;

  @Column({ comment: 'Voting end date, UTC' })
  voting_end: Date;

  @Column({ comment: 'Governance module proposal type' })
  type: string;

  @Column({ type: 'json', comment: 'Other variable meta-data, JSON encoded' })
  meta: string;

  @OneToMany(() => Vote, (vote) => vote.proposal)
  @JoinColumn([
    { name: 'chain_id', referencedColumnName: 'chain_id' },
    { name: 'id', referencedColumnName: 'proposal_id' },
  ])
  votes: Vote[];

  @ManyToOne(() => Chain, (chain) => chain.proposals, { eager: true })
  @JoinColumn([{ name: 'chain_id', referencedColumnName: 'name' }])
  chain: Chain;
}
