async function triggerEvent(event: ScheduledEvent) {
    // Fetch some data
    console.log("cron processed", event.scheduledTime);
}

/**
 * Cron entry point
 */
addEventListener("scheduled", (event: ScheduledEvent) => {
    event.waitUntil(triggerEvent(event));
});
