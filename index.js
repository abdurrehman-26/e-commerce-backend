import "dotenv/config";
import { app } from "./app.js";
import connectdb from "./db/db.js";

connectdb();

const PORT = 8000

app.listen(PORT, () => {
  console.log(`E-commerce server listening on port ${PORT}`);
});
