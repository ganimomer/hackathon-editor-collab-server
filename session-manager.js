const sessions = new Map()
const users = new Map()

module.exports = {

  join(id, data) {
    users.set(id, data.userId)
    const session = sessions.get(data.siteId)
    if (session) {
      session.viewing.push(id)
      console.log(`${data.userId} has joined site ${data.siteId}`)
    } else {
      sessions.set(data.siteId, {
        editing: id,
        viewing: []
      })
      console.log(`${data.userId} has started a session for site ${data.siteId}`)
    }
  },

  getUser: id => users.get(id),

  leaveRoom(id, room) {
    const session = sessions.get(room)
    const editor = users.get(session.editing)
    const userId = users.get(id)
    if (userId === editor) {
      const newEditorSocket = session.viewing.shift()
      if (newEditorSocket) {
        session.editing = newEditorSocket
        const newEditor = users.get(newEditorSocket)
        console.log(`${userId} was king but now ${newEditor} was crowned`)
        return newEditor
      } else {
        sessions.delete(room)
        console.log(`${userId} was king but now the kingdom is gone`)
      }
    } else {
      session.viewing.splice(session.viewing.indexOf(id), 1)
      return editor
    }
  }
}
