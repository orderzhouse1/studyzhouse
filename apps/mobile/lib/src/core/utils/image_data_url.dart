import "dart:convert";
import "dart:typed_data";

/// يحوّل بايتات الصورة إلى `data:image/...;base64,...` كما يتوقّعه الـ API.
String imageBytesToDataUrl(Uint8List bytes, {required String mimeType}) {
  final normalized = mimeType.toLowerCase();
  final safeMime = normalized.startsWith("image/") ? normalized : "image/jpeg";
  final encoded = base64Encode(bytes);
  return "data:$safeMime;base64,$encoded";
}

String? mimeTypeFromPath(String path) {
  final lower = path.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return null;
}
