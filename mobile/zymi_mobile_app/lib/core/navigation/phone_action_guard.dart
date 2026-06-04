import 'package:flutter/material.dart';
import '../../features/users/widgets/zymi_user_found_dialog.dart';
import '../../features/users/widgets/zymi_user_not_found_dialog.dart';
import '../../services/users/phone_lookup_service.dart';
import '../widgets/skeleton_placeholder.dart';

class PhoneActionGuard {
  static Future<void> handlePhoneClick(BuildContext context, String phone) async {
    final result = await PhoneLookupService.lookup(phone);

    if (result.found) {
      if (context.mounted) {
        showDialog(
          context: context,
          builder: (context) => ZymiUserFoundDialog(
            userId: result.userId!,
            username: result.username!,
            avatar: result.avatar,
          ),
        );
      }
    } else {
      if (context.mounted) {
        showDialog(
          context: context,
          builder: (context) => ZymiUserNotFoundDialog(
            message: result.message ?? 'এই নম্বরটি ZYMI-তে নিবন্ধিত নেই',
          ),
        );
      }
    }
  }
}
