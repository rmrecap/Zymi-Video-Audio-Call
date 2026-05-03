import 'zymi_identity_normalizer.dart';

class PrivateMessagePayload {
  final String to;
  final String from;
  final String content;
  final String tempId;
  final String messageType;

  PrivateMessagePayload({
    required this.to,
    required this.from,
    required this.content,
    required this.tempId,
    this.messageType = 'text',
  });

  Map<String, dynamic> toJson() {
    return {
      'to': ZymiIdentityNormalizer.normalize(to),
      'from': ZymiIdentityNormalizer.normalize(from),
      'content': content,
      'tempId': tempId,
      'message_type': messageType,
    };
  }
}

class TypingPayload {
  final String to;
  final String from;

  TypingPayload({required this.to, required this.from});

  Map<String, dynamic> toJson() {
    return {
      'to': ZymiIdentityNormalizer.normalize(to),
      'from': ZymiIdentityNormalizer.normalize(from),
    };
  }
}
