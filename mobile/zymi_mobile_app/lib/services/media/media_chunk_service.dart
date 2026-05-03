import 'dart:io';
import 'dart:async';

class MediaChunkService {
  static const int defaultChunkSize = 16384; // 16KB

  static Stream<List<int>> readFileInChunks(String path, {int chunkSize = defaultChunkSize}) async* {
    final file = File(path);
    final access = await file.open();
    try {
      final length = await file.length();
      int position = 0;
      while (position < length) {
        final remaining = length - position;
        final toRead = remaining < chunkSize ? remaining : chunkSize;
        final buffer = await access.read(toRead);
        yield buffer;
        position += toRead;
      }
    } finally {
      await access.close();
    }
  }

  static Future<String> calculateChecksum(String path) async {
    // Placeholder without crypto package
    return "size_${await File(path).length()}";
  }

  static Future<File> writeChunksToFile(String path, Stream<List<int>> chunks) async {
    final file = File(path);
    final sink = file.openWrite();
    try {
      await for (final chunk in chunks) {
        sink.add(chunk);
      }
    } finally {
      await sink.close();
    }
    return file;
  }
}
