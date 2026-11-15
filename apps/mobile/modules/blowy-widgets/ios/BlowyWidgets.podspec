# Module local (autolinking Expo : apps/mobile/modules/*). iOS seulement ; ailleurs le pont JS ne fait rien.
Pod::Spec.new do |s|
  s.name           = 'BlowyWidgets'
  s.version        = '1.0.0'
  s.summary        = 'Blowy : état des widgets (groupe d’apps) et activités en direct'
  s.description    = s.summary
  s.license        = 'UNLICENSED'
  s.author         = 'Blowy'
  s.homepage       = 'https://blowy.app'
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'WidgetKit', 'ActivityKit'

  s.source_files = '*.swift'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
end
