// Activités en direct (V6-GWidget, écran verrouillé et île déployée) : le séance du jour accepté (temps restant
// jusqu'à minuit, série en jeu ; l'activité part au plus 8 h après son début), la série d'un lien le soir (« À toi
// d'écrire », sans prénom : l'écran verrouillé est visible de tous), une sortie en cours.
// Démarrées et terminées par l'app ; mises à jour par l'app ou par push APNs (type `liveactivity`).

import ActivityKit
import SwiftUI
import WidgetKit

struct BlowyLiveActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: BlowyActivityAttributes.self) { context in
      LockScreenActivityView(context: context)
        .activityBackgroundTint(BlowyTokens.night)
        .activitySystemActionForegroundColor(BlowyTokens.white)
        .widgetURL(context.attributes.link)
    } dynamicIsland: { context in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          PetBadge(pet: context.attributes.pet, small: true)
            .frame(width: 48, height: 48)
            .padding(.leading, 4)
        }
        DynamicIslandExpandedRegion(.center) {
          ActivityTitle(context: context, compact: true)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        DynamicIslandExpandedRegion(.trailing) {
          TimeLeft(context: context)
            .padding(.trailing, 4)
        }
        DynamicIslandExpandedRegion(.bottom) {
          VStack(spacing: 10) {
            TimeBar(context: context)
            HStack {
              StakeLine(context: context)
              Spacer()
              Link(destination: context.attributes.link) {
                Label { Text(context.attributes.ctaKey) } icon: { Image(systemName: context.attributes.ctaSymbol) }
                  .font(.system(size: 14, weight: .heavy, design: .rounded))
                  .foregroundStyle(BlowyTokens.dark)
                  .padding(.horizontal, 14)
                  .padding(.vertical, 8)
                  .background(Capsule().fill(BlowyTokens.accent))
              }
            }
          }
          .padding(.horizontal, 4)
        }
      } compactLeading: {
        PetBadge(pet: context.attributes.pet, small: true)
          .frame(width: 24, height: 24)
      } compactTrailing: {
        CompactTrailing(context: context)
      } minimal: {
        PetBadge(pet: context.attributes.pet, small: true)
          .frame(width: 24, height: 24)
      }
      .widgetURL(context.attributes.link)
      .keylineTint(BlowyTokens.accent)
    }
  }
}

private typealias Context = ActivityViewContext<BlowyActivityAttributes>

// MARK: - Écran verrouillé (et bannière sans Dynamic Island)

private struct LockScreenActivityView: View {
  let context: Context

  var body: some View {
    VStack(spacing: 10) {
      HStack(alignment: .center, spacing: 12) {
        PetBadge(pet: context.attributes.pet, small: true)
          .frame(width: 44, height: 44)
        ActivityTitle(context: context, compact: false)
        Spacer(minLength: 4)
        TimeLeft(context: context)
      }
      TimeBar(context: context)
      HStack {
        StakeLine(context: context)
        Spacer()
        Text(context.attributes.tapHintKey)
          .font(.system(size: 12, weight: .medium, design: .rounded))
          .foregroundStyle(BlowyTokens.mute)
      }
    }
    .foregroundStyle(BlowyTokens.white)
    .padding(16)
  }
}

// MARK: - Morceaux

/// « Séance commencée · Minimoa » puis le titre (« Un café dehors », « À toi d'écrire », « Nino est de sortie »).
private struct ActivityTitle: View {
  let context: Context
  let compact: Bool

  var body: some View {
    VStack(alignment: .leading, spacing: 1) {
      Text(context.attributes.kickerKey)
        .font(.system(size: 12, weight: .medium, design: .rounded))
        .foregroundStyle(BlowyTokens.mute)
      title
        .font(.system(size: compact ? 16 : 18, weight: .heavy, design: .rounded))
        .lineLimit(compact ? 1 : 2)
        .minimumScaleFactor(0.8)
    }
    .foregroundStyle(BlowyTokens.white)
  }

  @ViewBuilder private var title: some View {
    let attributes = context.attributes
    let state = context.state
    if state.done {
      Text(attributes.doneKey)
    } else {
      switch attributes.kind {
      case "link": Text("activity.link.title")
      case "outing": Text("activity.outing.title \(attributes.pet.name)")
      default:
        if let text = state.title, !text.isEmpty { Text(verbatim: text) } else { Text("challenge.generic") }
      }
    }
  }
}

/// « 7:18:42 / avant minuit » (sortie : « depuis 0:42 »). Rien quand c'est fait ou passé.
private struct TimeLeft: View {
  let context: Context

  var body: some View {
    if !context.state.done, !context.isStale {
      VStack(alignment: .trailing, spacing: 0) {
        if context.attributes.kind == "outing" {
          Text("activity.outing.since").font(.system(size: 11, weight: .medium, design: .rounded)).foregroundStyle(BlowyTokens.mute)
          Text(timerInterval: context.attributes.startDate...Date.distantFuture, countsDown: false)
            .font(.system(size: 20, weight: .heavy, design: .rounded))
            .foregroundStyle(BlowyTokens.accent)
        } else {
          Text(timerInterval: Date.now...max(Date.now, context.state.endDate), countsDown: true)
            .font(.system(size: 20, weight: .heavy, design: .rounded))
            .foregroundStyle(BlowyTokens.accent)
          Text("activity.untilMidnight").font(.system(size: 11, weight: .medium, design: .rounded)).foregroundStyle(BlowyTokens.mute)
        }
      }
      .monospacedDigit()
      .multilineTextAlignment(.trailing)
      .frame(maxWidth: 96, alignment: .trailing)
    }
  }
}

/// Barre du temps qui reste (se vide toute seule jusqu'à la fin, sans mise à jour).
private struct TimeBar: View {
  let context: Context

  var body: some View {
    let start = context.attributes.startDate
    let end = max(context.state.endDate, start.addingTimeInterval(60))
    if context.state.done || context.isStale {
      ProgressView(value: context.state.done ? 1 : 0).tint(context.state.done ? BlowyTokens.ok : BlowyTokens.mute).labelsHidden()
    } else {
      ProgressView(timerInterval: start...end, countsDown: true) { EmptyView() } currentValueLabel: { EmptyView() }
        .tint(BlowyTokens.accent)
    }
  }
}

/// « 🔥 Série de 12 en jeu » (défi ou lien ; fait : « Série de 13 »), sinon rien.
private struct StakeLine: View {
  let context: Context

  var body: some View {
    if context.attributes.kind == "challenge" || context.attributes.kind == "link", context.state.streak > 0 {
      HStack(spacing: 4) {
        Image(systemName: "flame.fill").foregroundStyle(BlowyTokens.orange)
        if context.state.done {
          Text("streak.series \(context.state.streak)")
        } else {
          Text("streak.atStake \(context.state.streak)")
        }
      }
      .font(.system(size: 13, weight: .heavy, design: .rounded))
      .foregroundStyle(BlowyTokens.white)
    }
  }
}

/// Île compacte, à droite : le temps qui reste (défi, lien) ou une icône (sortie, fait, journée passée).
private struct CompactTrailing: View {
  let context: Context

  var body: some View {
    if context.state.done {
      Image(systemName: "checkmark.circle.fill").foregroundStyle(BlowyTokens.ok)
    } else if context.attributes.kind == "outing" || context.isStale {
      Image(systemName: context.attributes.ctaSymbol).foregroundStyle(BlowyTokens.accent)
    } else {
      Text(timerInterval: Date.now...max(Date.now, context.state.endDate), countsDown: true)
        .font(.system(size: 14, weight: .heavy, design: .rounded))
        .monospacedDigit()
        .foregroundStyle(BlowyTokens.accent)
        .frame(maxWidth: 56)
    }
  }
}

// MARK: - Textes et liens selon le type

private extension BlowyActivityAttributes {
  var link: URL { URL(string: url) ?? BlowyEntry.defaultURL }

  var kickerKey: LocalizedStringKey {
    switch kind {
    case "link": "activity.link.kicker"
    case "outing": "activity.outing.kicker"
    default: "activity.challenge.kicker"
    }
  }

  var doneKey: LocalizedStringKey {
    switch kind {
    case "link": "activity.link.done"
    case "outing": "activity.outing.done"
    default: "challenge.done"
    }
  }

  var tapHintKey: LocalizedStringKey {
    kind == "link" ? "activity.link.tap" : "challenge.tap"
  }

  var ctaKey: LocalizedStringKey {
    kind == "link" ? "activity.cta.write" : "activity.cta.go"
  }

  var ctaSymbol: String {
    switch kind {
    case "link": "bubble.left.and.bubble.right.fill"
    case "outing": "figure.walk"
    default: "flame.fill"
    }
  }
}
