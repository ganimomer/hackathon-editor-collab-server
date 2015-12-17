const sessions = new Map()
const users = new Map()

module.exports = {

  getUser: id => users.get(id),

  getSiteEditor(siteId) {
    const session = sessions.get(siteId)
    return session && session.editing
  },

  addUser: (id, userId) => users.set(id, userId),

  join(data) {
    const user = data.userId || users.get(data.id)
    const session = sessions.get(data.siteId)
    if (session) {
      session.viewing.push(data.id)
      console.log(`${user}(${data.id}) has joined site ${data.siteId}`)
    } else {
      sessions.set(data.siteId, {
        editing: data.id,
        viewing: []
      })
      console.log(`${user}(${data.id}) has started a session for site ${data.siteId}`)
    }
  },

  leaveSite(id, siteId) {
    const session = sessions.get(siteId)
    const editor = users.get(session.editing)
    const userId = users.get(id)
    if (userId === editor) {
      const newEditorId = session.viewing.shift()
      if (newEditorId) {
        session.editing = newEditorId
        const newEditor = users.get(newEditorId)
        console.log(`${userId} was king but now ${newEditor} was crowned`)
        return newEditor
      } else {
        sessions.delete(siteId)
        console.log(`${userId} was king but now the kingdom is gone`)
      }
    } else {
      session.viewing.splice(session.viewing.indexOf(id), 1)
      return editor
    }
  }
}
