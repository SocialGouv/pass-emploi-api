import { JWTPayload } from 'jose'
import { Authentification } from '../../src/domain/authentification'

export const unUtilisateurConseiller = (
  args: Partial<Authentification.Utilisateur> = {}
): Authentification.Utilisateur => {
  const defaults: Authentification.Utilisateur = {
    id: '1',
    nom: 'Tavernier',
    prenom: 'Nils',
    type: Authentification.Type.CONSEILLER,
    email: 'nils.tavernier@passemploi.com',
    structure: Authentification.Structure.MILO
  }

  return { ...defaults, ...args }
}

export const unUtilisateurJeune = (
  args: Partial<Authentification.Utilisateur> = {}
): Authentification.Utilisateur => {
  const defaults: Authentification.Utilisateur = {
    id: 'ABCDE',
    nom: 'Doe',
    prenom: 'John',
    type: Authentification.Type.JEUNE,
    email: 'john.doe@passemploi.com',
    structure: Authentification.Structure.MILO
  }

  return { ...defaults, ...args }
}

export const unJwtPayloadValide = (): JWTPayload => ({
  exp: 1638970870,
  iat: 1638970570,
  auth_time: 1638969913,
  jti: '9c84a1ab-96e2-4841-935a-16d69fe2e7ff',
  iss: 'https://pa-auth-staging.osc-secnum-fr1.scalingo.io/auth/realms/pass-emploi',
  sub: '46bf1a0a-ecc2-4b59-9ce3-cca0efa3b7f5',
  typ: 'Bearer',
  azp: 'pass-emploi-web',
  session_state: 'c627ac87-410f-486d-a5c9-d7e8811c610a',
  acr: '0',
  scope: 'pass-emploi-user email profile',
  sid: 'c627ac87-410f-486d-a5c9-d7e8811c610a',
  email_verified: false,
  userStructure: 'MILO',
  name: 'Albert Durant',
  userType: 'CONSEILLER',
  preferred_username: 'a.durant',
  given_name: 'Albert',
  family_name: 'Durant',
  userId: 'bcd60403-5f10-4a16-a660-2099d79ebd66',
  email: 'conseiller.milo.passemploi@gmail.com'
})
