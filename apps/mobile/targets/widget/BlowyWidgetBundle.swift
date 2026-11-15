// Point d'entrée de l'extension : widgets d'accueil et d'écran verrouillé, activités en direct.
// Modèle partagé avec l'app : Generated/BlowyShared.swift (copié au prebuild depuis modules/blowy-widgets/ios).

import SwiftUI
import WidgetKit

@main
struct BlowyWidgetBundle: WidgetBundle {
  var body: some Widget {
    BlowyHomeWidget()
    BlowyLockWidget()
    BlowyLiveActivity()
  }
}
