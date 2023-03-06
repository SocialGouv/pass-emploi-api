const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '/../.environment') })

const exec = process.argv.includes('--exec')
const all = process.argv.includes('--all')
console.log(
  exec ? `--- UPDATING ${all ? 'ALL' : 'max 10'} DATA` : '--- DRY RUN'
)

const admin = require('firebase-admin')
const firebaseKey = process.env.FIREBASE_SECRET_KEY
const firebaseApp = admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(firebaseKey))
})
const firestore = admin.firestore(firebaseApp)
firebaseApp
  .remoteConfig()
  .listVersions()
  .then(() => console.log('Connexion à firebase OK'))
  .catch(e => console.error({ message: 'Connexion à firebase KO', err: e }))
  .then(() => firestore.collection('chat').get())
  .then(snapshots => {
    console.log('Total chats :', snapshots.docs.length)

    const docsWithoutCount = snapshots.docs.filter(
      doc =>
        isNaN(doc.data().newConseillerMessageCount) ||
        doc.data().newConseillerMessageCount === undefined
    )

    console.log(
      'Total chats sans newConseillerMessageCount :',
      docsWithoutCount.length
    )
    console.log('Vérif valeurs newConseillerMessageCount :', [
      ...new Set(
        docsWithoutCount.map(doc => doc.data().newConseillerMessageCount)
      )
    ])

    const chatsRefs = docsWithoutCount.map(chat => chat.ref)
    const chatsToProcess = all
      ? chatsRefs
      : chatsRefs.slice(0, all ? undefined : 10)

    executeSequentially(
      chatsToProcess.map(
        chatRef => () =>
          firestore.runTransaction(transaction =>
            chatRef
              .collection('messages')
              .count()
              .get()
              .then(snapshot => {
                console.log(
                  `chatRef : ${chatRef.id} / count : ${snapshot.data().count}`
                )
                if (exec)
                  transaction.update(chatRef, {
                    newConseillerMessageCount: snapshot.data().count
                  })
              })
          )
      )
    ).then(() => console.log('--- SUCCESS'))
  })

function executeSequentially(promises) {
  return promises.reduce((prev, task) => prev.then(task), Promise.resolve())
}
