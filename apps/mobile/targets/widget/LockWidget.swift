// Widgets de l'écran verrouillé : rond (le visage du minimoa dans la jauge de sociabilité) et rectangulaire
// (la série, le défi du jour à faire). Rendu « vibrant » : monochrome, le système teinte tout.

import SwiftUI
import WidgetKit

struct BlowyLockWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: BlowyStore.lockWidgetKind, provider: BlowyProvider()) { entry in
      BlowyLockView(entry: entry)
    }
    .configurationDisplayName("widget.lock.name")
    .description("widget.lock.description")
    .supportedFamilies([.accessoryCircular, .accessoryRectangular])
  }
}

struct BlowyLockView: View {
  let entry: BlowyEntry
  @Environment(\.widgetFamily) private var family

  var body: some View {
    Group {
      if family == .accessoryCircular {
        CircularView(entry: entry)
      } else {
        RectangularView(entry: entry)
      }
    }
    .widgetURL(entry.url)
    .containerBackground(for: .widget) { Color.clear }
  }
}

private struct CircularView: View {
  let entry: BlowyEntry

  var body: some View {
    ZStack {
      AccessoryWidgetBackground()
      if let pet = entry.pet, let frame = entry.frame {
        Gauge(value: Double(frame.sociability), in: 0...100) {
          Text("sociability")
        } currentValueLabel: {
          Image(pet.faceImageName)
            .resizable()
            .scaledToFit()
            .clipShape(Circle())
            .padding(1)
        }
        .gaugeStyle(.accessoryCircularCapacity)
        .widgetAccentable()
        .accessibilityLabel(Text("a11y.pet \(pet.name)"))
      } else {
        Image(systemName: "flame.fill").font(.title2)
      }
    }
  }
}

private struct RectangularView: View {
  let entry: BlowyEntry

  var body: some View {
    if let frame = entry.frame {
      VStack(alignment: .leading, spacing: 1) {
        HStack(spacing: 4) {
          Image(systemName: "flame.fill").widgetAccentable()
          Text("streak.series \(frame.streak)")
        }
        .font(.system(size: 15, weight: .heavy, design: .rounded))
        Group {
          if frame.challengeDone {
            Text("challenge.done")
          } else if let text = frame.challengeText, !text.isEmpty {
            Text("challenge.prefix \(text)")
          } else {
            Text("challenge.todo")
          }
        }
        .font(.system(size: 13, weight: .medium, design: .rounded))
        .lineLimit(2)
        .foregroundStyle(.secondary)
      }
      .frame(maxWidth: .infinity, alignment: .leading)
      .accessibilityElement(children: .combine)
    } else {
      EmptyWidgetView(compact: true)
    }
  }
}
