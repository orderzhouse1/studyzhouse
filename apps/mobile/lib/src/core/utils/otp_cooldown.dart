import "dart:async";

/// Tracks resend cooldown from API `resendAvailableAt` ISO timestamp.
class OtpCooldown {
  OtpCooldown({this.onTick});

  final void Function(int secondsLeft)? onTick;

  Timer? _timer;
  int secondsLeft = 0;

  void startFromIso(String? resendAvailableAt, {int fallbackSeconds = 60}) {
    _timer?.cancel();
    if (resendAvailableAt == null) {
      secondsLeft = fallbackSeconds;
      _tick();
      return;
    }
    final until = DateTime.tryParse(resendAvailableAt);
    if (until == null) {
      secondsLeft = fallbackSeconds;
      _tick();
      return;
    }
    _update(until);
    _timer = Timer.periodic(const Duration(seconds: 1), (_) => _update(until));
  }

  void _update(DateTime until) {
    secondsLeft = (until.difference(DateTime.now()).inSeconds).clamp(0, 9999);
    onTick?.call(secondsLeft);
    if (secondsLeft <= 0) {
      _timer?.cancel();
      _timer = null;
    }
  }

  void _tick() {
    onTick?.call(secondsLeft);
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (secondsLeft <= 0) {
        _timer?.cancel();
        _timer = null;
        onTick?.call(0);
        return;
      }
      secondsLeft--;
      onTick?.call(secondsLeft);
    });
  }

  void dispose() {
    _timer?.cancel();
    _timer = null;
  }
}
