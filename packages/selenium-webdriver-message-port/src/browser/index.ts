import { ROOT_MESSAGE_PORT } from '../constant.ts';
import { createMessagePort } from './internal.ts';

const messagePort = createMessagePort(ROOT_MESSAGE_PORT);

export { messagePort };
