# Set Environment Variables
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:GRADLE_USER_HOME = "D:\G"
$env:TEMP = "D:\android-temp"
$env:TMP = "D:\android-temp"

# Explicitly go to the Android project folder
$AndroidDir = "D:\QiBo\mobile\zymi_mobile_app\android"
if (Test-Path $AndroidDir) {
    Set-Location $AndroidDir
    Write-Host "Current Location: $(Get-Location)"
} else {
    Write-Error "Could not find Android directory at $AndroidDir"
    exit
}

# Go back to flutter project root to run flutter command
Set-Location "D:\QiBo\mobile\zymi_mobile_app"

Write-Host "Starting flutter run..."
flutter run --android-skip-build-dependency-validation
