import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('accounts')
export default class Account {
  @PrimaryGeneratedColumn('increment', { name: 'account_id' })
  _id: number;

  @Column()
  instaid: number;

  @Column()
  fbid: number;

  @Column()
  account_user: string;

  @Column({ select: false })
  account_name: string;

  @Column()
  status: number;

  @UpdateDateColumn()
  updated_at: Date;

  @CreateDateColumn()
  created_at: Date;
}
