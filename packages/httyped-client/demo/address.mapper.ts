import { Mapper } from '../src/types/mapper.type';
import { Address } from './address.model';

export const ADDRESS_MAPPER: Mapper = {
  typeHint: Address,
  map: (obj: any) => {
    return Object.setPrototypeOf(obj, Address.prototype);
  },
};
