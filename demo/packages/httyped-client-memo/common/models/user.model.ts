import { Address } from "./address.model";
import { Company } from "./compoany.model.";
import { Post } from "./post.model";

export class User {
  id!: number;
  name!: string;
  username!: string;
  email!: string;
  address!: Address;
  phone!: string;
  website!: string;
  company!: Company;
  posts?: Post[];

  sayHello() {
    return `hello ${this.name}!`;
  }
}
