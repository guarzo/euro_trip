// Module entry point — the only script the layout loads.
import { initUI } from './ui.js';
import { initIdentity } from './identity.js';
import { initInterests } from './interests.js';
import { initComments } from './comments.js';

initUI();
initIdentity();
initInterests();
initComments();
