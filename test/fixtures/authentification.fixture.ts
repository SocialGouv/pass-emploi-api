import { JWTPayload } from 'jose'
import { Authentification } from '../../src/domain/authentification'
import { Core } from '../../src/domain/core'
import { uneDatetime } from './date.fixture'

export const unUtilisateurConseiller = (
  args: Partial<Authentification.Utilisateur> = {}
): Authentification.Utilisateur => {
  const defaults: Authentification.Utilisateur = {
    id: '1',
    idAuthentification: 'id-authentification-conseiller',
    nom: 'Tavernier',
    prenom: 'Nils',
    type: Authentification.Type.CONSEILLER,
    email: 'nils.tavernier@passemploi.com',
    structure: Core.Structure.MILO,
    roles: [],
    dateDerniereConnexion: undefined,
    datePremiereConnexion: uneDatetime().toJSDate(),
    username: undefined
  }

  return {
    ...defaults,
    ...args,
    type: Authentification.Type.CONSEILLER
  }
}

export const unUtilisateurJeune = (
  args: Partial<Authentification.Utilisateur> = {}
): Authentification.Utilisateur => {
  const defaults: Authentification.Utilisateur = {
    id: 'ABCDE',
    idAuthentification: 'id-authentification-jeune',
    nom: 'Doe',
    prenom: 'John',
    type: Authentification.Type.JEUNE,
    email: 'john.doe@plop.io',
    structure: Core.Structure.MILO,
    roles: [],
    dateDerniereConnexion: undefined,
    datePremiereConnexion: undefined
  }

  return {
    ...defaults,
    ...args,
    type: Authentification.Type.JEUNE
  }
}

export const unUtilisateurJeunePasConnecte = (
  args: Partial<Authentification.Utilisateur> = {}
): Authentification.Utilisateur => {
  const defaults: Authentification.Utilisateur = {
    id: 'ABCDE',
    nom: 'Doe',
    prenom: 'John',
    type: Authentification.Type.JEUNE,
    email: 'john.doe@plop.io',
    structure: Core.Structure.MILO,
    roles: [],
    dateDerniereConnexion: undefined,
    datePremiereConnexion: undefined
  }

  return {
    ...defaults,
    ...args,
    type: Authentification.Type.JEUNE
  }
}

export const unUtilisateurSupport = (
  args: Partial<Authentification.Utilisateur> = {}
): Authentification.Utilisateur => {
  const defaults: Authentification.Utilisateur = {
    id: 'ABCDE-support',
    idAuthentification: 'id-authentification-support',
    nom: 'Doe',
    prenom: 'John',
    type: Authentification.Type.SUPPORT,
    email: 'john.doe@plop.io',
    structure: Core.Structure.SUPPORT,
    roles: []
  }

  return {
    ...defaults,
    ...args,
    type: Authentification.Type.SUPPORT
  }
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
  email: 'conseiller.milo.passemploi@gmail.com',
  realm_access: { roles: [] }
})
export const unJwtPayloadValideJeunePE = (): JWTPayload => ({
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
  userStructure: 'POLE_EMPLOI',
  name: 'Albert Durant',
  userType: 'JEUNE',
  preferred_username: 'a.durant',
  given_name: 'Albert',
  family_name: 'Durant',
  userId: 'bcd60403-5f10-4a16-a660-2099d79ebd66',
  email: 'conseiller.milo.passemploi@gmail.com',
  realm_access: { roles: [] }
})
export const unJwtPayloadValideJeunePEBRSA = (): JWTPayload => ({
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
  userStructure: 'POLE_EMPLOI_BRSA',
  name: 'Albert Durant',
  userType: 'JEUNE',
  preferred_username: 'a.durant',
  given_name: 'Albert',
  family_name: 'Durant',
  userId: 'bcd60403-5f10-4a16-a660-2099d79ebd66',
  email: 'conseiller.milo.passemploi@gmail.com',
  realm_access: { roles: [] }
})
export const unJwtPayloadValideSupport = (): JWTPayload => ({
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
  userStructure: 'PASS_EMPLOI',
  name: 'Albert Durant',
  userType: 'SUPPORT',
  preferred_username: 'a.durant',
  given_name: 'Albert',
  family_name: 'Durant',
  userId: 'bcd60403-5f10-4a16-a660-2099d79ebd66',
  email: 'conseiller.milo.passemploi@gmail.com',
  realm_access: { roles: [] }
})

export const unUtilisateurDecode = (): Authentification.Utilisateur => ({
  id: 'bcd60403-5f10-4a16-a660-2099d79ebd66',
  email: 'conseiller.milo.passemploi@gmail.com',
  nom: 'Durant',
  prenom: 'Albert',
  username: 'a.durant',
  type: Authentification.Type.CONSEILLER,
  structure: Core.Structure.MILO,
  roles: []
})

export const unUtilisateurDecodePoleEmploi =
  (): Authentification.Utilisateur => ({
    id: 'bcd60403-5f10-4a16-a660-2099d79ebd66',
    email: 'conseiller.milo.passemploi@gmail.com',
    nom: 'Durant',
    prenom: 'Albert',
    username: 'a.durant',
    type: Authentification.Type.JEUNE,
    structure: Core.Structure.POLE_EMPLOI,
    roles: []
  })

export const unHeaderAuthorization = (): string => 'bearer coucou'
