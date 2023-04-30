import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Queue {
  @PrimaryColumn({ comment: 'Transaction hash to index' })
  hash: string;

  @Column({ comment: 'Chain name' })
  chain_name: string;

  @Column({ comment: 'Count of tries' })
  try_count: number;
}
