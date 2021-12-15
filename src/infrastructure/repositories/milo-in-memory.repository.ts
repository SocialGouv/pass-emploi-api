import { Injectable } from '@nestjs/common'
import { Milo } from '../../domain/milo'

@Injectable()
export class MiloInMemoryRepository implements Milo.Repository {
  dossiers: Milo.Dossier[]

  constructor() {
    this.dossiers = [unDossierMiloAvecEmail(), unDossierMiloSansEmail()]
  }

  async getDossier(idDossier: string): Promise<Milo.Dossier | undefined> {
    return this.dossiers.find(dossier => dossier.id === idDossier)
  }
}

const unDossierMiloAvecEmail = (): Milo.Dossier => ({
  id: '1',
  nom: 'Dawson',
  prenom: 'Jack',
  dateDeNaissance: '1888-09-01',
  email: 'jack.dawson@milo.com'
})

const unDossierMiloSansEmail = (): Milo.Dossier => ({
  id: '2',
  nom: 'Dylan',
  prenom: 'Bob',
  dateDeNaissance: '1941-05-24'
})
