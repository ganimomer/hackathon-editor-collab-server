/* strings */

const SITE = i => 'site' + i;
const SOCKET = i => 'socket' + i;
const EMAIL = i => `user${i}@email.com`;

/* objects */

const PARTICIPANT_DETAILS = i => ({
    id: SOCKET(i),
    email: EMAIL(i),
});

const SNAPSHOT = i => ({
    siteId: SITE(i),
    presenterId: SOCKET(i),
    bla: 'bla',
});

/* exports */

module.exports = {
    SITE,
    SOCKET,
    PARTICIPANT_DETAILS,
    SNAPSHOT,
};
