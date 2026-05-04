# Run Flutter on Device from D Drive
$env:GRADLE_USER_HOME = "D:\G"
$env:TEMP = "D:\android-temp"
$env:TMP = "D:\android-temp"

Set-Location mobile\zymi_mobile_app

Write-Host "Starting flutter run on device..."
flutter run -d 48ZYD25511402050 --android-skip-build-dependency-validation
