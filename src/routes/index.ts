import { Router } from 'express';
import { APP_NAME, APP_VERSION } from '../config/constants';
import { ok } from '../utils/response';
import { authRouter } from '../modules/auth/auth.routes';
import { catalogRouter } from '../modules/catalog/catalog.routes';
import { verificationRouter } from '../modules/verification/verification.routes';
import { uploadRouter } from '../modules/upload/upload.routes';
import { postsRouter } from '../modules/posts/post.routes';
import { commentsRouter } from '../modules/comments/comment.routes';
import { usersRouter, chatRouter } from '../modules/chat/chat.routes';

export const apiRouter = Router();

apiRouter.get('/', (_req, res) => {
    ok(res, { name: APP_NAME, version: APP_VERSION });
});
apiRouter.use('/auth', authRouter);
apiRouter.use(catalogRouter);
apiRouter.use(verificationRouter);
apiRouter.use(uploadRouter);  // M4
apiRouter.use(postsRouter);    // M5
apiRouter.use(commentsRouter); // M5
apiRouter.use(usersRouter);    // M6
apiRouter.use(chatRouter);     

// Modules are mounted here, one milestone at a time:
// M1 auth      -> apiRouter.use('/auth', authRouter)
// M2 catalogs  -> apiRouter.use(catalogsRouter)
// M3 verify    -> apiRouter.use('/verification', verificationRouter)
// M4 upload    -> apiRouter.use(uploadRouter)                          ✅ done
// M5 posts     -> apiRouter.use(postsRouter), apiRouter.use(commentsRouter) ✅ done
// M6 chat      -> apiRouter.use(usersRouter), apiRouter.use(chatRouter)     ✅ done
// M7 admin     -> apiRouter.use('/admin', adminRouter)