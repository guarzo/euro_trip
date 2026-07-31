// Module entry point — the only script the layout loads.
import { initUI } from './ui.js';
import { initAuth } from './auth.js';
import { initInterests } from './interests.js';
import { initComments } from './comments.js';

initUI();
// Awaited, unlike the others: initInterests() and initComments() both read the
// roster and the current user, which do not exist until this resolves.
initAuth().then(function () {
  initInterests();
  initComments();
});
