import { ConversationModel } from '../models/conversation.model';
import { logger } from '../utils/logger';

let jobTimer: NodeJS.Timeout | null = null;

/**
 * Every 5 minutes: mark conversations completed when their last activity
 * is older than `windowHours` (default 24h, set by CONVERSATION_AUTO_COMPLETE_HOURS env).
 */
export function startAutoCompleteJob(windowHours: number) {
    const intervalMs = 5 * 60 * 1000; // run every 5 minutes

    async function run() {
        try {
            const cutoff = new Date(Date.now() - windowHours * 60 * 60 * 1000);
            const result = await ConversationModel.updateMany(
                { status: 'active', lastActivityAt: { $lt: cutoff } },
                { $set: { status: 'completed' } },
            );
            if (result.modifiedCount > 0) {
                logger.info('Auto-completed idle conversations', {
                    count: result.modifiedCount,
                    windowHours,
                });
            }
        } catch (err) {
            logger.error('Auto-complete job failed', {
                reason: err instanceof Error ? err.message : String(err),
            });
        }
    }

    // Run once immediately on startup, then on the interval
    void run();
    jobTimer = setInterval(() => void run(), intervalMs);
    jobTimer.unref(); // don't prevent process from exiting cleanly
    logger.info('Auto-complete job started', { windowHours, intervalMs });
}

export function stopAutoCompleteJob() {
    if (jobTimer) {
        clearInterval(jobTimer);
        jobTimer = null;
    }
}
