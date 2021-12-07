import fetch from "node-fetch";
import Pg from 'pg';

const KECLOAK_API_URL = 'http://localhost:8082';
const KEYCLOAK_ADMIN_USERNAME = 'admin';
const KEYCLOAK_ADMIN_PASSWORD = 'admin';

const databaseConfiguration = {
  user: 'passemploi',
  host: 'localhost',
  database: 'passemploidb',
  password: 'passemploi',
  port: 55432,
};

const token = await getToken();
const jeunes = await get('jeune')
const conseillers = await get('conseiller')

jeunes.forEach(jeune => createUser(jeune, 'JEUNE'))
conseillers.forEach(conseiller => createUser(conseiller, 'CONSEILLER'))

async function getToken() {
  var details = {
    'username': KEYCLOAK_ADMIN_USERNAME,
    'password': KEYCLOAK_ADMIN_PASSWORD,
    'grant_type': 'password',
    'client_id': 'admin-cli'
  };

  var formBody = [];
  for (var property in details) {
    var encodedKey = encodeURIComponent(property);
    var encodedValue = encodeURIComponent(details[property]);
    formBody.push(encodedKey + "=" + encodedValue);
  }
  formBody = formBody.join("&");

  const response = await fetch(`${KECLOAK_API_URL}/auth/realms/master/protocol/openid-connect/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
    },
    body: formBody
  })

  const body = await response.text();
  return JSON.parse(body).access_token
}

async function get(tableName) {
  const client = new Pg.Client(databaseConfiguration)
  client.connect()
  const query = await client.query(`SELECT * from ${tableName} WHERE structure = 'PASS_EMPLOI'`)
  client.end()
  return query.rows
}

async function createUser(user, type) {
  fetch(`${KECLOAK_API_URL}/auth/admin/realms/pass-emploi/users`, {
    method: 'POST',
    headers: {
      'authorization': 'Bearer ' + token,
      'content-type': 'application/json'
    },

    body: JSON.stringify({
      "enabled": true,
      "groups": [],
      "username": user.id,
      "emailVerified": "",
      "firstName": user.prenom,
      "lastName": user.nom,
      credentials: [
        {
          value: user.id,
          type: 'password',
          temporary: false
        }
      ],
      attributes: {
        id_user: user.id,
        type: type,
        structure: 'PASS_EMPLOI'
      }
    })
  }).then(response => {
    console.log(response.status)
    console.log(user)
  })
}