class LocalMediaRecord {
  final int? localId;
  final String fileId;
  final String conversationId;
  final String senderId;
  final String receiverId;
  final String mediaType;
  final String localPath;
  final String fileName;
  final int fileSize;
  final String mimeType;
  final String? checksum;
  final String transferStatus;
  final DateTime createdAt;
  final DateTime? receivedAt;

  LocalMediaRecord({
    this.localId,
    required this.fileId,
    required this.conversationId,
    required this.senderId,
    required this.receiverId,
    required this.mediaType,
    required this.localPath,
    required this.fileName,
    required this.fileSize,
    required this.mimeType,
    this.checksum,
    required this.transferStatus,
    required this.createdAt,
    this.receivedAt,
  });

  Map<String, dynamic> toJson() {
    return {
      'localId': localId,
      'fileId': fileId,
      'conversationId': conversationId,
      'senderId': senderId,
      'receiverId': receiverId,
      'mediaType': mediaType,
      'localPath': localPath,
      'fileName': fileName,
      'fileSize': fileSize,
      'mimeType': mimeType,
      'checksum': checksum,
      'transferStatus': transferStatus,
      'createdAt': createdAt.toIso8601String(),
      'receivedAt': receivedAt?.toIso8601String(),
    };
  }

  factory LocalMediaRecord.fromJson(Map<String, dynamic> json) {
    return LocalMediaRecord(
      localId: json['localId'],
      fileId: json['fileId'],
      conversationId: json['conversationId'],
      senderId: json['senderId'],
      receiverId: json['receiverId'],
      mediaType: json['mediaType'],
      localPath: json['localPath'],
      fileName: json['fileName'],
      fileSize: json['fileSize'],
      mimeType: json['mimeType'],
      checksum: json['checksum'],
      transferStatus: json['transferStatus'],
      createdAt: DateTime.parse(json['createdAt']),
      receivedAt: json['receivedAt'] != null ? DateTime.parse(json['receivedAt']) : null,
    );
  }
}
