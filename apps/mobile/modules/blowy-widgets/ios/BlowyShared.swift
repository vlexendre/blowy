// Modèle partagé par l'app (module BlowyWidgets) et l'extension (widgets et activités en direct).
// Source unique : ce fichier. Le plugin `plugins/with-blowy-widgets.js` le recopie tel quel dans
// `targets/widget/Generated/` à chaque prebuild ; ne pas modifier la copie.
//
// Règles d'encodage : JSON par défaut de Foundation, sans stratégie (ActivityKit décode les push ainsi).
// Les dates sont des nombres de secondes Unix (`Double`), jamais des `Date` encodées.

import Foundation
#if canImport(ActivityKit)
import ActivityKit
#endif

// MARK: - Groupe d'apps

enum BlowyStore {
  /// Clé de l'état des widgets dans les réglages partagés.
  static let snapshotKey = "blowy.widget.snapshot"
  /// Identifiants des widgets (`kind`), à recharger quand l'état change.
  static let homeWidgetKind = "BlowyHomeWidget"
  static let lockWidgetKind = "BlowyLockWidget"

  /// `group.<identifiant de l'app>`. Apple impose que l'identifiant d'une extension soit celui de l'app suivi
  /// d'un composant : depuis l'extension, on retire ce dernier composant.
  static var appGroup: String {
    let bundle = Bundle.main
    let id = bundle.bundleIdentifier ?? "app.blowy"
    let isExtension = bundle.bundleURL.pathExtension == "appex"
    let appId = isExtension ? id.split(separator: ".").dropLast().joined(separator: ".") : id
    return "group." + appId
  }

  static var defaults: UserDefaults? { UserDefaults(suiteName: appGroup) }

  static func readSnapshot() -> BlowySnapshot? {
    guard let data = defaults?.data(forKey: snapshotKey) else { return nil }
    return try? JSONDecoder().decode(BlowySnapshot.self, from: data)
  }
}

// MARK: - Minimoa

/// Le minimoa tel que les widgets et les activités le montrent.
struct BlowyPet: Codable, Hashable {
  var name: String
  /// nino · suzie · gaston · pia (une valeur inconnue retombe sur nino).
  var species: String

  var safeSpecies: String {
    ["nino", "suzie", "gaston", "pia"].contains(species) ? species : "nino"
  }

  /// Buste selon la forme : en forme → joie, bof → neutre, boude → triste.
  func imageName(shape: String) -> String {
    let pose: String
    switch shape {
    case "en_forme": pose = "joie"
    case "boude": pose = "triste"
    default: pose = "neutre"
    }
    return "\(safeSpecies)_\(pose)"
  }

  /// Visage carré (écran verrouillé rond, Dynamic Island).
  var faceImageName: String { "\(safeSpecies)_face" }
}

// MARK: - Widgets

/// État publié par l'app : le minimoa et une suite de moments calculés d'avance (frames).
/// Le widget n'a aucune règle : il montre la frame dont l'heure est passée.
struct BlowySnapshot: Codable, Hashable {
  static let currentVersion = 1

  var v: Int
  var pet: BlowyPet
  /// Lien profond ouvert au toucher.
  var url: String
  var frames: [BlowyFrame]
}

struct BlowyFrame: Codable, Hashable {
  /// Début de validité, en secondes Unix.
  var at: Double
  /// Sociabilité, de 0 à 100.
  var sociability: Int
  /// en_forme · bof · boude
  var shape: String
  var streak: Int
  /// todo · accepted · done
  var challenge: String
  /// Texte du défi, déjà dans la langue de la personne ; nil : phrase générique.
  var challengeText: String?

  var date: Date { Date(timeIntervalSince1970: at) }
  var challengeDone: Bool { challenge == "done" }
}

// MARK: - Activités en direct

#if canImport(ActivityKit)
/// Une seule définition pour les trois activités (défi accepté, série d'un lien, sortie).
/// Le nom du type est la valeur `attributes-type` des push de démarrage : ne pas le renommer.
struct BlowyActivityAttributes: ActivityAttributes {
  struct ContentState: Codable, Hashable {
    /// Fin, en secondes Unix.
    var endsAt: Double
    /// Série en jeu, du défi ou du lien (0 : rien à montrer).
    var streak: Int
    /// Texte du défi ; nil : phrase générique.
    var title: String?
    /// C'est fait : état final.
    var done: Bool

    var endDate: Date { Date(timeIntervalSince1970: endsAt) }
  }

  /// challenge · link · outing
  var kind: String
  var pet: BlowyPet
  /// Début, en secondes Unix.
  var startedAt: Double
  var url: String
  /// link : prénom de l'autre personne du lien.
  var otherName: String?

  var startDate: Date { Date(timeIntervalSince1970: startedAt) }
}
#endif
