import { Router } from 'express';
import { APP_NAME, APP_VERSION } from '../config/constants';
import { ok } from '../utils/response';
import { authRouter } from '../modules/auth/auth.routes';

export const apiRouter = Router();

apiRouter.get('/', (_req, res) => {
    ok(res, { name: APP_NAME, version: APP_VERSION });
});
apiRouter.use('/auth', authRouter);


// Modules are mounted here, one milestone at a time:
// M1 auth      -> apiRouter.use('/auth', authRouter)
// M2 catalogs  -> apiRouter.use(catalogsRouter)
// M3 verify    -> apiRouter.use('/verification', verificationRouter)
// M4 upload    -> apiRouter.use('/upload', uploadRouter)
// M5 posts     -> apiRouter.use('/posts', postsRouter), apiRouter.use('/comments', commentsRouter)
// M6 chat      -> apiRouter.use('/users', expertsRouter), apiRouter.use('/chats', chatRouter)
// M7 admin     -> apiRouter.use('/admin', adminRouter)