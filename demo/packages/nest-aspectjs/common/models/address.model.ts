export interface AddressInit {
  street: string;
  suite?: string;
  city: string;
  zipcode: string;
}

export class Address {
  street!: string;
  suite!: string;
  city!: string;
  zipcode!: string;

  constructor(address: AddressInit) {
    this.street = address.street;
    this.suite = address.suite;
    this.city = address.city;
    this.zipcode = address.zipcode;
  }
  print() {
    return `${this.street}, ${this.suite}, ${this.zipcode} ${this.city}`;
  }
}
