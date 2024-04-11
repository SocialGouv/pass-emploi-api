const axios = require('axios')
const fs = require('fs')

const token =
  'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJfVEk3eThMeHlydG50TE5WTUJZc1UyTzNmLTF2M1NFRk5aUktsYmZFN0pvIn0.eyJleHAiOjE3MTI4NTMyMDAsImlhdCI6MTcxMjg1MTQwMCwianRpIjoiNTg0ZGFiYzMtYjg3ZC00OWYwLTg2YjctZTNkN2EyYzI5ZTA4IiwiaXNzIjoiaHR0cHM6Ly9pZC5wYXNzLWVtcGxvaS5iZXRhLmdvdXYuZnIvYXV0aC9yZWFsbXMvcGFzcy1lbXBsb2kiLCJhdWQiOlsicmVhbG0tbWFuYWdlbWVudCIsImFjY291bnQiXSwic3ViIjoiZDA2YzNiMjgtMzg1ZS00MzQ5LWEzNzMtZTRlODQ5Y2QxYTY5IiwidHlwIjoiQmVhcmVyIiwiYXpwIjoicGFzcy1lbXBsb2ktYXBpIiwiYWNyIjoiMSIsInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJkZWZhdWx0LXJvbGVzLXBhc3MtZW1wbG9pIiwib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7InJlYWxtLW1hbmFnZW1lbnQiOnsicm9sZXMiOlsibWFuYWdlLXVzZXJzIl19LCJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6ImVtYWlsIHByb2ZpbGUiLCJjbGllbnRIb3N0IjoiMTAyLjE2OS4xNzkuMTQ0IiwiY2xpZW50SWQiOiJwYXNzLWVtcGxvaS1hcGkiLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsInByZWZlcnJlZF91c2VybmFtZSI6InNlcnZpY2UtYWNjb3VudC1wYXNzLWVtcGxvaS1hcGkiLCJjbGllbnRBZGRyZXNzIjoiMTAyLjE2OS4xNzkuMTQ0In0.oxqbnjJS1cx6sGvj_gJbP8ZR1nebn_oLKHe1jib3ycngs_472LkwaDTRSyWHN9vNkeacvoivb-NwbX4iTbEKUm92616URMFWzr6hHstxjXUO7i_X_hh51jXpg7XMkLh3uWS5JbP4zdLy7EYjyU96K0eNwf1FZcKr4U_kIRb7AcnweQM1u20HmqNkObQvdibixklXysJQcC8q_INJbxGyVD2xAtXI-FlpnXIs93vC3AhQwhdzBMHlWly6omgLaUqL7zWXyYKg1uNQRTs8egvtZpcExPytXeDrt6tP_W8Um1U3XOnGJJtX8FuJ7EXRCdX8NN6lv7KFDwzvl-18tzb1_A'

const utilisateursASupprimer = []
let utilisateurs = []
let page = 3720
const nbPages = 1778

async function run() {
  do {
    const res = await axios.get(
      `https://id.pass-emploi.beta.gouv.fr/auth/admin/realms/pass-emploi/users?max=100&first=${page}`,
      {
        headers: {
          Authorization: 'Bearer ' + token
        }
      }
    )

    utilisateurs = res.data
    page++

    const oldLength = utilisateursASupprimer.length
    for (const user of res.data) {
      if (!user.attributes) {
        console.log(`deleting ${user.id} ${user.email} ${user.attributes}`)
        utilisateursASupprimer.push(user.id)
        try {
          await axios.delete(
            `https://id.pass-emploi.beta.gouv.fr/auth/admin/realms/pass-emploi/users/${user.id}`,
            {
              headers: {
                Authorization: 'Bearer ' + token
              }
            }
          )
        } catch (e) {
          console.log(e)
        }
      }
    }
    const newLength = utilisateursASupprimer.length
    console.log(
      `Page ${page}/${nbPages} | J to delete +${
        newLength - oldLength
      } = total ${newLength}`
    )
  } while (utilisateurs.length !== 0)

  // const filtree = [...new Set(utilisateursASupprimer)]

  // console.log(utilisateursASupprimer.length)
  // console.log(filtree.length)
  // console.log(filtree)

  // fs.writeFile('jeunes.txt', JSON.stringify(filtree), err => {
  //   // In case of a error throw err.
  //   if (err) throw err
  // })
}

run()
  .then(() => {
    console.log(
      '################OKKKKKKKKKKKKKKKKKKKKKKKKKKKK##################'
    )
  })
  .catch(e => {
    console.log(e)
    console.log('##################KOOOOOOO################')
  })
