import 'package:flutter/material.dart';

class SkeletonPlaceholder extends StatefulWidget {
  final double width;
  final double height;
  final double borderRadius;

  const SkeletonPlaceholder({
    super.key,
    this.width = double.infinity,
    this.height = 20,
    this.borderRadius = 8,
  });

  @override
  State<SkeletonPlaceholder> createState() => _SkeletonPlaceholderState();
}

class _SkeletonPlaceholderState extends State<SkeletonPlaceholder>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Container(
          width: widget.width,
          height: widget.height,
          decoration: BoxDecoration(
            color: Color.lerp(
              const Color(0xFF1E293B),
              const Color(0xFF334155),
              _controller.value,
            ),
            borderRadius: BorderRadius.circular(widget.borderRadius),
          ),
        );
      },
    );
  }
}

class ProfileSkeleton extends StatelessWidget {
  const ProfileSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.all(24),
      child: Column(
        children: [
          SkeletonPlaceholder(width: 120, height: 120, borderRadius: 60),
          SizedBox(height: 24),
          SkeletonPlaceholder(width: 180, height: 24),
          SizedBox(height: 32),
          SkeletonPlaceholder(height: 160),
          SizedBox(height: 24),
          SkeletonPlaceholder(height: 80),
          SizedBox(height: 32),
          SkeletonPlaceholder(height: 48),
          SkeletonPlaceholder(height: 48),
        ],
      ),
    );
  }
}

class HomeSkeleton extends StatelessWidget {
  const HomeSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          for (int i = 0; i < 6; i++) ...[
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 8),
              child: Row(
                children: [
                  SkeletonPlaceholder(width: 48, height: 48, borderRadius: 24),
                  SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SkeletonPlaceholder(width: 140, height: 16),
                        SizedBox(height: 6),
                        SkeletonPlaceholder(height: 14),
                      ],
                    ),
                  ),
                  SizedBox(width: 8),
                  SkeletonPlaceholder(width: 24, height: 24, borderRadius: 12),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
