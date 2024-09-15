export class Address {
  street!: string;
  suite!: string;
  city!: string;
  zipcode!: string;

  print() {
    return `${this.street}, ${this.suite}, ${this.zipcode} ${this.city}`;
  }
}
