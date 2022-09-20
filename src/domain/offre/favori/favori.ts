import * as _Emploi from './offre-emploi'
import * as _Immersion from './offre-immersion'
import * as _ServiceCivique from './offre-service-civique'

export namespace Favori {
  // FIXME: le linter ne comprend pas cette technique 🤷‍️
  // eslint-disable-next-line  @typescript-eslint/no-unused-vars
  export import Emploi = _Emploi.Emploi
  // eslint-disable-next-line  @typescript-eslint/no-unused-vars
  export import Immersion = _Immersion.Immersion
  // eslint-disable-next-line  @typescript-eslint/no-unused-vars
  export import ServiceCivique = _ServiceCivique.ServiceCivique
  // eslint-disable-next-line  @typescript-eslint/no-unused-vars

  export enum Type {
    EMPLOI = 'OFFRE_EMPLOI',
    ALTERNANCE = 'OFFRE_ALTERNANCE',
    IMMERSION = 'OFFRE_IMMERSION',
    SERVICE_CIVIQUE = 'OFFRE_SERVICE_CIVIQUE'
  }
}
