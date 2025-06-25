import 'package:image_picker/image_picker.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';

class OcrService {
  final ImagePicker _picker = ImagePicker();
  final TextRecognizer _recognizer = TextRecognizer();

  Future<String?> pickAndExtractText() async {
    final pickedFile = await _picker.pickImage(source: ImageSource.camera);
    if (pickedFile == null) return null;

    final inputImage = InputImage.fromFilePath(pickedFile.path);
    final RecognizedText recognizedText = await _recognizer.processImage(inputImage);
    return recognizedText.text;
  }
}
