import { INotification, Notification, NotificationType } from '../models/notification.model';
import { newId } from '../utils/id';
import { emitToUser } from '../sockets';

export function toNotificationDto(n: INotification) {
    return {
        id: n.id,
        type: n.type,
        message: n.message,
        actorName: n.actorName,
        postId: n.postId,
        commentId: n.commentId,
        isRead: n.isRead,
        createdAt: n.createdAt,
    };
}

/** Notification save panni, user online na live ah socket la anuppum. Fail aanaalum main request ah break pannaadhu. */
export async function notify(
    userId: string,
    input: { type: NotificationType; message: string; actorName?: string; postId?: string; commentId?: string },
): Promise<void> {
    try {
        const n = await Notification.create({ id: newId('ntf'), userId, ...input });
        emitToUser(userId, 'notification', toNotificationDto(n));
    } catch (err) {
        console.error('notify failed:', (err as Error).message);
    }
}

export async function list(userId: string, page: number, limit: number) {
    const [items, total, unreadCount] = await Promise.all([
        Notification.find({ userId }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
        Notification.countDocuments({ userId }),
        Notification.countDocuments({ userId, isRead: false }),
    ]);
    return { notifications: items.map(toNotificationDto), unreadCount, page, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

/** ids kudutha adhai mattum, illa na ellathaiyum read nu mark pannum. */
export async function markRead(userId: string, ids?: string[]) {
    const filter: Record<string, unknown> = { userId, isRead: false };
    if (ids && ids.length) filter.id = { $in: ids };
    const res = await Notification.updateMany(filter, { $set: { isRead: true } });
    return { updated: res.modifiedCount, unreadCount: await Notification.countDocuments({ userId, isRead: false }) };
}