import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import '../../../services/api/nearby_service.dart';
import '../../../core/utils/location_utils.dart';

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
          ? const Center(child: CircularProgressIndicator(color: Colors.blueAccent))
          : _showMap
              ? _buildFlutterMap()
              : _buildListView(),
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
              child: const Icon(Icons.my_location, color: Colors.blueAccent, size: 30),
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
              backgroundColor: Colors.blueAccent,
              child: Text(user['username'][0].toUpperCase(), style: const TextStyle(fontSize: 24, color: Colors.white)),
            ),
            const SizedBox(height: 10),
            Text(user['username'], style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
            Text('${user['distance']?.toStringAsFixed(1) ?? '?'} km away', style: const TextStyle(color: Colors.white70)),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.blueAccent),
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
              backgroundColor: Colors.blueAccent,
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
