import fastify from "fastify";
import dailyCounterTask from "../modules/daily-counter/daily-counter.task";

const app = fastify();

app.get("/run-daily-task", async () => {
  await dailyCounterTask.sendDailyMessage();

  return {
    ok: true,
  };
});

export function initWebApi() {
  app.listen({
    port: 3555,
  });
}
