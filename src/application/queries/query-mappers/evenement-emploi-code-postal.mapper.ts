import { Injectable } from '@nestjs/common'

type VilleAvecPlusieursCodePostaux =
  | 'AIX_EN_PROVENCE'
  | 'AJACCIO'
  | 'AMIENS'
  | 'ANGERS'
  | 'ANTIBES'
  | 'AUXERRE'
  | 'BASTIA'
  | 'BORDEAUX'
  | 'CANNES'
  | 'CLERMONT_FERRAND'
  | 'DUNKERQUE'
  | 'GRENOBLE'
  | 'GRASSE'
  | 'LE_HAVRE'
  | 'LE_MANS'
  | 'LILLE'
  | 'LIMOGES'
  | 'LYON'
  | 'MARSEILLE'
  | 'METZ'
  | 'MEUDON'
  | 'MONTPELLIER'
  | 'MULHOUSE'
  | 'NANCY'
  | 'NANTES'
  | 'NICE'
  | 'NIMES'
  | 'ORLEANS'
  | 'PARIS'
  | 'PERPIGNAN'
  | 'RENNES'
  | 'ROUEN'
  | 'SAINT_DENIS_METROPOLE'
  | 'SAINT_DENIS_REUNION'
  | 'SAINT_ETIENNE'
  | 'SAINT_MAUR_DES_FOSSES'
  | 'STRASBOURG'
  | 'TOULON'
  | 'TOULOUSE'
  | 'TOURS'
  | 'VILLENEUVE_D_ASCQ'

const villesToCodePostauxAssocies: Record<
  VilleAvecPlusieursCodePostaux,
  string[]
> = {
  AIX_EN_PROVENCE: ['13080', '13090', '13100'],
  AJACCIO: ['20000', '20090'],
  AMIENS: ['80000', '80080', '80090'],
  ANGERS: ['49000', '49100'],
  ANTIBES: ['06600', '06160'],
  AUXERRE: ['89000', '89290'],
  BASTIA: ['20200', '20600'],
  BORDEAUX: ['33000', '33100', '33200', '33300', '33800'],
  CANNES: ['06150', '06400'],
  CLERMONT_FERRAND: ['63000', '63100'],
  DUNKERQUE: ['59140', '59240', '59640'],
  GRENOBLE: ['38000', '38100'],
  GRASSE: ['06130', '06520'],
  LE_HAVRE: ['76600', '76610', '76620'],
  LE_MANS: ['72000', '72100'],
  LILLE: ['59000', '59160', '59260', '59777', '59800'],
  LIMOGES: ['87000', '87100', '87280'],
  LYON: [
    '69001',
    '69002',
    '69003',
    '69004',
    '69005',
    '69006',
    '69007',
    '69008',
    '69009'
  ],
  MARSEILLE: [
    '13001',
    '13002',
    '13003',
    '13004',
    '13005',
    '13006',
    '13007',
    '13008',
    '13009',
    '13010',
    '13011',
    '13012',
    '13013',
    '13014',
    '13015',
    '13016'
  ],
  METZ: ['57000', '57050', '57070'],
  MEUDON: ['92190', '92360'],
  MONTPELLIER: ['34000', '34070', '34080', '34090'],
  MULHOUSE: ['68100', '68200'],
  NANCY: ['54000', '54100'],
  NANTES: ['44000', '44100', '44200', '44300'],
  NICE: ['06000', '06100', '06200', '06300'],
  NIMES: ['30000', '30900'],
  ORLEANS: ['45000', '45100'],
  PARIS: [
    '75001',
    '75002',
    '75003',
    '75004',
    '75005',
    '75006',
    '75007',
    '75008',
    '75009',
    '75010',
    '75011',
    '75012',
    '75013',
    '75014',
    '75015',
    '75016',
    '75017',
    '75018',
    '75019',
    '75020'
  ],
  PERPIGNAN: ['66000', '66100'],
  RENNES: ['35000', '35200', '35700'],
  ROUEN: ['76000', '76100'],
  SAINT_DENIS_METROPOLE: ['93200', '93210'],
  SAINT_DENIS_REUNION: ['97417', '97400', '97490'],
  SAINT_ETIENNE: ['42000', '42100'],
  SAINT_MAUR_DES_FOSSES: ['94100', '94210'],
  STRASBOURG: ['67000', '67100', '67200'],
  TOULON: ['83000', '83100', '83200'],
  TOULOUSE: ['31000', '31100', '31200', '31300', '31400', '31500'],
  TOURS: ['37000', '37100', '37200'],
  VILLENEUVE_D_ASCQ: ['59493', '59494', '59650']
}

@Injectable()
export class EvenementEmploiCodePostalMapper {
  private readonly codePostalToCodePostauxAssocies: Map<string, string[]>

  constructor() {
    this.codePostalToCodePostauxAssocies = this.initCodePostauxMap()
  }

  getCodePostauxAssocies(codePostal: string): string[] {
    return this.codePostalToCodePostauxAssocies.get(codePostal) ?? [codePostal]
  }

  private initCodePostauxMap(): Map<string, string[]> {
    const codePostalToCodePostauxAssocies = new Map<string, string[]>()
    Object.entries(villesToCodePostauxAssocies).forEach(([_, codePostaux]) => {
      codePostaux.forEach(codePostal => {
        codePostalToCodePostauxAssocies.set(codePostal, codePostaux)
      })
    })
    return codePostalToCodePostauxAssocies
  }
}
