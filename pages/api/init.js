import { initDB } from "../../db";

export default async (_, res) => {
  await initDB();
  res.send("ok");
};
