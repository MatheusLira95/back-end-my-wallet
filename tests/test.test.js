import supertest from "supertest";
import app from "../src/app.js";

describe("GET /test", () => {
  it("returns status 200 for valid params", async () => {
    const result = await supertest(app).get("/test");
    expect(result.status).toEqual(200);
  });
});
