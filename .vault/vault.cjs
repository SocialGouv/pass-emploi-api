#! /usr/bin/env node
const DEFAULT_LOCAL_ENVIRONMENT_FILE = ".environment"
require("dotenv").config({path: DEFAULT_LOCAL_ENVIRONMENT_FILE})
const vaultKey = process.env.VAULT_ENV_VAULT_KEY
const LOCAL_VAULT_ENCRYPTED_FILE = process.env.VAULT_ENV_LOCAL_VAULT_ENCRYPTED_FILE || "./.vault/local.secret"
const LOCAL_VAULT_DECRYPTED_FILE = process.env.VAULT_ENV_LOCAL_VAULT_DECRYPTED_FILE || "./.vault/local.env"
const BEGIN_VAULT_PATTERN = process.env.VAULT_ENV_BEGIN_VAULT_PATTERN || "// VAULT START"
const END_OF_VAULT_PATTERN = process.env.VAULT_ENV_END_OF_VAULT_PATTERN || "// VAULT END"
const iv = process.env.VAULT_ENV_CIPHER_IV || "19ea8528d76f4502"
const TEXT_ENCODING = process.env.VAULT_ENV_TEXT_ENCODING || "utf8"
const VAULT_ENCODING = process.env.VAULT_ENV_VAULT_ENCODING || "hex"
const CIPHER_ALGORITHM = process.env.VAULT_ENV_CIPHER_ALGORITHM || "aes-256-cbc"

const yargs = require("yargs")
const fs = require("fs")
const crypto = require("crypto")

const options = yargs
  .usage("Usage: vault <command> [options]")
  .command("encrypt", "encrypt local.secret into local.env file")
  .command("decrypt", "decrypt local.env into local.secret and into the vault block part of .environment")
  .demandCommand(1, "encrypt or decrypt command missing")
  .help("h")
  .argv
if (!vaultKey) {
  console.log("environment variable VAULT_KEY is missing")
  process.exit(1)
}

const key = crypto.createHash("sha256").update(String(vaultKey)).digest("base64").substr(0, 32)

switch (options._[0]) {
  case "encrypt":
    console.log('encrypt into local.env')
    encryptLocolSecrets()
    break
  case "decrypt":
    console.log('decrypt into local.secret and environment file')
    decryptSecrets()
    break
}

function encryptLocolSecrets() {
  const encrypter = crypto.createCipheriv(CIPHER_ALGORITHM, key, iv)
  const data = fs.readFileSync(LOCAL_VAULT_ENCRYPTED_FILE, TEXT_ENCODING)
  let encryptedMsg = encrypter.update(data, TEXT_ENCODING, VAULT_ENCODING)
  encryptedMsg += encrypter.final(VAULT_ENCODING)
  fs.writeFileSync(LOCAL_VAULT_DECRYPTED_FILE, encryptedMsg)
}

function decryptSecrets() {
  const decryptedData = decryptIntoLocalSecrets()
  writeIntoEnvironmentFile(decryptedData)
}


function decryptIntoLocalSecrets() {
  const encryptedData = fs.readFileSync(LOCAL_VAULT_DECRYPTED_FILE, TEXT_ENCODING)
  const decrypter = crypto.createDecipheriv(CIPHER_ALGORITHM, key, iv)
  let decryptedData = decrypter.update(encryptedData, VAULT_ENCODING, TEXT_ENCODING)
  decryptedData += decrypter.final(TEXT_ENCODING)
  fs.writeFileSync(LOCAL_VAULT_ENCRYPTED_FILE, decryptedData)
  return decryptedData
}

function writeIntoEnvironmentFile(decryptedData) {
  const envOrigin = fs.readFileSync(`./${DEFAULT_LOCAL_ENVIRONMENT_FILE}`, TEXT_ENCODING)
  const patternStart = BEGIN_VAULT_PATTERN
  const indexStart = envOrigin.indexOf(patternStart)
  const patterndEnd = END_OF_VAULT_PATTERN
  const indexEnd = envOrigin.indexOf(patterndEnd)
  const avantVault = envOrigin.substring(0, indexStart + patternStart.length)
  const apresVault = envOrigin.substring(indexEnd, envOrigin.length + patterndEnd.length)
  const total = avantVault + "\n" + decryptedData + apresVault
  fs.writeFileSync(DEFAULT_LOCAL_ENVIRONMENT_FILE, total)
}