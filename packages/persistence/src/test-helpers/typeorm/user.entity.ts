import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Post } from './post.entity';

@Entity({
  name: 'user_',
})
export class User {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ unique: true })
  username?: string = 'JohnDoe';

  @Column()
  firstname?: string = 'John';

  @Column()
  lastname?: string = 'Doe';

  @OneToMany(() => Post, (post) => post.user)
  posts?: Post[];
}
