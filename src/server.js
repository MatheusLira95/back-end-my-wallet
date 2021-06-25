import app from "./app.js";
import connection from "../src/database.js";

app.listen(4000, () => {
  console.log("Server running in 4000");
});
