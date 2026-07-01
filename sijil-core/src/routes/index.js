import { Router } from 'express';
import ingestRoutes from './ingest.routes.js';
import documentRoutes from './document.routes.js';
import topicRoutes from './topic.routes.js';
import exportRoutes from './export.routes.js';
import utilityRoutes from './utility.routes.js';
import searchRoutes from './search.routes.js';
import seoRoutes from './seo.routes.js';
import adminRoutes from './admin.routes.js';
import quranRoutes from './quran.routes.js';

const apiRouter = Router();

apiRouter.use(ingestRoutes);
apiRouter.use(documentRoutes);
apiRouter.use(topicRoutes);
apiRouter.use(exportRoutes);
apiRouter.use(utilityRoutes);
apiRouter.use(searchRoutes);
apiRouter.use(seoRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/quran', quranRoutes);

export default apiRouter;