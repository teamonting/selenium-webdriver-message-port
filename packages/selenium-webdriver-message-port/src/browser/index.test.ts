import '@happy-dom/global-registrator/register.js';
import { GlobalRegistrator } from '@happy-dom/global-registrator';

import './index.ts';

await GlobalRegistrator.unregister();
