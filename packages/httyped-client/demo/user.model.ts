import { Address } from './address.model';
import { Company } from './compoany.model.';

export class User {
  id!: number;
  name!: string;
  username!: string;
  email!: string;
  address!: Address;

  phone!: string;
  website!: string;
  company!: Company;
}
