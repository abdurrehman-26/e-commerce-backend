import { v4 as uuidv4 } from "uuid";
import { Order } from "../models/order.model.js"; // Adjust path as needed

export const generateConfirmationToken = async () => {
  let token
  let exists

  do {
    token = uuidv4();
    exists = await Order.exists({ confirmationToken: token });
  } while (exists);

  return token;
};
