// Briques communes aux widgets et aux activités en direct : le minimoa dans son panneau, la mèche de la série,
// la jauge de sociabilité. Couleurs : `BlowyTokens` (généré depuis packages/tokens au prebuild).

import SwiftUI
import UIKit
import WidgetKit

// MARK: - Couleurs

extension BlowyTokens {
  /// Fond des widgets : nuit en sombre, blanc en clair.
  static let surface = Color(UIColor { $0.userInterfaceStyle == .dark ? UIColor(BlowyTokens.panel) : UIColor(BlowyTokens.white) })

  /// Panneau derrière le minimoa : dégradé de son espèce, lie-de-vin quand il boude (comme l'accueil de l'app).
  static func panelColors(species: String, shape: String) -> [Color] {
    let name = shape == "boude" ? "wine" : (speciesGradient[species] ?? "accent")
    return gradients[name] ?? [accent, accent]
  }
}

// MARK: - Minimoa

/// Le minimoa dans son état : buste selon la forme, couleurs éteintes quand il boude.
struct PetImage: View {
  let pet: BlowyPet
  let shape: String

  var body: some View {
    Image(pet.imageName(shape: shape))
      .resizable()
      .blowyAccentedRendering()
      .scaledToFit()
      .saturation(shape == "boude" ? 0.55 : 1)
      .brightness(shape == "boude" ? -0.12 : 0)
      .accessibilityHidden(true)
  }
}

/// Visage du minimoa dans une pastille de son panneau (Dynamic Island, bannière, petit widget).
struct PetBadge: View {
  let pet: BlowyPet
  var shape = "en_forme"
  var small = false
  @Environment(\.widgetRenderingMode) private var renderingMode

  var body: some View {
    ZStack {
      if renderingMode == .fullColor {
        Circle().fill(LinearGradient(colors: BlowyTokens.panelColors(species: pet.safeSpecies, shape: shape), startPoint: .top, endPoint: .bottom))
      }
      Image(small ? pet.smallFaceImageName : pet.faceImageName)
        .resizable()
        .blowyAccentedRendering()
        .scaledToFit()
        .padding(small ? 2 : 4)
        .clipShape(Circle())
    }
    .accessibilityHidden(true)
  }
}

// MARK: - Série et sociabilité

/// Mèche + nombre : « 🔥 12 ».
struct StreakLabel: View {
  let streak: Int
  var font: Font = .system(size: 14, weight: .heavy, design: .rounded)

  var body: some View {
    HStack(spacing: 3) {
      Image(systemName: "flame.fill")
        .foregroundStyle(BlowyTokens.orange)
        .widgetAccentable()
      Text(streak, format: .number)
    }
    .font(font)
    .accessibilityElement(children: .ignore)
    .accessibilityLabel(Text("streak.days \(streak)"))
  }
}

/// Barre de sociabilité (accent sur piste discrète).
struct SociabilityBar: View {
  let value: Int
  var height: CGFloat = 6

  var body: some View {
    GeometryReader { geo in
      ZStack(alignment: .leading) {
        Capsule().fill(Color.primary.opacity(0.15))
        Capsule()
          .fill(BlowyTokens.accent)
          .frame(width: max(height, geo.size.width * CGFloat(min(max(value, 0), 100)) / 100))
          .widgetAccentable()
      }
    }
    .frame(height: height)
    .accessibilityElement(children: .ignore)
    .accessibilityLabel(Text("sociability"))
    .accessibilityValue(Text(Double(value) / 100, format: .percent))
  }
}

/// Anneau de sociabilité autour du minimoa (petit widget).
struct SociabilityRing<Content: View>: View {
  let value: Int
  var lineWidth: CGFloat = 7
  @ViewBuilder let content: Content

  var body: some View {
    ZStack {
      Circle().stroke(Color.primary.opacity(0.15), lineWidth: lineWidth)
      Circle()
        .trim(from: 0, to: CGFloat(min(max(value, 0), 100)) / 100)
        .stroke(BlowyTokens.accent, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
        .rotationEffect(.degrees(-90))
        .widgetAccentable()
      content.padding(lineWidth + 3)
    }
    .accessibilityElement(children: .ignore)
    .accessibilityLabel(Text("sociability"))
    .accessibilityValue(Text(Double(value) / 100, format: .percent))
  }
}

// MARK: - Modes de rendu

extension Image {
  /// Écran d'accueil teinté ou transparent (iOS 18+) : le minimoa passe en niveaux de gris teintés plutôt
  /// qu'en silhouette pleine. En couleur ailleurs. À appeler sur l'`Image` elle-même (avant `scaledToFit`).
  @ViewBuilder
  func blowyAccentedRendering() -> some View {
    if #available(iOS 18.0, *) {
      self.widgetAccentedRenderingMode(.accentedDesaturated)
    } else {
      self
    }
  }
}

extension BlowyPet {
  /// Visage réduit pour les activités en direct (Apple : pas d'image plus grande que l'emplacement).
  var smallFaceImageName: String { "\(safeSpecies)_face_small" }
}

/// Exemple montré dans la galerie des widgets et pendant le chargement.
extension BlowyEntry {
  static let sample = BlowyEntry(
    date: .now,
    pet: BlowyPet(name: "Nino", species: "nino"),
    frame: BlowyFrame(at: Date.now.timeIntervalSince1970, sociability: 64, shape: "en_forme", streak: 12, challenge: "todo", challengeText: nil),
    url: BlowyEntry.defaultURL
  )
}
