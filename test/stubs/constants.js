const SITE = i => 'site' + i;
const SOCKET = i => 'socket' + i;
const PARTICIPANT_INFO = i => ({
    userId: `user${i}@email.com`
});

const SNAPSHOT = (i, p) => ({
    siteId: SITE(i),
    presenterId: SOCKET(i),
    bla: 'bla',
});

module.exports = {
    SITE,
    SOCKET,
    PARTICIPANT_INFO,
    SNAPSHOT,
};
