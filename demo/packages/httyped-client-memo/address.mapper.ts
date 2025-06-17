import { Mapper } from "httyped-client";
import { Address } from "./common/models/address.model";

export const ADDRESS_MAPPER: Mapper = {
  typeHint: Address,
  map: (obj: any) => {
    return Object.setPrototypeOf(obj, Address.prototype);
  },
};
