import 'dart:async';
import 'package:speech_to_text/speech_to_text.dart' as stt;

class AudioService {
  final stt.SpeechToText _speech = stt.SpeechToText();

  Future<String?> recordAndTranscribe() async {
    final available = await _speech.initialize();
    if (!available) return null;

    final completer = Completer<String?>();
    _speech.listen(onResult: (result) {
      if (result.finalResult) {
        completer.complete(result.recognizedWords);
      }
    });

    await Future.delayed(const Duration(seconds: 5));
    await _speech.stop();
    return completer.future;
  }
}
