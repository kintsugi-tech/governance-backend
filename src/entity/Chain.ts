import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Chain {
  @PrimaryColumn({ comment: 'Chain Name' })
  name: string;

  @Column({ comment: 'Chain id' })
  id: string;

  @Column({ comment: 'Bech32 Prefix' })
  prefix: string;

  @Column({ comment: 'Address allowed to vote' })
  voter_address: string;

  @Column({ comment: 'Gas price to use in transactions' })
  gas_prices: string;

  @Column({ type: 'json', comment: 'RPCs' })
  rpcs: JSON;

  @Column({ comment: 'Explorer URL', default: "" })
  explorer_url: string;
}
