module.exports = {
    SITE: i => 'site' + i,
    SOCKET: i => 'socket' + i,
    PARTICIPANT_INFO: i => ({
        userId: `user${i}@email.com`
    }),
};
