const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '/../.environment') })

const collectionArgMatcher = arg => /--collection=/.test(arg)
if (process.argv.findIndex(collectionArgMatcher) < 0) {
  throw new Error('Renseigner la collection à purger')
}
const collection = process.argv.find(collectionArgMatcher).split('=')[1]

const exec = process.argv.includes('--exec')
const all = process.argv.includes('--all')
console.log(
  exec
    ? `--- PURGING ${all ? 'ALL' : 'max 10'} ${collection.toUpperCase()}`
    : '--- DRY RUN'
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
  .then(async () => {
    const [docsRefs, existingSnapshots] = await Promise.all([
      firestore.collection(collection).listDocuments(),
      firestore.collection(collection).get()
    ])

    const existingRefs = existingSnapshots.docs.map(doc => doc.ref)
    const refsToPurge = docsRefs.filter(
      ref => !existingRefs.some(existingRef => existingRef.isEqual(ref))
    )

    console.log('Total refs :', docsRefs.length)
    console.log('Total docs existants :', existingSnapshots.docs.length)
    console.log('Total docs à purger :', refsToPurge.length)
    if (
      refsToPurge.length !==
      docsRefs.length - existingSnapshots.docs.length
    ) {
      throw new Error('Erreur lors de la sélection des références à purger')
    }

    const refsToProcess = all
      ? refsToPurge
      : refsToPurge.slice(0, all ? undefined : 10)

    if (exec) {
      console.log('-- STARTING PURGE')
      await executeSequentially(
        refsToProcess.map(docRef => async () => {
          console.log(`Purging ${collection} ${docRef.id}`)
          await firestore.recursiveDelete(docRef)
          console.log('- success')
        })
      )
      console.log('--- PURGE SUCCESS')
    } else {
      console.log('--- END DRY RUN')
    }
  })

function executeSequentially(promises) {
  return promises.reduce((prev, task) => prev.then(task), Promise.resolve())
}
