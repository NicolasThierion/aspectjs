import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from '../../../../../node_modules/typeorm'; // disambiguish with /typeorm/index.ts;
import { User } from './user.entity';

@Entity()
export class Post {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  content?: string = 'Hello';

  @ManyToOne(() => User, (user) => user.posts)
  user?: User;
}
