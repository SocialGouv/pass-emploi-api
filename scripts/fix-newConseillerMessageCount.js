const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '/../.environment') })

const exec = process.argv.includes('--exec')
console.log(exec ? '--- UPDATING DATA' : '--- DRY RUN')

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

    if (exec) {
      const chatsRefs = docsWithoutCount.map(chat => chat.ref)
      chatsRefs.forEach(chatRef => {
        firestore.runTransaction(transaction =>
          chatRef
            .collection('messages')
            .count()
            .get()
            .then(snapshot =>
              transaction.update(chatRef, {
                newConseillerMessageCount: snapshot.data().count
              })
            )
        )
      })
    }
  })
