class ZymiSocketPayloads {
  static Map<String, dynamic> privateMessage({
    required String to,
    required String from,
    required String content,
    required String tempId,
    String type = 'text',
  }) {
    return {
      'to': to,
      'from': from,
      'content': content,
      'tempId': tempId,
      'message_type': type,
    };
  }

  static Map<String, dynamic> callOffer({
    required String to,
    required String from,
    required dynamic offer,
    required String type,
  }) {
    return {
      'to': to,
      'from': from,
      'offer': offer,
      'type': type,
    };
  }

  static Map<String, dynamic> iceCandidate({
    required String to,
    required dynamic candidate,
  }) {
    return {
      'to': to,
      'candidate': candidate,
    };
  }
}
