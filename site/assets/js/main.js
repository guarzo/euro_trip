// Module entry point — the only script the layout loads.
import { initUI } from './ui.js';
import { initAuth } from './auth.js';
import { initInterests } from './interests.js';
import { initComments } from './comments.js';

initUI();
// Awaited, unlike the others: initInterests() and initComments() both read the
// roster and the current user, which do not exist until this resolves.
// .catch() still calls them on failure — they have their own isConfigured()/
// failure handling and must run to render those states rather than never
// running at all.
initAuth().then(function () {
  initInterests();
  initComments();
}).catch(function () {
  initInterests();
  initComments();
});
