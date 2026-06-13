# تشغيل التطبيق على المحاكي باستخدام apps/mobile/.env (بدون dart-define)
Set-Location $PSScriptRoot\..
flutter pub get
flutter run -d emulator-5554
