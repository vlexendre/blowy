// Pont JavaScript → widgets (état partagé par le groupe d'apps) et activités en direct (ActivityKit).
// Tout passe en JSON pour garder un seul décodage : celui des types de BlowyShared.swift, le même que
// celui des push APNs. Le côté JS (`src/core/widgets`) est un no-op hors iOS.

import ExpoModulesCore
import Foundation
import WidgetKit
#if canImport(ActivityKit)
import ActivityKit
#endif

private let tokenEvent = "onActivityToken"

public class BlowyWidgetsModule: Module {
  // Tâches qui écoutent les jetons ; touchées depuis plusieurs fils, d'où le verrou.
  private let lock = NSLock()
  private var observers: [Task<Void, Never>] = []
  private var observed = Set<String>()

  public func definition() -> ModuleDefinition {
    Name("BlowyWidgets")

    Events(tokenEvent)

    // MARK: Widgets

    /// Écrit l'état des widgets s'il a changé, puis recharge leurs timelines. Rend vrai si quelque chose a changé.
    Function("setSnapshot") { (json: String) throws -> Bool in
      guard let data = json.data(using: .utf8),
            let snapshot = try? JSONDecoder().decode(BlowySnapshot.self, from: data),
            snapshot.v == BlowySnapshot.currentVersion else {
        throw InvalidPayloadException("snapshot")
      }
      guard let defaults = BlowyStore.defaults else { throw MissingAppGroupException(BlowyStore.appGroup) }
      if defaults.data(forKey: BlowyStore.snapshotKey) == data { return false }
      defaults.set(data, forKey: BlowyStore.snapshotKey)
      BlowyWidgetsModule.reloadWidgets()
      return true
    }

    /// Déconnexion : les widgets repassent sur « ouvre Blowy ».
    Function("clearSnapshot") { () -> Void in
      guard let defaults = BlowyStore.defaults, defaults.object(forKey: BlowyStore.snapshotKey) != nil else { return }
      defaults.removeObject(forKey: BlowyStore.snapshotKey)
      BlowyWidgetsModule.reloadWidgets()
    }

    Function("appGroup") { BlowyStore.appGroup }

    // MARK: Activités en direct

    Function("activitiesEnabled") { () -> Bool in
      #if canImport(ActivityKit)
      if #available(iOS 17.0, *) { return ActivityAuthorizationInfo().areActivitiesEnabled }
      #endif
      return false
    }

    /// Activités en cours (ou terminées encore affichées) : [{ id, kind, attributes, state }], en JSON.
    Function("listActivities") { () throws -> String in
      #if canImport(ActivityKit)
      if #available(iOS 17.0, *) {
        let list = Activity<BlowyActivityAttributes>.activities
          .filter { $0.activityState == .active || $0.activityState == .stale }
          .map { RunningActivity(id: $0.id, attributes: $0.attributes, state: $0.content.state) }
        return String(decoding: try JSONEncoder().encode(list), as: UTF8.self)
      }
      #endif
      return "[]"
    }

    /// Démarre une activité (app au premier plan). `key` : une activité par clé, une seule fois (ex. `challenge:2026-11-15`),
    /// même si la personne l'a retirée de l'écran verrouillé et rouvre l'app. Rend son identifiant, ou nil.
    AsyncFunction("startActivity") { (key: String, attributesJson: String, stateJson: String, withPush: Bool) async throws -> String? in
      #if canImport(ActivityKit)
      if #available(iOS 17.0, *) {
        guard ActivityAuthorizationInfo().areActivitiesEnabled, BlowyWidgetsModule.claim(key) else { return nil }
        let attributes = try BlowyWidgetsModule.decode(BlowyActivityAttributes.self, attributesJson)
        let state = try BlowyWidgetsModule.decode(BlowyActivityAttributes.ContentState.self, stateJson)
        let activity = try Activity.request(
          attributes: attributes,
          content: ActivityContent(state: state, staleDate: state.endDate, relevanceScore: BlowyWidgetsModule.relevance(attributes.kind)),
          pushType: withPush ? PushType.token : nil
        )
        // Son jeton arrive par `activityUpdates` (voir startObserving) quand le JS écoute.
        return activity.id
      }
      #endif
      return nil
    }

    AsyncFunction("updateActivity") { (id: String, stateJson: String) async throws -> Bool in
      #if canImport(ActivityKit)
      if #available(iOS 17.0, *) {
        guard let activity = Activity<BlowyActivityAttributes>.activities.first(where: { $0.id == id }) else { return false }
        let state = try BlowyWidgetsModule.decode(BlowyActivityAttributes.ContentState.self, stateJson)
        if state == activity.content.state { return false }
        await activity.update(ActivityContent(state: state, staleDate: state.endDate, relevanceScore: BlowyWidgetsModule.relevance(activity.attributes.kind)))
        return true
      }
      #endif
      return false
    }

    /// Termine une activité. `dismissAfter` : secondes avant de la retirer de l'écran verrouillé (0 : tout de suite,
    /// négatif : règle par défaut du système).
    AsyncFunction("endActivity") { (id: String, stateJson: String?, dismissAfter: Double) async throws -> Bool in
      #if canImport(ActivityKit)
      if #available(iOS 17.0, *) {
        guard let activity = Activity<BlowyActivityAttributes>.activities.first(where: { $0.id == id }) else { return false }
        let finalContent = try stateJson.map { ActivityContent(state: try BlowyWidgetsModule.decode(BlowyActivityAttributes.ContentState.self, $0), staleDate: nil) }
        let policy: ActivityUIDismissalPolicy = dismissAfter < 0 ? .default : dismissAfter == 0 ? .immediate : .after(.now + dismissAfter)
        await activity.end(finalContent, dismissalPolicy: policy)
        return true
      }
      #endif
      return false
    }

    // Jetons pour les push d'activité : seulement quand le JS écoute.
    OnStartObserving(tokenEvent) {
      self.startObserving()
    }

    OnStopObserving(tokenEvent) {
      self.stopObserving()
    }
  }

  // MARK: - Interne

  private static func reloadWidgets() {
    WidgetCenter.shared.reloadTimelines(ofKind: BlowyStore.homeWidgetKind)
    WidgetCenter.shared.reloadTimelines(ofKind: BlowyStore.lockWidgetKind)
  }

  private static func decode<T: Decodable>(_ type: T.Type, _ json: String) throws -> T {
    guard let data = json.data(using: .utf8), let value = try? JSONDecoder().decode(type, from: data) else {
      throw InvalidPayloadException(String(describing: type))
    }
    return value
  }

  /// Le défi d'abord dans la Dynamic Island, puis la série d'un lien, puis la sortie.
  private static func relevance(_ kind: String) -> Double {
    switch kind {
    case "challenge": return 100
    case "link": return 75
    default: return 50
    }
  }

  /// Retient les clés des activités déjà démarrées (les 30 dernières), dans les réglages de l'app.
  private static func claim(_ key: String) -> Bool {
    let storeKey = "blowy.activity.started"
    let defaults = UserDefaults.standard
    var keys = defaults.stringArray(forKey: storeKey) ?? []
    if keys.contains(key) { return false }
    keys.append(key)
    defaults.set(Array(keys.suffix(30)), forKey: storeKey)
    return true
  }

  private static func hex(_ data: Data) -> String {
    data.map { String(format: "%02x", $0) }.joined()
  }

  private func keep(_ task: Task<Void, Never>) {
    lock.lock()
    observers.append(task)
    lock.unlock()
  }

  private func stopObserving() {
    lock.lock()
    observers.forEach { $0.cancel() }
    observers.removeAll()
    observed.removeAll()
    lock.unlock()
  }

  private func startObserving() {
    #if canImport(ActivityKit)
    guard #available(iOS 17.0, *) else { return }
    // Activités déjà en cours (lancement de l'app) et activités démarrées ensuite, par l'app ou par push.
    Activity<BlowyActivityAttributes>.activities.forEach { observeTokens(of: $0) }
    keep(Task { [weak self] in
      for await activity in Activity<BlowyActivityAttributes>.activityUpdates {
        self?.observeTokens(of: activity)
      }
    })
    if #available(iOS 17.2, *) {
      keep(Task { [weak self] in
        for await data in Activity<BlowyActivityAttributes>.pushToStartTokenUpdates {
          self?.sendEvent(tokenEvent, ["use": "start", "token": BlowyWidgetsModule.hex(data)])
        }
      })
    }
    #endif
  }

  #if canImport(ActivityKit)
  @available(iOS 17.0, *)
  private func observeTokens(of activity: Activity<BlowyActivityAttributes>) {
    lock.lock()
    let isNew = observed.insert(activity.id).inserted
    lock.unlock()
    guard isNew else { return }
    let id = activity.id
    let kind = activity.attributes.kind
    keep(Task { [weak self] in
      for await data in activity.pushTokenUpdates {
        self?.sendEvent(tokenEvent, ["use": "update", "token": BlowyWidgetsModule.hex(data), "activityId": id, "activity": kind])
      }
    })
  }
  #endif
}

#if canImport(ActivityKit)
@available(iOS 17.0, *)
private struct RunningActivity: Encodable {
  let id: String
  let attributes: BlowyActivityAttributes
  let state: BlowyActivityAttributes.ContentState
}
#endif

private final class InvalidPayloadException: GenericException<String> {
  override var reason: String { "BlowyWidgets: données illisibles (\(param))" }
}

private final class MissingAppGroupException: GenericException<String> {
  override var reason: String { "BlowyWidgets: groupe d'apps inaccessible (\(param)) ; vérifier l'entitlement App Group" }
}
