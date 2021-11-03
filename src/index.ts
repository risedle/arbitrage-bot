import cron from "node-cron";

cron.schedule("* * * * * *", () => {
    console.log("[arbitrage] Run");
});
