import '../zrcs/zrcs_config_model.dart';

class MetaAdapterStub {
  Future<void> initialize(ZrcsConfigModel config) async {
    // Meta Audience Network adapter planned, not active.
    assert(() {
      // ignore: avoid_print
      print('MetaAdapterStub: Meta Audience Network adapter planned, not active.');
      return true;
    }());
  }
}
