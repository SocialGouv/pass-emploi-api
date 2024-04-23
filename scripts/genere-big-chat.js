const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '/../.environment') })
const CryptoJS = require('crypto-js')
const loremIpsum = require('lorem-ipsum').loremIpsum
const admin = require('firebase-admin')

const exec = process.argv.includes('--exec')
const argCount = process.argv.find(argv => argv.startsWith('--count'))
const count = argCount?.split('=')[1] ?? 5
console.log(exec ? `--- CREATING ${count}` : `--- DRY RUN ${count}`)

const cryptKey = process.env.CHAT_ENCRYPTION_KEY

const firebaseKey = process.env.FIREBASE_SECRET_KEY
const firebaseApp = admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(firebaseKey))
})
const firestore = admin.firestore(firebaseApp)

execute()

async function execute() {
  try {
    await firebaseApp.remoteConfig().listVersions()
    console.log('Connexion à firebase OK')
  } catch (e) {
    console.error({ message: 'Connexion à firebase KO', err: e })
    return
  }

  const chatRef = firestore.doc('chat/Z8iEXQDe7q7Eom4n18xA')
  const messagesAvant = await chatRef.collection('messages').get()
  console.log('>>> AVANT', messagesAvant.docs.length)

  const bulkWriter = firestore.bulkWriter()

  const date = new Date('2023-06-06T03:24:00')
  for (let i = 0; i < count; i++) {
    const message = {
      ...encrypt(loremIpsum()),
      sentBy: 'conseiller',
      conseillerId: '20097302-448d-4048-a0ae-306964aab60e',
      type: 'MESSAGE',
      creationDate: admin.firestore.Timestamp.fromMillis(
        date.getTime() + i * 60000
      )
    }
    bulkWriter.set(
      chatRef.collection('messages').doc('generated-message-' + i),
      message
    )
  }

  if (exec) await bulkWriter.close()

  const messagesApres = await chatRef.collection('messages').get()
  console.log('>>> APRES', messagesApres.docs.length)
}

function encrypt(message) {
  const iv = CryptoJS.lib.WordArray.random(16)
  const key = CryptoJS.enc.Utf8.parse(cryptKey ?? '')
  const encrypted = CryptoJS.AES.encrypt(message, key, { iv })

  return {
    content: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
    iv: encrypted.iv.toString(CryptoJS.enc.Base64)
  }
}
