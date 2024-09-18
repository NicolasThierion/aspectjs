import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
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
