// Timeline des widgets. Le widget n'appelle jamais l'API : il lit l'état que l'app publie dans le groupe d'apps
// (une suite de moments calculés d'avance par l'app avec les règles du domaine) et le déroule. L'app recharge
// les timelines quand cet état change ; entre-temps, rien ne consomme le budget de rechargement.

import SwiftUI
import WidgetKit

struct BlowyEntry: TimelineEntry {
  static let defaultURL = URL(string: "blowy://pet")!

  let date: Date
  /// nil : rien de publié (pas connecté, ou app jamais ouverte depuis l'installation).
  let pet: BlowyPet?
  let frame: BlowyFrame?
  let url: URL

  static let empty = BlowyEntry(date: .now, pet: nil, frame: nil, url: defaultURL)
}

struct BlowyProvider: TimelineProvider {
  func placeholder(in context: Context) -> BlowyEntry { .sample }

  /// Galerie des widgets : l'exemple tant que rien n'est publié.
  func getSnapshot(in context: Context, completion: @escaping (BlowyEntry) -> Void) {
    completion(Self.entries(now: .now).first ?? (context.isPreview ? .sample : .empty))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<BlowyEntry>) -> Void) {
    let entries = Self.entries(now: .now)
    completion(Timeline(entries: entries.isEmpty ? [.empty] : entries, policy: .never))
  }

  /// Le moment en cours (daté de maintenant), puis les suivants. Les moments passés sont ignorés.
  static func entries(now: Date) -> [BlowyEntry] {
    guard let snapshot = BlowyStore.readSnapshot() else { return [] }
    let frames = snapshot.frames.sorted { $0.at < $1.at }
    guard !frames.isEmpty else { return [] }
    let current = frames.lastIndex { $0.date <= now } ?? 0
    let url = URL(string: snapshot.url) ?? BlowyEntry.defaultURL
    return frames[current...].enumerated().map { offset, frame in
      BlowyEntry(date: offset == 0 ? now : frame.date, pet: snapshot.pet, frame: frame, url: url)
    }
  }
}

/// Vue affichée quand rien n'est publié : inviter à ouvrir l'app.
struct EmptyWidgetView: View {
  var compact = false

  var body: some View {
    VStack(alignment: .leading, spacing: 2) {
      Text("empty.title").font(.system(size: compact ? 13 : 15, weight: .heavy, design: .rounded))
      Text("empty.text").font(.system(size: compact ? 11 : 12, weight: .medium, design: .rounded)).foregroundStyle(.secondary)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: compact ? .leading : .bottomLeading)
  }
}
