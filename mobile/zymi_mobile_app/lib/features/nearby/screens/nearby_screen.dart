import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import '../../../services/api/nearby_service.dart';
import '../../../core/utils/location_utils.dart';
import '../../../services/governance/policy_gate_service.dart';
import '../../../core/theme/zymi_brand_colors.dart';

class NearbyScreen extends StatefulWidget {
  const NearbyScreen({super.key});

  @override
  State<NearbyScreen> createState() => _NearbyScreenState();
}

class _NearbyScreenState extends State<NearbyScreen> {
  final NearbyService _nearbyService = NearbyService();
  Position? _currentPosition;
  List<Map<String, dynamic>> _nearbyUsers = [];
  bool _isLoading = true;
  bool _showMap = true;
  final MapController _mapController = MapController();

  @override
  void initState() {
    super.initState();
    _fetchLocationAndUsers();
  }

  Future<void> _fetchLocationAndUsers() async {
    setState(() => _isLoading = true);
    final pos = await LocationUtils.getCurrentPosition();
    if (pos != null) {
      final users = await _nearbyService.getNearbyUsers(pos.latitude, pos.longitude);
      if (mounted) {
        setState(() {
          _currentPosition = pos;
          _nearbyUsers = users;
          _isLoading = false;
        });
      }
    } else {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Location permission denied or service disabled')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: PolicyGateService.instance,
      builder: (context, _) {
        final isEnabled = PolicyGateService.instance.isEnabled('nearby_enabled');
        if (!isEnabled) {
          return Scaffold(
            backgroundColor: const Color(0xFF0f172a),
            appBar: AppBar(
              backgroundColor: const Color(0xFF1e293b),
              title: const Text('Nearby Discovery', style: TextStyle(color: Colors.white)),
            ),
            body: const Center(
              child: Padding(
                padding: EdgeInsets.all(24.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.privacy_tip, size: 64, color: Colors.amberAccent),
                    SizedBox(height: 16),
                    Text(
                      'Feature Temporarily Disabled',
                      style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                      textAlign: TextAlign.center,
                    ),
                    SizedBox(height: 8),
                    Text(
                      'Nearby discovery is temporarily suspended by network administration policies.',
                      style: TextStyle(color: Colors.white70, fontSize: 14),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
          );
        }

        return Scaffold(
          backgroundColor: const Color(0xFF0f172a),
          appBar: AppBar(
            backgroundColor: const Color(0xFF1e293b),
            title: const Text('Nearby Discovery', style: TextStyle(color: Colors.white)),
            actions: [
              IconButton(
                icon: Icon(_showMap ? Icons.list : Icons.map, color: Colors.white),
                onPressed: () => setState(() => _showMap = !_showMap),
              ),
              IconButton(
                icon: const Icon(Icons.refresh, color: Colors.white),
                onPressed: _fetchLocationAndUsers,
              ),
            ],
          ),
          body: _isLoading
              ? _buildShimmerList()
              : _showMap
                  ? _buildFlutterMap()
                  : _buildListView(),
        );
      },
    );
  }

  Widget _buildShimmerList() {
    return ListView.builder(
      itemCount: 6,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      itemBuilder: (context, index) {
        return const Card(
          color: Color(0xFF1e293b),
          margin: EdgeInsets.symmetric(vertical: 8),
          child: Padding(
            padding: EdgeInsets.all(16.0),
            child: Row(
              children: [
                SkeletonShimmer(width: 48, height: 48, borderRadius: 24),
                SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SkeletonShimmer(width: 120, height: 16),
                      SizedBox(height: 8),
                      SkeletonShimmer(width: 80, height: 12),
                    ],
                  ),
                ),
                Icon(Icons.chevron_right, color: Colors.white24),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildFlutterMap() {
    if (_currentPosition == null) {
      return const Center(child: Text('Location not available', style: TextStyle(color: Colors.white)));
    }

    final myLocation = LatLng(_currentPosition!.latitude, _currentPosition!.longitude);

    return FlutterMap(
      mapController: _mapController,
      options: MapOptions(
        initialCenter: myLocation,
        initialZoom: 13.0,
      ),
      children: [
        // CartoDB Dark Matter Tile Layer (100% Free, No API Key)
        TileLayer(
          urlTemplate: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
          subdomains: const ['a', 'b', 'c', 'd'],
          userAgentPackageName: 'com.zymi.app',
        ),
        // Markers Layer
        MarkerLayer(
          markers: [
            // Current User Marker
            Marker(
              point: myLocation,
              width: 40,
              height: 40,
              child: const Icon(Icons.my_location, color: ZymiColors.primary, size: 30),
            ),
            // Nearby Users Markers
            ..._nearbyUsers.where((u) => u['lat'] != null && u['lng'] != null).map(
                  (user) => Marker(
                    point: LatLng(user['lat'], user['lng']),
                    width: 40,
                    height: 40,
                    child: GestureDetector(
                      onTap: () => _showUserPreview(user),
                      child: const Icon(Icons.location_on, color: Colors.redAccent, size: 30),
                    ),
                  ),
                ),
          ],
        ),
      ],
    );
  }

  void _showUserPreview(Map<String, dynamic> user) {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1e293b),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) => Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircleAvatar(
              radius: 30,
              backgroundColor: ZymiColors.primary,
              child: Text(user['username'][0].toUpperCase(), style: const TextStyle(fontSize: 24, color: Colors.white)),
            ),
            const SizedBox(height: 10),
            Text(user['username'], style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
            Text('${user['distance']?.toStringAsFixed(1) ?? '?'} km away', style: const TextStyle(color: Colors.white70)),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              style: ElevatedButton.styleFrom(backgroundColor: ZymiColors.primary),
              child: const Text('View Profile'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildListView() {
    if (_nearbyUsers.isEmpty) {
      return const Center(child: Text('No users found nearby', style: TextStyle(color: Colors.white)));
    }

    return ListView.builder(
      itemCount: _nearbyUsers.length,
      itemBuilder: (context, index) {
        final user = _nearbyUsers[index];
        return Card(
          color: const Color(0xFF1e293b),
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: ZymiColors.primary,
              child: Text(user['username'][0].toUpperCase(), style: const TextStyle(color: Colors.white)),
            ),
            title: Text(user['username'], style: const TextStyle(color: Colors.white)),
            subtitle: Text(
              '${user['distance']?.toStringAsFixed(1) ?? '?'} km away',
              style: const TextStyle(color: Colors.white70),
            ),
            trailing: const Icon(Icons.chevron_right, color: Colors.white54),
            onTap: () => _showUserPreview(user),
          ),
        );
      },
    );
  }
}

class SkeletonShimmer extends StatefulWidget {
  final double width;
  final double height;
  final double borderRadius;

  const SkeletonShimmer({
    super.key,
    required this.width,
    required this.height,
    this.borderRadius = 8.0,
  });

  @override
  State<SkeletonShimmer> createState() => _SkeletonShimmerState();
}

class _SkeletonShimmerState extends State<SkeletonShimmer>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    )..repeat(reverse: true);
    _animation = Tween<double>(begin: 0.3, end: 0.8).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Opacity(
          opacity: _animation.value,
          child: Container(
            width: widget.width,
            height: widget.height,
            decoration: BoxDecoration(
              color: const Color(0xFF334155),
              borderRadius: BorderRadius.circular(widget.borderRadius),
            ),
          ),
        );
      },
    );
  }
}
