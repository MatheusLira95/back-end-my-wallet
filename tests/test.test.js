import supertest from "supertest";
import app from "../src/app.js";
import connection from "../src/database";

beforeEach(async () => {
  await connection.query(`DELETE FROM sessions`);
});

afterAll(() => {
  connection.end();
});

describe("POST /sign-in", () => {
  it("returns status 200 for already registered users", async () => {
    const body = {
      email: "mathin@gmail.com",
      password: "123456",
    };
    const result = await supertest(app).post("/sign-in").send(body);
    const status = result.status;
    expect(status).toEqual(200);
  });

  it("returns status 409 for a non-registered e-mail", async () => {
    const body = {
      email: "mathinnn@gmail.com",
      password: "123456",
    };
    const result = await supertest(app).post("/sign-in").send(body);
    const status = result.status;
    expect(status).toEqual(401);
  });

  it("returns status 409 for a wrong password for a registered e-mail", async () => {
    const body = {
      email: "mathin@gmail.com",
      password: "1234567",
    };
    const result = await supertest(app).post("/sign-in").send(body);
    const status = result.status;
    expect(status).toEqual(401);
  });

  it("returns user info after a login request", async () => {
    const body = {
      email: "mathin@gmail.com",
      password: "123456",
    };
    const expected = await connection.query(
      `
    SELECT * FROM users
    WHERE email = $1
    `,
      [body.email]
    );
    delete expected.rows[0].password;
    const resultJson = await supertest(app).post("/sign-in").send(body);
    const result = JSON.parse(resultJson.text);

    expect(expected.rows[0]).toEqual(result.user);
  });
});
