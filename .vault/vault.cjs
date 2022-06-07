#! /usr/bin/env node
require("dotenv").config({ path: ".environment" });
const yargs = require("yargs");

const options = yargs
  .usage("Usage: vault <command> [options]")
  .command("encrypt", "encrypt vault", {
    env: {
      alias: "e",
      default: "local"
    }
  })
  .demandCommand(1, "encrypt or decrypt command missing")
  .help("h")
  .argv;
const vaultKey = process.env.VAULT_KEY;
if (!vaultKey) {
  console.log("environment variable VAULT_KEY is missing");
  process.exit(1);
}
const fs = require("fs");
const crypto = require("crypto");
const iv = "19ea8528d76f4502";
const key = crypto.createHash("sha256").update(String(vaultKey)).digest("base64").substr(0, 32);


if (options._[0] === "encrypt") {
  console.log("encrypt env secrets");
  const encrypter = crypto.createCipheriv("aes-256-cbc", key, iv);

  const data = fs.readFileSync("./.vault/local.secret", "utf8");

  let encryptedMsg = encrypter.update(data, "utf8", "hex");
  encryptedMsg += encrypter.final("hex");
  fs.writeFileSync("./.vault/local.env", encryptedMsg);
  console.log("file local.env updated");
} else if (options._[0] === "decrypt") {
  console.log("decrypt env secrets");
  const encryptedData = fs.readFileSync("./.vault/local.env", "utf8");
  const decrypter = crypto.createDecipheriv("aes-256-cbc", key, iv);

  let decryptedData = decrypter.update(encryptedData, "hex", "utf8");
  decryptedData += decrypter.final("utf8");

  fs.writeFileSync("./.vault/local.secret", decryptedData);
  console.log("file local.secret updated");

  const envOrigin = fs.readFileSync("./.environment", "utf8");
  let patternStart = "// VAULT START";
  const indexStart = envOrigin.indexOf(patternStart);
  const patterndEnd = "// VAULT END";
  const indexEnd = envOrigin.indexOf(patterndEnd);

  const avantVault = envOrigin.substring(0, indexStart + patternStart.length);
  const apresVault = envOrigin.substring(indexEnd, envOrigin.length + patterndEnd.length);
  const total = avantVault + "\n" + decryptedData + apresVault;
  fs.writeFileSync(".environment", total);

}

