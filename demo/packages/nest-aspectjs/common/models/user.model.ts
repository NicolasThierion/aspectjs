import { Address } from './address.model';
import { Company } from './compoany.model.';
import { Post } from './post.model';

export class User {
  id!: number;
  name!: string;
  username!: string;
  email!: string;
  address!: Address;
  phone!: string;
  website?: string;
  company?: Company;
  posts?: Post[];

  constructor(user: User) {
    this.id = user.id;
    this.name = user.name;
    this.username = user.username;
    this.email = user.email;
    this.address = user.address;
    this.phone = user.phone;
    this.website = user.website;
    this.company = user.company;
    this.posts = user.posts;
  }
}
