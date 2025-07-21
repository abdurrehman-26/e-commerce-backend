import { Counter } from "../models/counter.model.js";

export const getNextOrderNumber = async () => {
  const counterexists = await Counter.find({name: "order"})
  if (counterexists.length === 0) {
    await Counter.create({
      name: "order",
      value: 1000
    })
  }
  const counter = await Counter.findOneAndUpdate(
      { name: "order" },
      {
        $inc: { value: 1 },
      },
      { 
        new: true,
      }
  );

  return counter.value;
};
