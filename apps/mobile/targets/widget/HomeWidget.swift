// Widgets de l'écran d'accueil (V6-GWidget) : petit (le minimoa dans l'anneau de sociabilité, la série)
// et moyen (le minimoa dans son panneau, sa sociabilité, la série et le séance du jour). Toucher ouvre l'accueil.

import SwiftUI
import WidgetKit

struct BlowyHomeWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: BlowyStore.homeWidgetKind, provider: BlowyProvider()) { entry in
      BlowyHomeView(entry: entry)
    }
    .configurationDisplayName("widget.home.name")
    .description("widget.home.description")
    .supportedFamilies([.systemSmall, .systemMedium])
    .contentMarginsDisabled()
  }
}

struct BlowyHomeView: View {
  let entry: BlowyEntry
  @Environment(\.widgetFamily) private var family

  var body: some View {
    Group {
      if let pet = entry.pet, let frame = entry.frame {
        if family == .systemMedium {
          MediumView(pet: pet, frame: frame)
        } else {
          SmallView(pet: pet, frame: frame)
        }
      } else {
        EmptyWidgetView().padding(16)
      }
    }
    .widgetURL(entry.url)
    .containerBackground(for: .widget) { BlowyTokens.surface }
  }
}

// MARK: - Petit

private struct SmallView: View {
  let pet: BlowyPet
  let frame: BlowyFrame
  @Environment(\.widgetRenderingMode) private var renderingMode

  var body: some View {
    VStack(spacing: 8) {
      SociabilityRing(value: frame.sociability, lineWidth: 6) {
        // Le buste (selon sa forme) dans une pastille de son panneau.
        ZStack(alignment: .bottom) {
          if renderingMode == .fullColor {
            Circle().fill(LinearGradient(colors: BlowyTokens.panelColors(species: pet.safeSpecies, shape: frame.shape), startPoint: .top, endPoint: .bottom))
          }
          PetImage(pet: pet, shape: frame.shape).padding(.top, 8)
        }
        .clipShape(Circle())
      }
      .frame(maxWidth: 104, maxHeight: 104)
      HStack(spacing: 4) {
        Image(systemName: "flame.fill").foregroundStyle(BlowyTokens.orange).widgetAccentable()
        Text("streak.days \(frame.streak)")
      }
      .font(.system(size: 14, weight: .heavy, design: .rounded))
      .lineLimit(1)
      .minimumScaleFactor(0.8)
    }
    .padding(12)
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .accessibilityElement(children: .combine)
    .accessibilityLabel(Text("a11y.pet \(pet.name)"))
  }
}

// MARK: - Moyen

private struct MediumView: View {
  let pet: BlowyPet
  let frame: BlowyFrame
  @Environment(\.widgetRenderingMode) private var renderingMode

  var body: some View {
    HStack(spacing: 12) {
      panel
        .frame(width: 118)
      VStack(alignment: .leading, spacing: 0) {
        HStack(alignment: .firstTextBaseline) {
          Text(verbatim: pet.name)
            .font(.system(size: 17, weight: .heavy, design: .rounded))
            .lineLimit(1)
          Spacer(minLength: 4)
          StreakLabel(streak: frame.streak)
        }
        Spacer(minLength: 6)
        HStack {
          Text("sociability").foregroundStyle(.secondary)
          Spacer()
          Text(Double(frame.sociability) / 100, format: .percent).fontWeight(.heavy)
        }
        .font(.system(size: 12, weight: .semibold, design: .rounded))
        SociabilityBar(value: frame.sociability)
          .padding(.top, 4)
        Spacer(minLength: 8)
        ChallengeLines(frame: frame)
      }
      .padding(.vertical, 14)
      .padding(.trailing, 14)
    }
  }

  /// Le minimoa dans son panneau coloré (en couleur seulement ; teinté, il se pose sans panneau).
  private var panel: some View {
    ZStack(alignment: .bottom) {
      if renderingMode == .fullColor {
        LinearGradient(colors: BlowyTokens.panelColors(species: pet.safeSpecies, shape: frame.shape), startPoint: .top, endPoint: .bottom)
      }
      PetImage(pet: pet, shape: frame.shape)
        .padding(.horizontal, 6)
        .padding(.top, 10)
    }
    .clipShape(ContainerRelativeShape().inset(by: 6))
    .accessibilityElement()
    .accessibilityLabel(Text("a11y.pet \(pet.name)"))
    .accessibilityValue(Text(LocalizedStringKey("shape." + frame.shape)))
  }
}

/// « Séance : … / Touche pour y aller », ou « Séance faite / Reviens demain ».
struct ChallengeLines: View {
  let frame: BlowyFrame

  var body: some View {
    VStack(alignment: .leading, spacing: 1) {
      if frame.challengeDone {
        Label { Text("challenge.done") } icon: { Image(systemName: "checkmark.circle.fill").foregroundStyle(BlowyTokens.ok).widgetAccentable() }
          .font(.system(size: 14, weight: .heavy, design: .rounded))
        Text("challenge.doneHint").font(.system(size: 12, weight: .medium, design: .rounded)).foregroundStyle(.secondary)
      } else {
        Group {
          if let text = frame.challengeText, !text.isEmpty {
            Text("challenge.prefix \(text)")
          } else {
            Text("challenge.generic")
          }
        }
        .font(.system(size: 14, weight: .heavy, design: .rounded))
        .lineLimit(2)
        .minimumScaleFactor(0.85)
        Text("challenge.tap").font(.system(size: 12, weight: .medium, design: .rounded)).foregroundStyle(.secondary)
      }
    }
  }
}
