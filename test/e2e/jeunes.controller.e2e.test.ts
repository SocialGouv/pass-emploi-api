import { INestApplication, ValidationPipe } from '@nestjs/common'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { DateTime } from 'luxon'
import { createSandbox } from 'sinon'
import { Authentification } from 'src/domain/authentification'
import { DateService } from 'src/utils/date-service'
import * as request from 'supertest'
import { JeuneAuthorizer } from '../../src/application/authorizers/jeune-authorizer'
import { GetSuiviSemainePoleEmploiQueryHandler } from '../../src/application/queries/get-suivi-semaine-pole-emploi.query.handler'
import { GetDemarchesQueryGetter } from '../../src/application/queries/query-getters/pole-emploi/get-demarches.query.getter'
import { GetRendezVousJeunePoleEmploiQueryGetter } from '../../src/application/queries/query-getters/pole-emploi/get-rendez-vous-jeune-pole-emploi.query.getter'
import { emptySuccess, success } from '../../src/building-blocks/types/result'
import { Jeune } from '../../src/domain/jeune/jeune'
import { JwtService } from '../../src/infrastructure/auth/jwt.service'
import {
  DemarcheDto,
  DemarcheDtoEtat,
  RendezVousPoleEmploiDto
} from '../../src/infrastructure/clients/dto/pole-emploi.dto'
import { KeycloakClient } from '../../src/infrastructure/clients/keycloak-client.db'
import { PoleEmploiPartenaireClient } from '../../src/infrastructure/clients/pole-emploi-partenaire-client.db'
import { IdService } from '../../src/utils/id-service'
import {
  unHeaderAuthorization,
  unJwtPayloadValide,
  unUtilisateurJeune
} from '../fixtures/authentification.fixture'
import { unJeune } from '../fixtures/jeune.fixture'
import {
  StubbedClass,
  buildTestingModuleForHttpTesting,
  stubClass
} from '../utils'

describe('JeunesControllerE2E', () => {
  let getJeuneHomeAgendaPoleEmploiQueryHandler: GetSuiviSemainePoleEmploiQueryHandler
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let keycloakClient: StubbedClass<KeycloakClient>
  let jeuneRepository: StubbedType<Jeune.Repository>
  let authRepository: StubbedType<Authentification.Repository>
  let poleEmploiPartenaireClient: StubbedClass<PoleEmploiPartenaireClient>
  let jwtService: StubbedClass<JwtService>
  let app: INestApplication

  let dateService: StubbedClass<DateService>
  const maintenant = DateTime.fromISO('2022-10-26T12:00:00.000Z')

  let idService: StubbedClass<IdService>

  beforeEach(async () => {
    // Given
    dateService = stubClass(DateService)
    dateService.now.returns(maintenant)
    jwtService = stubClass(JwtService)
    idService = stubClass(IdService)
    idService.uuid.returns('9903de8a-76fc-44c0-b049-480d7ec2ee10')

    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    keycloakClient = stubClass(KeycloakClient)
    jeuneRepository = stubInterface(createSandbox())
    authRepository = stubInterface(createSandbox())
    poleEmploiPartenaireClient = stubClass(PoleEmploiPartenaireClient)

    const getDemarchesQueryGetter = new GetDemarchesQueryGetter(
      authRepository,
      poleEmploiPartenaireClient,
      dateService,
      keycloakClient
    )
    const getRendezVousJeunePoleEmploiQueryGetter =
      new GetRendezVousJeunePoleEmploiQueryGetter(
        jeuneRepository,
        poleEmploiPartenaireClient,
        idService,
        keycloakClient
      )

    getJeuneHomeAgendaPoleEmploiQueryHandler =
      new GetSuiviSemainePoleEmploiQueryHandler(
        jeuneRepository,
        getDemarchesQueryGetter,
        getRendezVousJeunePoleEmploiQueryGetter,
        jeuneAuthorizer,
        keycloakClient,
        dateService
      )

    const testingModule = await buildTestingModuleForHttpTesting()
      .overrideProvider(GetSuiviSemainePoleEmploiQueryHandler)
      .useValue(getJeuneHomeAgendaPoleEmploiQueryHandler)
      .overrideProvider(JwtService)
      .useValue(jwtService)
      .overrideProvider(DateService)
      .useValue(dateService)
      .compile()

    app = testingModule.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
    await app.init()
  })

  beforeEach(() => {
    jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValide())
  })

  after(async () => {
    await app.close()
  })

  describe('GET /v2/jeunes/:idJeune/home/agenda/pole-emploi', () => {
    const jeune = unJeune()

    it('retourne la page Mon suivi > Cette semaine du jeune', async () => {
      // Given
      jeuneAuthorizer.autoriserLeJeune.resolves(emptySuccess())
      keycloakClient.exchangeTokenJeune.resolves('idpToken')
      jeuneRepository.get.resolves(jeune)
      authRepository.getJeuneById.resolves(unUtilisateurJeune())

      poleEmploiPartenaireClient.getDemarches.resolves(
        success(demarchesPoleEmploi)
      )
      poleEmploiPartenaireClient.getRendezVous.resolves(
        success(rendezVousPoleEmploi)
      )
      poleEmploiPartenaireClient.getPrestations.resolves(success([]))

      // When
      await request(app.getHttpServer())
        .get(
          `/v2/jeunes/${jeune.id}/home/agenda/pole-emploi?maintenant=2022-08-17T12%3A00%3A30%2B02%3A00`
        )
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(200)
    })
  })
})

const rendezVousPoleEmploi: RendezVousPoleEmploiDto[] = [
  {
    date: '2022-10-26',
    duree: 30,
    heure: '14:00',
    agence: 'Pôle Emploi Ales avene',
    adresse: {
      ligne4: '29 CHEMIN des deux Mas',
      ligne5: 'Piste OASIS 4',
      bureauDistributeur: '30100'
    },
    typeRDV: 'CONVOCATION',
    modaliteContact: 'TELEPHONE'
  }
]

const demarchesPoleEmploi: DemarcheDto[] = [
  {
    ou: 'Pôle emploi',
    etat: DemarcheDtoEtat.RE,
    quoi: 'Q11',
    type: 'demarcheExtDetailleOut',
    comment: 'C11.02',
    dateFin: '2022-10-24T17:54:00+02:00',
    pourQuoi: 'P03',
    dateDebut: '2022-10-24T17:54:00+02:00',
    idDemarche: '244025740',
    libelleLong:
      'Préparation de ses candidatures (CV, lettre de motivation, book) en créant ou en mettant à jour mon CV et ou ma lettre de motivation',
    libelleQuoi:
      'Préparation de ses candidatures (CV, lettre de motivation, book)',
    dateCreation: '2022-10-24T17:54:00+02:00',
    description2: 'CV PETITJEAN Brandon 2',
    libelleCourt:
      'Préparation CV ou lettre de motivation :  CV PETITJEAN Brandon 2',
    droitsDemarche: {
      annulation: false,
      realisation: false,
      replanification: false,
      modificationDate: false
    },
    libelleComment:
      'En créant ou en mettant à jour mon CV et ou ma lettre de motivation',
    libellePourquoi: 'Mes candidatures',
    origineCreateur: 'INDIVIDU',
    origineDemarche: 'CV'
  },
  {
    etat: DemarcheDtoEtat.RE,
    quoi: 'Q11',
    type: 'demarcheExtDetailleOut',
    metier: 'CV à mettre à jour',
    comment: 'C11.02',
    dateFin: '2022-10-24T00:00:00+02:00',
    pourQuoi: 'P03',
    dateDebut: '2022-10-24T00:00:00+02:00',
    idDemarche: '242490963',
    libelleLong:
      'Préparation de ses candidatures (CV, lettre de motivation, book) en créant ou en mettant à jour mon CV et ou ma lettre de motivation',
    libelleQuoi:
      'Préparation de ses candidatures (CV, lettre de motivation, book)',
    dateCreation: '2022-10-18T11:12:00+02:00',
    libelleCourt: 'Préparation CV ou lettre de motivation CV à mettre à jour',
    droitsDemarche: {
      annulation: false,
      realisation: false,
      replanification: true,
      modificationDate: false
    },
    libelleComment:
      'En créant ou en mettant à jour mon CV et ou ma lettre de motivation',
    libellePourquoi: 'Mes candidatures',
    origineCreateur: 'CONSEILLER',
    origineDemarche: 'JRE_CONSEILLER',
    dateModification: '2022-10-24T17:44:00+02:00',
    origineModificateur: 'INDIVIDU'
  },
  {
    etat: DemarcheDtoEtat.RE,
    quoi: 'Q15',
    type: 'demarcheExtDetailleOut',
    comment: 'C15.06',
    dateFin: '2022-10-24T12:00:00+02:00',
    pourQuoi: 'P03',
    idDemarche: '242481248',
    libelleLong: 'Candidatures spontanées',
    libelleQuoi: 'Candidatures spontanées',
    dateCreation: '2022-10-18T10:57:00+02:00',
    libelleCourt: 'Candidatures spontanées',
    droitsDemarche: {
      annulation: false,
      realisation: false,
      replanification: true,
      modificationDate: false
    },
    libelleComment: 'Moyen à définir',
    libellePourquoi: 'Mes candidatures',
    origineCreateur: 'CONSEILLER',
    origineDemarche: 'JRE_CONSEILLER',
    dateModification: '2022-10-24T17:24:00+02:00',
    origineModificateur: 'INDIVIDU'
  },
  {
    ou: 'RELANCE',
    etat: DemarcheDtoEtat.RE,
    quoi: 'Q12',
    type: 'demarcheExtDetailleOut',
    comment: 'C12.03',
    dateFin: '2022-10-21T12:00:00+02:00',
    pourQuoi: 'P03',
    idDemarche: '242480988',
    libelleLong:
      "Recherche d'offres d'emploi ou d'entreprises avec une agence d'intérim",
    libelleQuoi: "Recherche d'offres d'emploi ou d'entreprises",
    dateCreation: '2022-10-18T10:57:00+02:00',
    libelleCourt: "Inscription en agence d'intérim",
    droitsDemarche: {
      annulation: false,
      realisation: false,
      replanification: true,
      modificationDate: false
    },
    libelleComment: "Avec une agence d'intérim",
    libellePourquoi: 'Mes candidatures',
    origineCreateur: 'CONSEILLER',
    origineDemarche: 'JRE_CONSEILLER',
    dateModification: '2022-10-21T14:54:00+02:00',
    origineModificateur: 'INDIVIDU'
  },
  {
    ou: 'IMT (Information Marché du Travail) ',
    etat: DemarcheDtoEtat.RE,
    quoi: 'Q37',
    type: 'demarcheExtDetailleOut',
    comment: 'C37.04',
    dateFin: '2022-10-24T00:00:00+02:00',
    pourQuoi: 'P02',
    dateDebut: '2022-10-24T00:00:00+02:00',
    idDemarche: '242480697',
    libelleLong: "Initiation à l'informatique ou à Internet par un autre moyen",
    libelleQuoi: "Initiation à l'informatique ou à Internet",
    dateCreation: '2022-10-18T10:56:00+02:00',
    libelleCourt:
      "Initiation à l'informatique avec IMT (Information Marché du Travail) ",
    droitsDemarche: {
      annulation: false,
      realisation: false,
      replanification: true,
      modificationDate: false
    },
    libelleComment: 'Par un autre moyen',
    libellePourquoi: 'Ma formation professionnelle',
    origineCreateur: 'CONSEILLER',
    origineDemarche: 'JRE_CONSEILLER',
    dateModification: '2022-10-24T17:24:00+02:00',
    origineModificateur: 'INDIVIDU'
  },
  {
    etat: DemarcheDtoEtat.RE,
    quoi: 'Q36',
    type: 'demarcheExtDetailleOut',
    contact: 'ENTRETIEN INDIVIDUEL PHYSIQUE',
    dateFin: '2022-10-18T00:00:00+02:00',
    pourQuoi: 'P06',
    dateDebut: '2022-10-18T00:00:00+02:00',
    idDemarche: '242511564',
    libelleLong: 'Entretien de suivi personnalisé',
    libelleQuoi: 'Vous avez eu un',
    dateCreation: '2022-10-18T00:00:00+02:00',
    description2: 'Entretien de suivi personnalisé',
    libelleCourt: 'Entretien de suivi personnalisé',
    droitsDemarche: {
      annulation: false,
      realisation: false,
      replanification: false,
      modificationDate: false
    },
    libellePourquoi: 'Mes entretiens avec un conseiller',
    origineCreateur: 'CONSEILLER',
    origineDemarche: 'ENTRETIEN'
  },
  {
    ou: 'Pôle emploi',
    etat: DemarcheDtoEtat.RE,
    quoi: 'Q14',
    type: 'demarcheExtDetailleOut',
    dateFin: '2022-10-17T16:45:00+02:00',
    pourQuoi: 'P03',
    dateDebut: '2022-10-17T16:45:00+02:00',
    organisme: 'JSC FRANCE',
    idDemarche: '242312573',
    libelleLong: "Réponse à des offres d'emploi",
    libelleQuoi: "Réponse à des offres d'emploi",
    dateCreation: '2022-10-17T16:45:00+02:00',
    libelleCourt: "Réponse à l'offre de JSC FRANCE",
    droitsDemarche: {
      annulation: false,
      realisation: false,
      replanification: false,
      modificationDate: false
    },
    libellePourquoi: 'Mes candidatures',
    origineCreateur: 'INDIVIDU',
    origineDemarche: 'CANDIDATURE'
  },
  {
    etat: DemarcheDtoEtat.RE,
    quoi: 'Q16',
    type: 'demarcheExtDetailleOut',
    comment: 'C16.03',
    dateFin: '2022-10-17T12:00:00+02:00',
    pourQuoi: 'P03',
    idDemarche: '241013377',
    libelleLong:
      'Réalisation du suivi de ses candidatures et relance des recruteurs',
    libelleQuoi:
      'Réalisation du suivi de ses candidatures et relance des recruteurs',
    dateCreation: '2022-10-12T09:18:00+02:00',
    libelleCourt: 'Suivi et relance des candidatures',
    droitsDemarche: {
      annulation: false,
      realisation: false,
      replanification: true,
      modificationDate: false
    },
    libelleComment: 'Moyen à définir',
    libellePourquoi: 'Mes candidatures',
    origineCreateur: 'CONSEILLER',
    origineDemarche: 'JRE_CONSEILLER',
    dateModification: '2022-10-17T12:05:00+02:00',
    origineModificateur: 'INDIVIDU'
  },
  {
    etat: DemarcheDtoEtat.RE,
    quoi: 'Q16',
    type: 'demarcheExtDetailleOut',
    comment: 'C16.02',
    dateFin: '2022-10-17T12:00:00+02:00',
    pourQuoi: 'P03',
    idDemarche: '241013268',
    libelleLong:
      'Réalisation du suivi de ses candidatures et relance des recruteurs par un autre moyen',
    libelleQuoi:
      'Réalisation du suivi de ses candidatures et relance des recruteurs',
    dateCreation: '2022-10-12T09:18:00+02:00',
    description2: "Relance agence d'interim",
    libelleCourt: 'Suivi et relance des candidatures',
    droitsDemarche: {
      annulation: false,
      realisation: false,
      replanification: true,
      modificationDate: false
    },
    libelleComment: 'Par un autre moyen',
    libellePourquoi: 'Mes candidatures',
    origineCreateur: 'CONSEILLER',
    origineDemarche: 'JRE_CONSEILLER',
    dateModification: '2022-10-17T12:06:00+02:00',
    origineModificateur: 'INDIVIDU'
  },
  {
    etat: DemarcheDtoEtat.RE,
    quoi: 'Q14',
    type: 'demarcheExtDetailleOut',
    metier: 'Multiservice, conducteur de ligne...',
    dateFin: '2022-10-17T12:00:00+02:00',
    pourQuoi: 'P03',
    idDemarche: '241013000',
    libelleLong: "Réponse à des offres d'emploi",
    libelleQuoi: "Réponse à des offres d'emploi",
    dateCreation: '2022-10-12T09:17:00+02:00',
    libelleCourt: 'Réponse à offres',
    droitsDemarche: {
      annulation: false,
      realisation: false,
      replanification: true,
      modificationDate: false
    },
    libellePourquoi: 'Mes candidatures',
    origineCreateur: 'CONSEILLER',
    origineDemarche: 'JRE_CONSEILLER',
    dateModification: '2022-10-17T17:01:00+02:00',
    origineModificateur: 'INDIVIDU'
  },
  {
    etat: DemarcheDtoEtat.RE,
    quoi: 'Q36',
    type: 'demarcheExtDetailleOut',
    contact: 'ENTRETIEN INDIVIDUEL TELEPHONI',
    dateFin: '2022-10-12T00:00:00+02:00',
    pourQuoi: 'P06',
    dateDebut: '2022-10-12T00:00:00+02:00',
    idDemarche: '241015344',
    libelleLong: 'Entretien de suivi personnalisé',
    libelleQuoi: 'Vous avez eu un',
    dateCreation: '2022-10-12T00:00:00+02:00',
    description2: 'Entretien de suivi personnalisé',
    libelleCourt: 'Entretien de suivi personnalisé',
    droitsDemarche: {
      annulation: false,
      realisation: false,
      replanification: false,
      modificationDate: false
    },
    libellePourquoi: 'Mes entretiens avec un conseiller',
    origineCreateur: 'CONSEILLER',
    origineDemarche: 'ENTRETIEN'
  },
  {
    etat: DemarcheDtoEtat.RE,
    quoi: 'Q20',
    type: 'demarcheExtDetailleOut',
    metier: 'SCH France',
    comment: 'C20.02',
    dateFin: '2022-10-07T12:00:00+02:00',
    pourQuoi: 'P04',
    idDemarche: '239281229',
    libelleLong:
      'Relance des recruteurs suite à ses entretiens par un autre moyen',
    libelleQuoi: 'Relance des recruteurs suite à ses entretiens',
    dateCreation: '2022-10-05T11:25:00+02:00',
    libelleCourt: "Relance suite entretiens d'embauche",
    droitsDemarche: {
      annulation: false,
      realisation: false,
      replanification: true,
      modificationDate: false
    },
    libelleComment: 'Par un autre moyen',
    libellePourquoi: "Mes entretiens d'embauche",
    origineCreateur: 'CONSEILLER',
    origineDemarche: 'JRE_CONSEILLER',
    dateModification: '2022-10-07T17:48:00+02:00',
    origineModificateur: 'INDIVIDU'
  },
  {
    etat: DemarcheDtoEtat.RE,
    quoi: 'Q14',
    type: 'demarcheExtDetailleOut',
    metier: 'maintenance',
    dateFin: '2022-10-08T00:00:00+02:00',
    pourQuoi: 'P03',
    dateDebut: '2022-10-08T00:00:00+02:00',
    idDemarche: '239280172',
    libelleLong: "Réponse à des offres d'emploi",
    libelleQuoi: "Réponse à des offres d'emploi",
    dateCreation: '2022-10-05T11:24:00+02:00',
    libelleCourt: 'Réponse à offres',
    droitsDemarche: {
      annulation: false,
      realisation: false,
      replanification: true,
      modificationDate: false
    },
    libellePourquoi: 'Mes candidatures',
    origineCreateur: 'CONSEILLER',
    origineDemarche: 'JRE_CONSEILLER',
    dateModification: '2022-10-08T18:19:00+02:00',
    origineModificateur: 'INDIVIDU'
  },
  {
    etat: DemarcheDtoEtat.RE,
    quoi: 'Q18',
    type: 'demarcheExtDetailleOut',
    metier: 'Opérateur de production',
    comment: 'C18.03',
    dateFin: '2022-09-29T00:00:00+02:00',
    pourQuoi: 'P04',
    dateDebut: '2022-09-29T00:00:00+02:00',
    idDemarche: '239271986',
    libelleLong: "Réalisation d'entretiens d'embauche par un autre moyen",
    libelleQuoi: "Réalisation d'entretiens d'embauche",
    dateCreation: '2022-10-05T11:11:00+02:00',
    description2: 'SCH France',
    libelleCourt: "Entretiens d'embauche",
    droitsDemarche: {
      annulation: false,
      realisation: false,
      replanification: true,
      modificationDate: false
    },
    libelleComment: 'Par un autre moyen',
    libellePourquoi: "Mes entretiens d'embauche",
    origineCreateur: 'CONSEILLER',
    origineDemarche: 'JRE_CONSEILLER'
  },
  {
    etat: DemarcheDtoEtat.RE,
    quoi: 'Q36',
    type: 'demarcheExtDetailleOut',
    contact: 'ENTRETIEN INDIVIDUEL TELEPHONI',
    dateFin: '2022-10-05T00:00:00+02:00',
    pourQuoi: 'P06',
    dateDebut: '2022-10-05T00:00:00+02:00',
    idDemarche: '239302125',
    libelleLong: 'Entretien de suivi personnalisé',
    libelleQuoi: 'Vous avez eu un',
    dateCreation: '2022-10-05T00:00:00+02:00',
    description2: 'Entretien de suivi personnalisé',
    libelleCourt: 'Entretien de suivi personnalisé',
    droitsDemarche: {
      annulation: false,
      realisation: false,
      replanification: false,
      modificationDate: false
    },
    libellePourquoi: 'Mes entretiens avec un conseiller',
    origineCreateur: 'CONSEILLER',
    origineDemarche: 'ENTRETIEN'
  },
  {
    ou: 'Pôle emploi',
    etat: DemarcheDtoEtat.RE,
    quoi: 'Q14',
    type: 'demarcheExtDetailleOut',
    dateFin: '2022-10-01T16:56:00+02:00',
    pourQuoi: 'P03',
    dateDebut: '2022-10-01T16:56:00+02:00',
    organisme: 'INTERACTION',
    idDemarche: '238409862',
    libelleLong: "Réponse à des offres d'emploi",
    libelleQuoi: "Réponse à des offres d'emploi",
    dateCreation: '2022-10-01T16:56:00+02:00',
    libelleCourt: "Réponse à l'offre de INTERACTION",
    droitsDemarche: {
      annulation: false,
      realisation: false,
      replanification: false,
      modificationDate: false
    },
    libellePourquoi: 'Mes candidatures',
    origineCreateur: 'INDIVIDU',
    origineDemarche: 'CANDIDATURE'
  },
  {
    etat: DemarcheDtoEtat.RE,
    quoi: 'Q14',
    type: 'demarcheExtDetailleOut',
    dateFin: '2022-09-29T00:00:00+02:00',
    pourQuoi: 'P03',
    dateDebut: '2022-09-29T00:00:00+02:00',
    idDemarche: '236589109',
    libelleLong: "Réponse à des offres d'emploi",
    libelleQuoi: "Réponse à des offres d'emploi",
    dateCreation: '2022-09-26T10:39:00+02:00',
    libelleCourt: 'Réponse à offres',
    droitsDemarche: {
      annulation: false,
      realisation: false,
      replanification: true,
      modificationDate: false
    },
    libellePourquoi: 'Mes candidatures',
    origineCreateur: 'CONSEILLER',
    origineDemarche: 'JRE_CONSEILLER',
    dateModification: '2022-10-01T17:00:00+02:00',
    origineModificateur: 'INDIVIDU'
  },
  {
    ou: 'La bonne boîte',
    etat: DemarcheDtoEtat.RE,
    quoi: 'Q15',
    type: 'demarcheExtDetailleOut',
    comment: 'C15.04',
    dateFin: '2022-09-29T00:00:00+02:00',
    pourQuoi: 'P03',
    dateDebut: '2022-09-29T00:00:00+02:00',
    idDemarche: '236588899',
    libelleLong: 'Candidatures spontanées par un autre moyen',
    libelleQuoi: 'Candidatures spontanées',
    dateCreation: '2022-09-26T10:39:00+02:00',
    libelleCourt: 'Candidature spontanée avec La bonne boîte',
    droitsDemarche: {
      annulation: false,
      realisation: false,
      replanification: true,
      modificationDate: false
    },
    libelleComment: 'Par un autre moyen',
    libellePourquoi: 'Mes candidatures',
    origineCreateur: 'CONSEILLER',
    origineDemarche: 'JRE_CONSEILLER',
    dateModification: '2022-10-01T16:51:00+02:00',
    origineModificateur: 'INDIVIDU'
  },
  {
    etat: DemarcheDtoEtat.RE,
    quoi: 'Q36',
    type: 'demarcheExtDetailleOut',
    contact: 'ENTRETIEN INDIVIDUEL TELEPHONI',
    dateFin: '2022-09-26T00:00:00+02:00',
    pourQuoi: 'P06',
    dateDebut: '2022-09-26T00:00:00+02:00',
    idDemarche: '236591033',
    libelleLong: 'Entretien de suivi personnalisé',
    libelleQuoi: 'Vous avez eu un',
    dateCreation: '2022-09-26T00:00:00+02:00',
    description2: 'Entretien de suivi personnalisé',
    libelleCourt: 'Entretien de suivi personnalisé',
    droitsDemarche: {
      annulation: false,
      realisation: false,
      replanification: false,
      modificationDate: false
    },
    libellePourquoi: 'Mes entretiens avec un conseiller',
    origineCreateur: 'CONSEILLER',
    origineDemarche: 'ENTRETIEN'
  },
  {
    etat: DemarcheDtoEtat.RE,
    quoi: 'Q36',
    type: 'demarcheExtDetailleOut',
    contact: 'ENTRETIEN INDIVIDUEL TELEPHONI',
    dateFin: '2022-09-26T00:00:00+02:00',
    pourQuoi: 'P06',
    dateDebut: '2022-09-26T00:00:00+02:00',
    idDemarche: '236591788',
    libelleLong: 'Entretien de suivi personnalisé',
    libelleQuoi: 'Vous avez eu un',
    dateCreation: '2022-09-26T00:00:00+02:00',
    description2: 'Entretien de suivi personnalisé',
    libelleCourt: 'Entretien de suivi personnalisé',
    droitsDemarche: {
      annulation: false,
      realisation: false,
      replanification: false,
      modificationDate: false
    },
    libellePourquoi: 'Mes entretiens avec un conseiller',
    origineCreateur: 'CONSEILLER',
    origineDemarche: 'ENTRETIEN'
  },
  {
    ou: 'IMT',
    etat: DemarcheDtoEtat.RE,
    quoi: 'Q37',
    type: 'demarcheExtDetailleOut',
    comment: 'C37.04',
    dateFin: '2022-09-26T00:00:00+02:00',
    pourQuoi: 'P02',
    dateDebut: '2022-09-26T00:00:00+02:00',
    idDemarche: '235559023',
    libelleLong: "Initiation à l'informatique ou à Internet par un autre moyen",
    libelleQuoi: "Initiation à l'informatique ou à Internet",
    dateCreation: '2022-09-21T11:08:00+02:00',
    libelleCourt: "Initiation à l'informatique avec IMT",
    droitsDemarche: {
      annulation: false,
      realisation: false,
      replanification: true,
      modificationDate: false
    },
    libelleComment: 'Par un autre moyen',
    libellePourquoi: 'Ma formation professionnelle',
    origineCreateur: 'CONSEILLER',
    origineDemarche: 'JRE_CONSEILLER',
    dateModification: '2022-09-26T10:15:00+02:00',
    origineModificateur: 'CONSEILLER'
  },
  {
    etat: DemarcheDtoEtat.RE,
    quoi: 'Q15',
    type: 'demarcheExtDetailleOut',
    comment: 'C15.04',
    dateFin: '2022-09-26T00:00:00+02:00',
    pourQuoi: 'P03',
    dateDebut: '2022-09-26T00:00:00+02:00',
    idDemarche: '235558780',
    libelleLong: 'Candidatures spontanées par un autre moyen',
    libelleQuoi: 'Candidatures spontanées',
    dateCreation: '2022-09-21T11:07:00+02:00',
    libelleCourt: 'Candidature spontanée',
    droitsDemarche: {
      annulation: false,
      realisation: false,
      replanification: true,
      modificationDate: false
    },
    libelleComment: 'Par un autre moyen',
    libellePourquoi: 'Mes candidatures',
    origineCreateur: 'CONSEILLER',
    origineDemarche: 'JRE_CONSEILLER',
    dateModification: '2022-09-26T10:01:00+02:00',
    origineModificateur: 'CONSEILLER'
  },
  {
    etat: DemarcheDtoEtat.RE,
    quoi: 'Q14',
    type: 'demarcheExtDetailleOut',
    dateFin: '2022-09-26T00:00:00+02:00',
    pourQuoi: 'P03',
    dateDebut: '2022-09-26T00:00:00+02:00',
    organisme: 'La bonne boîte',
    idDemarche: '235558534',
    libelleLong: "Réponse à des offres d'emploi",
    libelleQuoi: "Réponse à des offres d'emploi",
    dateCreation: '2022-09-21T11:07:00+02:00',
    libelleCourt: "Réponse à l'offre de La bonne boîte",
    droitsDemarche: {
      annulation: false,
      realisation: false,
      replanification: true,
      modificationDate: false
    },
    libellePourquoi: 'Mes candidatures',
    origineCreateur: 'CONSEILLER',
    origineDemarche: 'JRE_CONSEILLER',
    dateModification: '2022-09-26T10:02:00+02:00',
    origineModificateur: 'CONSEILLER'
  },
  {
    etat: DemarcheDtoEtat.RE,
    quoi: 'Q12',
    type: 'demarcheExtDetailleOut',
    comment: 'C12.03',
    dateFin: '2022-10-04T12:00:00+02:00',
    pourQuoi: 'P03',
    organisme: 'Inscription ',
    idDemarche: '235557761',
    libelleLong:
      "Recherche d'offres d'emploi ou d'entreprises avec une agence d'intérim",
    libelleQuoi: "Recherche d'offres d'emploi ou d'entreprises",
    dateCreation: '2022-09-21T11:06:00+02:00',
    libelleCourt: 'Inscription Inscription ',
    droitsDemarche: {
      annulation: false,
      realisation: false,
      replanification: true,
      modificationDate: false
    },
    libelleComment: "Avec une agence d'intérim",
    libellePourquoi: 'Mes candidatures',
    origineCreateur: 'CONSEILLER',
    origineDemarche: 'JRE_CONSEILLER',
    dateModification: '2022-10-04T21:22:00+02:00',
    origineModificateur: 'INDIVIDU'
  },
  {
    etat: DemarcheDtoEtat.RE,
    quoi: 'Q36',
    type: 'demarcheExtDetailleOut',
    contact: 'ENTRETIEN INDIVIDUEL TELEPHONI',
    dateFin: '2022-09-21T00:00:00+02:00',
    pourQuoi: 'P06',
    dateDebut: '2022-09-21T00:00:00+02:00',
    idDemarche: '235570753',
    libelleLong: 'Entretien de suivi personnalisé',
    libelleQuoi: 'Vous avez eu un',
    dateCreation: '2022-09-21T00:00:00+02:00',
    description2: 'Entretien de suivi personnalisé',
    libelleCourt: 'Entretien de suivi personnalisé',
    droitsDemarche: {
      annulation: false,
      realisation: false,
      replanification: false,
      modificationDate: false
    },
    libellePourquoi: 'Mes entretiens avec un conseiller',
    origineCreateur: 'CONSEILLER',
    origineDemarche: 'ENTRETIEN'
  },
  {
    ou: 'Pôle emploi',
    etat: DemarcheDtoEtat.RE,
    quoi: 'Q14',
    type: 'demarcheExtDetailleOut',
    dateFin: '2022-09-15T01:36:00+02:00',
    pourQuoi: 'P03',
    dateDebut: '2022-09-15T01:36:00+02:00',
    organisme: "NCH FRANCE -UN NOUVEAU CONCEPT POUR L'HA",
    idDemarche: '233397945',
    libelleLong: "Réponse à des offres d'emploi",
    libelleQuoi: "Réponse à des offres d'emploi",
    dateCreation: '2022-09-15T01:36:00+02:00',
    libelleCourt: "Réponse à l'offre de (recruteur non diffusé)",
    droitsDemarche: {
      annulation: false,
      realisation: false,
      replanification: false,
      modificationDate: false
    },
    libellePourquoi: 'Mes candidatures',
    origineCreateur: 'INDIVIDU',
    origineDemarche: 'CANDIDATURE'
  },
  {
    etat: DemarcheDtoEtat.RE,
    quoi: 'Q07',
    type: 'demarcheExtDetailleOut',
    dateFin: '2022-09-15T00:00:00+02:00',
    pourQuoi: 'P02',
    dateDebut: '2022-09-15T00:00:00+02:00',
    idDemarche: '233177656',
    libelleLong: "Montage d'un dossier d’inscription à une formation",
    libelleQuoi: "Montage d'un dossier d’inscription à une formation",
    dateCreation: '2022-09-14T10:56:00+02:00',
    description2: 'Permis B',
    libelleCourt: 'Montage dossier formation Permis B',
    droitsDemarche: {
      annulation: false,
      realisation: false,
      replanification: true,
      modificationDate: false
    },
    libellePourquoi: 'Ma formation professionnelle',
    origineCreateur: 'CONSEILLER',
    origineDemarche: 'JRE_CONSEILLER',
    dateModification: '2022-09-21T10:31:00+02:00',
    origineModificateur: 'CONSEILLER'
  },
  {
    etat: DemarcheDtoEtat.RE,
    quoi: 'Q15',
    type: 'demarcheExtDetailleOut',
    metier: 'ELS',
    comment: 'C15.04',
    dateFin: '2022-09-21T00:00:00+02:00',
    pourQuoi: 'P03',
    dateDebut: '2022-09-21T00:00:00+02:00',
    idDemarche: '233177122',
    libelleLong: 'Candidatures spontanées par un autre moyen',
    libelleQuoi: 'Candidatures spontanées',
    dateCreation: '2022-09-14T10:55:00+02:00',
    libelleCourt: 'Candidature spontanée',
    droitsDemarche: {
      annulation: false,
      realisation: false,
      replanification: true,
      modificationDate: false
    },
    libelleComment: 'Par un autre moyen',
    libellePourquoi: 'Mes candidatures',
    origineCreateur: 'CONSEILLER',
    origineDemarche: 'JRE_CONSEILLER',
    dateModification: '2022-09-21T10:43:00+02:00',
    origineModificateur: 'CONSEILLER'
  },
  {
    ou: 'ELS',
    etat: DemarcheDtoEtat.RE,
    quoi: 'Q17',
    type: 'demarcheExtDetailleOut',
    comment: 'C17.04',
    dateFin: '2022-09-12T00:00:00+02:00',
    pourQuoi: 'P04',
    dateDebut: '2022-09-12T00:00:00+02:00',
    idDemarche: '233176863',
    libelleLong: "Préparation des entretiens d'embauche par un autre moyen",
    libelleQuoi: "Préparation des entretiens d'embauche",
    dateCreation: '2022-09-14T10:55:00+02:00',
    libelleCourt: "Préparation entretiens d'embauche avec ELS",
    droitsDemarche: {
      annulation: false,
      realisation: false,
      replanification: true,
      modificationDate: false
    },
    libelleComment: 'Par un autre moyen',
    libellePourquoi: "Mes entretiens d'embauche",
    origineCreateur: 'CONSEILLER',
    origineDemarche: 'JRE_CONSEILLER'
  },
  {
    etat: DemarcheDtoEtat.RE,
    quoi: 'Q18',
    type: 'demarcheExtDetailleOut',
    metier: 'ELS',
    comment: 'C18.03',
    dateFin: '2022-09-13T00:00:00+02:00',
    pourQuoi: 'P04',
    dateDebut: '2022-09-13T00:00:00+02:00',
    organisme: 'Leaderprice',
    idDemarche: '233176610',
    libelleLong: "Réalisation d'entretiens d'embauche par un autre moyen",
    libelleQuoi: "Réalisation d'entretiens d'embauche",
    dateCreation: '2022-09-14T10:54:00+02:00',
    libelleCourt: "Entretiens d'embauche dans l'entreprise Leaderprice",
    droitsDemarche: {
      annulation: false,
      realisation: false,
      replanification: true,
      modificationDate: false
    },
    libelleComment: 'Par un autre moyen',
    libellePourquoi: "Mes entretiens d'embauche",
    origineCreateur: 'CONSEILLER',
    origineDemarche: 'JRE_CONSEILLER'
  },
  {
    etat: DemarcheDtoEtat.RE,
    quoi: 'Q22',
    type: 'demarcheExtDetailleOut',
    comment: 'C22.01',
    dateFin: '2022-10-24T00:00:00+02:00',
    pourQuoi: 'P05',
    dateDebut: '2022-10-24T00:00:00+02:00',
    idDemarche: '233178461',
    libelleLong:
      "Recherches pour créer ou reprendre une entreprise en participant à un atelier, une prestation, une réunion d'information",
    libelleQuoi: 'Recherches pour créer ou reprendre une entreprise',
    dateCreation: '2022-09-14T00:00:00+02:00',
    libelleCourt: "Atelier M'imaginer Créateur d'entreprise",
    droitsDemarche: {
      annulation: false,
      realisation: false,
      replanification: false,
      modificationDate: false
    },
    libelleComment:
      "En participant à un atelier, une prestation, une réunion d'information",
    libellePourquoi: "Ma création ou reprise d'entreprise",
    origineCreateur: 'CONSEILLER',
    origineDemarche: 'ACTION',
    dateModification: '2022-10-25T01:19:00+02:00',
    origineModificateur: 'CONSEILLER'
  },
  {
    etat: DemarcheDtoEtat.RE,
    quoi: 'Q36',
    type: 'demarcheExtDetailleOut',
    contact: 'ENTRETIEN INDIVIDUEL PHYSIQUE',
    dateFin: '2022-09-14T00:00:00+02:00',
    pourQuoi: 'P06',
    dateDebut: '2022-09-14T00:00:00+02:00',
    idDemarche: '233181828',
    libelleLong: 'Entretien de suivi personnalisé',
    libelleQuoi: 'Vous avez eu un',
    dateCreation: '2022-09-14T00:00:00+02:00',
    description2: 'Entretien de suivi personnalisé',
    libelleCourt: 'Entretien de suivi personnalisé',
    droitsDemarche: {
      annulation: false,
      realisation: false,
      replanification: false,
      modificationDate: false
    },
    libellePourquoi: 'Mes entretiens avec un conseiller',
    origineCreateur: 'CONSEILLER',
    origineDemarche: 'ENTRETIEN'
  },
  {
    etat: DemarcheDtoEtat.RE,
    quoi: 'Q36',
    type: 'demarcheExtDetailleOut',
    contact: 'ECHANGE COURRIEL',
    dateFin: '2022-09-08T00:00:00+02:00',
    pourQuoi: 'P06',
    dateDebut: '2022-09-08T00:00:00+02:00',
    idDemarche: '232024015',
    libelleLong: 'Echange(s) courriel(s)',
    libelleQuoi: 'Vous avez eu un',
    dateCreation: '2022-09-08T00:00:00+02:00',
    description2: 'Echange(s) courriel(s)',
    libelleCourt: 'Echange(s) courriel(s)',
    droitsDemarche: {
      annulation: false,
      realisation: false,
      replanification: false,
      modificationDate: false
    },
    libellePourquoi: 'Mes entretiens avec un conseiller',
    origineCreateur: 'CONSEILLER',
    origineDemarche: 'ENTRETIEN'
  },
  {
    etat: DemarcheDtoEtat.RE,
    quoi: 'Q36',
    type: 'demarcheExtDetailleOut',
    contact: 'ECHANGE COURRIEL',
    dateFin: '2022-08-26T00:00:00+02:00',
    pourQuoi: 'P06',
    dateDebut: '2022-08-26T00:00:00+02:00',
    idDemarche: '228846449',
    libelleLong: 'Echange(s) courriel(s)',
    libelleQuoi: 'Vous avez eu un',
    dateCreation: '2022-08-26T00:00:00+02:00',
    description2: 'Echange(s) courriel(s)',
    libelleCourt: 'Echange(s) courriel(s)',
    droitsDemarche: {
      annulation: false,
      realisation: false,
      replanification: false,
      modificationDate: false
    },
    libellePourquoi: 'Mes entretiens avec un conseiller',
    origineCreateur: 'CONSEILLER',
    origineDemarche: 'ENTRETIEN'
  },
  {
    etat: DemarcheDtoEtat.RE,
    quoi: 'Q36',
    type: 'demarcheExtDetailleOut',
    contact: 'ECHANGE COURRIEL',
    dateFin: '2022-08-24T00:00:00+02:00',
    pourQuoi: 'P06',
    dateDebut: '2022-08-24T00:00:00+02:00',
    idDemarche: '228243492',
    libelleLong: 'Echange(s) courriel(s)',
    libelleQuoi: 'Vous avez eu un',
    dateCreation: '2022-08-24T00:00:00+02:00',
    description2: 'Echange(s) courriel(s)',
    libelleCourt: 'Echange(s) courriel(s)',
    droitsDemarche: {
      annulation: false,
      realisation: false,
      replanification: false,
      modificationDate: false
    },
    libellePourquoi: 'Mes entretiens avec un conseiller',
    origineCreateur: 'CONSEILLER',
    origineDemarche: 'ENTRETIEN'
  },
  {
    etat: DemarcheDtoEtat.RE,
    quoi: 'Q38',
    type: 'demarcheExtDetailleOut',
    dateFin: '2022-08-23T00:00:00+02:00',
    pourQuoi: 'P01',
    dateDebut: '2022-08-23T00:00:00+02:00',
    idDemarche: '228120488',
    description: 'Rectification du CV réalisé.',
    libelleLong: 'Action issue de l’application CEJ',
    libelleQuoi: 'Action issue de l’application CEJ',
    dateCreation: '2022-08-23T14:00:00+02:00',
    libelleCourt: 'Action issue de l’application CEJ',
    droitsDemarche: {
      annulation: true,
      realisation: false,
      replanification: true,
      modificationDate: false
    },
    libellePourquoi: 'Mon (nouveau) métier',
    origineCreateur: 'INDIVIDU',
    origineDemarche: 'PASS_EMPLOI',
    dateModification: '2022-08-24T08:39:00+02:00',
    origineModificateur: 'CONSEILLER'
  },
  {
    ou: 'Pôle emploi',
    etat: DemarcheDtoEtat.RE,
    quoi: 'Q11',
    type: 'demarcheExtDetailleOut',
    comment: 'C11.02',
    dateFin: '2022-08-20T14:48:00+02:00',
    pourQuoi: 'P03',
    dateDebut: '2022-08-20T14:48:00+02:00',
    idDemarche: '227640907',
    libelleLong:
      'Préparation de ses candidatures (CV, lettre de motivation, book) en créant ou en mettant à jour mon CV et ou ma lettre de motivation',
    libelleQuoi:
      'Préparation de ses candidatures (CV, lettre de motivation, book)',
    dateCreation: '2022-08-20T14:48:00+02:00',
    description2: 'CV PETITJEAN Brandon ELS',
    libelleCourt:
      'Préparation CV ou lettre de motivation :  CV PETITJEAN Brandon ELS',
    droitsDemarche: {
      annulation: false,
      realisation: false,
      replanification: false,
      modificationDate: false
    },
    libelleComment:
      'En créant ou en mettant à jour mon CV et ou ma lettre de motivation',
    libellePourquoi: 'Mes candidatures',
    origineCreateur: 'INDIVIDU',
    origineDemarche: 'CV'
  },
  {
    ou: 'Pôle emploi',
    etat: DemarcheDtoEtat.RE,
    quoi: 'Q11',
    type: 'demarcheExtDetailleOut',
    comment: 'C11.02',
    dateFin: '2022-08-20T14:48:00+02:00',
    pourQuoi: 'P03',
    dateDebut: '2022-08-20T14:48:00+02:00',
    idDemarche: '227640908',
    libelleLong:
      'Préparation de ses candidatures (CV, lettre de motivation, book) en créant ou en mettant à jour mon CV et ou ma lettre de motivation',
    libelleQuoi:
      'Préparation de ses candidatures (CV, lettre de motivation, book)',
    dateCreation: '2022-08-20T14:48:00+02:00',
    description2: 'CV PETITJEAN Brandon',
    libelleCourt:
      'Préparation CV ou lettre de motivation :  CV PETITJEAN Brandon',
    droitsDemarche: {
      annulation: false,
      realisation: false,
      replanification: false,
      modificationDate: false
    },
    libelleComment:
      'En créant ou en mettant à jour mon CV et ou ma lettre de motivation',
    libellePourquoi: 'Mes candidatures',
    origineCreateur: 'INDIVIDU',
    origineDemarche: 'CV'
  },
  {
    etat: DemarcheDtoEtat.RE,
    quoi: 'Q38',
    type: 'demarcheExtDetailleOut',
    dateFin: '2022-08-20T00:00:00+02:00',
    pourQuoi: 'P01',
    dateDebut: '2022-08-20T00:00:00+02:00',
    idDemarche: '227643152',
    description: ' Avancement PIX',
    libelleLong: 'Action issue de l’application CEJ',
    libelleQuoi: 'Action issue de l’application CEJ',
    dateCreation: '2022-08-20T14:00:00+02:00',
    libelleCourt: 'Action issue de l’application CEJ',
    droitsDemarche: {
      annulation: true,
      realisation: false,
      replanification: true,
      modificationDate: false
    },
    libellePourquoi: 'Mon (nouveau) métier',
    origineCreateur: 'INDIVIDU',
    origineDemarche: 'PASS_EMPLOI',
    dateModification: '2022-08-24T08:39:00+02:00',
    origineModificateur: 'CONSEILLER'
  },
  {
    etat: DemarcheDtoEtat.RE,
    quoi: 'Q38',
    type: 'demarcheExtDetailleOut',
    dateFin: '2022-08-21T00:00:00+02:00',
    pourQuoi: 'P01',
    dateDebut: '2022-08-21T00:00:00+02:00',
    idDemarche: '227644340',
    description: 'Recherche sur les site donner lors de la réunion.',
    libelleLong: 'Action issue de l’application CEJ',
    libelleQuoi: 'Action issue de l’application CEJ',
    dateCreation: '2022-08-20T14:00:00+02:00',
    libelleCourt: 'Action issue de l’application CEJ',
    droitsDemarche: {
      annulation: true,
      realisation: false,
      replanification: true,
      modificationDate: false
    },
    libellePourquoi: 'Mon (nouveau) métier',
    origineCreateur: 'INDIVIDU',
    origineDemarche: 'PASS_EMPLOI',
    dateModification: '2022-08-24T08:39:00+02:00',
    origineModificateur: 'CONSEILLER'
  },
  {
    ou: 'Pôle emploi',
    etat: DemarcheDtoEtat.RE,
    quoi: 'Q11',
    type: 'demarcheExtDetailleOut',
    comment: 'C11.02',
    dateFin: '2022-08-18T08:18:00+02:00',
    pourQuoi: 'P03',
    dateDebut: '2022-08-18T08:18:00+02:00',
    idDemarche: '227217531',
    libelleLong:
      'Préparation de ses candidatures (CV, lettre de motivation, book) en créant ou en mettant à jour mon CV et ou ma lettre de motivation',
    libelleQuoi:
      'Préparation de ses candidatures (CV, lettre de motivation, book)',
    dateCreation: '2022-08-18T08:18:00+02:00',
    description2: 'CV PETITJEAN Brandon ELS',
    libelleCourt:
      'Préparation CV ou lettre de motivation :  CV PETITJEAN Brandon ELS',
    droitsDemarche: {
      annulation: false,
      realisation: false,
      replanification: false,
      modificationDate: false
    },
    libelleComment:
      'En créant ou en mettant à jour mon CV et ou ma lettre de motivation',
    libellePourquoi: 'Mes candidatures',
    origineCreateur: 'INDIVIDU',
    origineDemarche: 'CV'
  },
  {
    ou: 'Pôle emploi',
    etat: DemarcheDtoEtat.RE,
    quoi: 'Q11',
    type: 'demarcheExtDetailleOut',
    comment: 'C11.02',
    dateFin: '2022-08-18T08:18:00+02:00',
    pourQuoi: 'P03',
    dateDebut: '2022-08-18T08:18:00+02:00',
    idDemarche: '227217530',
    libelleLong:
      'Préparation de ses candidatures (CV, lettre de motivation, book) en créant ou en mettant à jour mon CV et ou ma lettre de motivation',
    libelleQuoi:
      'Préparation de ses candidatures (CV, lettre de motivation, book)',
    dateCreation: '2022-08-18T08:18:00+02:00',
    description2: 'CV PETITJEAN Brandon',
    libelleCourt:
      'Préparation CV ou lettre de motivation :  CV PETITJEAN Brandon',
    droitsDemarche: {
      annulation: false,
      realisation: false,
      replanification: false,
      modificationDate: false
    },
    libelleComment:
      'En créant ou en mettant à jour mon CV et ou ma lettre de motivation',
    libellePourquoi: 'Mes candidatures',
    origineCreateur: 'INDIVIDU',
    origineDemarche: 'CV'
  },
  {
    etat: DemarcheDtoEtat.AC,
    quoi: 'Q08',
    type: 'demarcheExtDetailleOut',
    dateFin: '2022-03-15T00:00:00+01:00',
    pourQuoi: 'P02',
    dateDebut: '2022-09-15T00:00:00+02:00',
    organisme: 'CER Daumet',
    idDemarche: '231256883',
    libelleLong: 'Participation à une formation',
    libelleQuoi: 'Participation à une formation',
    dateCreation: '2022-08-18T00:00:00+02:00',
    description2: 'Formation',
    libelleCourt:
      'Formation conduite auto Permis de conduire categorie B avec CER Daumet',
    droitsDemarche: {
      annulation: false,
      realisation: false,
      replanification: false,
      modificationDate: false
    },
    libellePourquoi: 'Ma formation professionnelle',
    origineCreateur: 'CONSEILLER',
    origineDemarche: 'ACTION',
    dateModification: '2022-09-28T16:30:00+02:00',
    origineModificateur: 'CONSEILLER'
  },
  {
    etat: DemarcheDtoEtat.RE,
    quoi: 'Q36',
    type: 'demarcheExtDetailleOut',
    contact: 'ENTRETIEN COLLECTIF PHYSIQUE',
    dateFin: '2022-08-18T00:00:00+02:00',
    pourQuoi: 'P06',
    dateDebut: '2022-08-18T00:00:00+02:00',
    idDemarche: '227279713',
    libelleLong: 'Entretien de suivi personnalisé',
    libelleQuoi: 'Vous avez eu un',
    dateCreation: '2022-08-18T00:00:00+02:00',
    description2: 'Entretien de suivi personnalisé',
    libelleCourt: 'Entretien de suivi personnalisé',
    droitsDemarche: {
      annulation: false,
      realisation: false,
      replanification: false,
      modificationDate: false
    },
    libellePourquoi: 'Mes entretiens avec un conseiller',
    origineCreateur: 'CONSEILLER',
    origineDemarche: 'ENTRETIEN'
  },
  {
    ou: 'Pôle emploi',
    etat: DemarcheDtoEtat.RE,
    quoi: 'Q11',
    type: 'demarcheExtDetailleOut',
    comment: 'C11.02',
    dateFin: '2022-08-17T15:44:00+02:00',
    pourQuoi: 'P03',
    dateDebut: '2022-08-17T15:44:00+02:00',
    idDemarche: '227135475',
    libelleLong:
      'Préparation de ses candidatures (CV, lettre de motivation, book) en créant ou en mettant à jour mon CV et ou ma lettre de motivation',
    libelleQuoi:
      'Préparation de ses candidatures (CV, lettre de motivation, book)',
    dateCreation: '2022-08-17T15:44:00+02:00',
    description2: 'CV PETITJEAN Brandon ELS',
    libelleCourt:
      'Préparation CV ou lettre de motivation :  CV PETITJEAN Brandon ELS',
    droitsDemarche: {
      annulation: false,
      realisation: false,
      replanification: false,
      modificationDate: false
    },
    libelleComment:
      'En créant ou en mettant à jour mon CV et ou ma lettre de motivation',
    libellePourquoi: 'Mes candidatures',
    origineCreateur: 'INDIVIDU',
    origineDemarche: 'CV'
  },
  {
    ou: 'Pôle emploi',
    etat: DemarcheDtoEtat.RE,
    quoi: 'Q11',
    type: 'demarcheExtDetailleOut',
    comment: 'C11.02',
    dateFin: '2022-08-17T15:39:00+02:00',
    pourQuoi: 'P03',
    dateDebut: '2022-08-17T15:39:00+02:00',
    idDemarche: '227135474',
    libelleLong:
      'Préparation de ses candidatures (CV, lettre de motivation, book) en créant ou en mettant à jour mon CV et ou ma lettre de motivation',
    libelleQuoi:
      'Préparation de ses candidatures (CV, lettre de motivation, book)',
    dateCreation: '2022-08-17T15:39:00+02:00',
    description2: 'CV PETITJEAN Brandon',
    libelleCourt:
      'Préparation CV ou lettre de motivation :  CV PETITJEAN Brandon',
    droitsDemarche: {
      annulation: false,
      realisation: false,
      replanification: false,
      modificationDate: false
    },
    libelleComment:
      'En créant ou en mettant à jour mon CV et ou ma lettre de motivation',
    libellePourquoi: 'Mes candidatures',
    origineCreateur: 'INDIVIDU',
    origineDemarche: 'CV'
  },
  {
    etat: DemarcheDtoEtat.RE,
    quoi: 'Q14',
    type: 'demarcheExtDetailleOut',
    dateFin: '2022-08-22T00:00:00+02:00',
    pourQuoi: 'P03',
    dateDebut: '2022-08-22T00:00:00+02:00',
    organisme: 'Multi-service',
    idDemarche: '227112152',
    libelleLong: "Réponse à des offres d'emploi",
    libelleQuoi: "Réponse à des offres d'emploi",
    dateCreation: '2022-08-17T14:52:00+02:00',
    libelleCourt: "Réponse à l'offre de Multi-service",
    droitsDemarche: {
      annulation: false,
      realisation: false,
      replanification: true,
      modificationDate: false
    },
    libellePourquoi: 'Mes candidatures',
    origineCreateur: 'CONSEILLER',
    origineDemarche: 'JRE_CONSEILLER',
    dateModification: '2022-09-14T10:38:00+02:00',
    origineModificateur: 'CONSEILLER'
  },
  {
    etat: DemarcheDtoEtat.RE,
    quoi: 'Q14',
    type: 'demarcheExtDetailleOut',
    dateFin: '2022-08-22T00:00:00+02:00',
    pourQuoi: 'P03',
    dateDebut: '2022-08-22T00:00:00+02:00',
    organisme: 'ELS',
    idDemarche: '227111709',
    libelleLong: "Réponse à des offres d'emploi",
    libelleQuoi: "Réponse à des offres d'emploi",
    dateCreation: '2022-08-17T14:51:00+02:00',
    libelleCourt: "Réponse à l'offre de ELS",
    droitsDemarche: {
      annulation: false,
      realisation: false,
      replanification: true,
      modificationDate: false
    },
    libellePourquoi: 'Mes candidatures',
    origineCreateur: 'CONSEILLER',
    origineDemarche: 'JRE_CONSEILLER',
    dateModification: '2022-09-14T10:38:00+02:00',
    origineModificateur: 'CONSEILLER'
  },
  {
    etat: DemarcheDtoEtat.AN,
    quoi: 'Q22',
    type: 'demarcheExtDetailleOut',
    comment: 'C22.01',
    dateFin: '2022-09-02T00:00:00+02:00',
    pourQuoi: 'P05',
    dateDebut: '2022-09-02T00:00:00+02:00',
    idDemarche: '227110524',
    libelleLong:
      "Recherches pour créer ou reprendre une entreprise en participant à un atelier, une prestation, une réunion d'information",
    libelleQuoi: 'Recherches pour créer ou reprendre une entreprise',
    dateCreation: '2022-08-17T00:00:00+02:00',
    libelleCourt: "Atelier M'imaginer Créateur d'entreprise",
    dateAnnulation: '2022-09-02T00:00:00+02:00',
    droitsDemarche: {
      annulation: false,
      realisation: false,
      replanification: false,
      modificationDate: false
    },
    libelleComment:
      "En participant à un atelier, une prestation, une réunion d'information",
    libellePourquoi: "Ma création ou reprise d'entreprise",
    origineCreateur: 'CONSEILLER',
    origineDemarche: 'ACTION',
    dateModification: '2022-09-06T01:28:00+02:00',
    origineModificateur: 'CONSEILLER'
  },
  {
    etat: DemarcheDtoEtat.RE,
    quoi: 'Q36',
    type: 'demarcheExtDetailleOut',
    contact: 'ENTRETIEN INDIVIDUEL TELEPHONI',
    dateFin: '2022-08-17T00:00:00+02:00',
    pourQuoi: 'P06',
    dateDebut: '2022-08-17T00:00:00+02:00',
    idDemarche: '227119093',
    libelleLong: 'Entretien de suivi personnalisé',
    libelleQuoi: 'Vous avez eu un',
    dateCreation: '2022-08-17T00:00:00+02:00',
    description2: 'Entretien de suivi personnalisé',
    libelleCourt: 'Entretien de suivi personnalisé',
    droitsDemarche: {
      annulation: false,
      realisation: false,
      replanification: false,
      modificationDate: false
    },
    libellePourquoi: 'Mes entretiens avec un conseiller',
    origineCreateur: 'CONSEILLER',
    origineDemarche: 'ENTRETIEN'
  }
]
