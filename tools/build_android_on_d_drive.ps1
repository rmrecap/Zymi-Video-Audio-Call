# Build Android on D Drive Script
# This script redirects Gradle and Temp directories to D drive to bypass C drive space limitations.

$env:GRADLE_USER_HOME = "D:\gradle-cache"
$env:TEMP = "D:\android-temp"
$env:TMP = "D:\android-temp"

Write-Host "GRADLE_USER_HOME set to: $env:GRADLE_USER_HOME"
Write-Host "TEMP set to: $env:TEMP"

Set-Location mobile\zymi_mobile_app

Write-Host "Running flutter clean..."
flutter clean

Write-Host "Running flutter pub get..."
flutter pub get

Write-Host "Running flutter analyze..."
flutter analyze

Write-Host "Running flutter build apk --debug..."
flutter build apk --debug

Write-Host "Backend syntax check..."
node --check ../../server/index.js
