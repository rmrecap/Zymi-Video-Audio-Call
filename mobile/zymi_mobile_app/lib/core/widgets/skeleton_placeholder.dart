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
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          const SkeletonPlaceholder(width: 120, height: 120, borderRadius: 60),
          const SizedBox(height: 24),
          const SkeletonPlaceholder(width: 180, height: 24),
          const SizedBox(height: 32),
          const SkeletonPlaceholder(height: 160),
          const SizedBox(height: 24),
          const SkeletonPlaceholder(height: 80),
          const SizedBox(height: 32),
          const SkeletonPlaceholder(height: 48),
          const SkeletonPlaceholder(height: 48),
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
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Row(
                children: [
                  const SkeletonPlaceholder(width: 48, height: 48, borderRadius: 24),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SkeletonPlaceholder(width: 140, height: 16),
                        const SizedBox(height: 6),
                        const SkeletonPlaceholder(height: 14),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  const SkeletonPlaceholder(width: 24, height: 24, borderRadius: 12),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
