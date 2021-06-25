import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import { v4 as uuid } from "uuid";
import joi from "joi";
import connection from "./database.js";
import dayjs from "dayjs";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/test", (req, res) => {
  res.sendStatus(200);
});

app.post("/sign-up", async (req, res) => {
  try {
    const { name, email, password, confirmPass } = req.body;
    const registerSchema = joi.object({
      name: joi.string().min(3).required(),
      email: joi.string(),
      password: joi.string().required(),
      confirmPass: joi.ref("password"),
    });
    registerSchema.validate({ name, email, password, confirmPass });
    const hashPass = bcrypt.hashSync(password, 10);
    const alreadyInUse = await connection.query(
      `
      SELECT * FROM users
      WHERE name = $1
      OR email = $2
      `,
      [name, email]
    );
    if (alreadyInUse.rows[0]) {
      return res.sendStatus(401);
    }
    const resp = await connection.query(
      `
      INSERT INTO users
      (name, email, password)
      VALUES ($1, $2, $3)
      `,
      [name, email, hashPass]
    );
    res.sendStatus(201);
  } catch (e) {
    res.sendStatus(500);
  }
});

app.post("/sign-in", async (req, res) => {
  try {
    const { email, password } = req.body;
    const loginSchema = joi.object({
      email: joi.string().email().required(),
      password: joi.string().required(),
    });
    loginSchema.validate({ email, password });

    const result = await connection.query(
      `
    SELECT * FROM users
    WHERE email = $1
    `,
      [email]
    );
    const user = result.rows[0];
    if (user && bcrypt.compareSync(password, user.password)) {
      delete user.password;
      const token = uuid();
      await connection.query(
        `
      INSERT INTO sessions (token, "userId")
      VALUES ($1, $2)
      `,
        [token, user.id]
      );
      res.status(200).send({ token, user });
    } else {
      res.sendStatus(401);
    }
  } catch (e) {
    res.sendStatus(500);
  }
});

app.post("/transactions/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const authorization = req.header("authorization");
    const token = authorization?.replace("Bearer ", "");
    const { name, type, value } = req.body;
    const date = `${dayjs().format("DD/MM")}`;

    const result = await connection.query(
      `
      SELECT * FROM sessions
      WHERE token = $1
    `,
      [token]
    );
    if (result.rows.length === 0) {
      return res.sendStatus(401);
    }
    await connection.query(
      `
       INSERT INTO transactions (name, type, value, date, "userId")
       VALUES ($1, $2, $3, $4, $5)
       `,
      [name, type, value, date, id]
    );
    res.sendStatus(201);
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});
app.get("/transactions/:id", async (req, res) => {
  const userId = parseInt(req.params.id);
  const authorization = req.header("authorization");
  const token = authorization?.replace("Bearer ", "");

  const result = await connection.query(
    `
    SELECT transactions.* FROM transactions
    JOIN sessions
    ON transactions."userId" = sessions."userId"
    WHERE transactions."userId" = $1 AND sessions.token = $2
  `,
    [userId, token]
  );
  res.send(result.rows);
});

export default app;
