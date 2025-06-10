import * as Location from 'expo-location';
import {Alert, Platform} from 'react-native';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface AddressComponent {
  name?: string;
  street?: string;
  streetNumber?: string;
  district?: string;
  subregion?: string;
  city?: string;
  region?: string;
  country?: string;
  postalCode?: string;
  isoCountryCode?: string;
}

export interface DetailedAddress {
  formattedAddress: string;
  coordinates: LocationCoordinates;
  components: AddressComponent;
}

class LocationService {
  // Request location permissions
  async requestLocationPermission(): Promise<boolean> {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Please enable location access to automatically detect your delivery address. You can also enter your address manually.',
          [{ text: 'OK' }]
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }

  // Get current location coordinates
  async getCurrentLocation(): Promise<LocationCoordinates | null> {
    try {
      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) {
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000,
        distanceInterval: 100,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please enter your delivery address manually.',
        [{ text: 'OK' }]
      );
      return null;
    }
  }

  // Reverse geocoding - convert coordinates to address
  async getAddressFromCoordinates(coordinates: LocationCoordinates): Promise<DetailedAddress | null> {
    try {
      const addresses = await Location.reverseGeocodeAsync({
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      });

      if (addresses.length === 0) {
        throw new Error('No address found for coordinates');
      }

      const address = addresses[0];
      
      // Build Vietnamese-style formatted address
      const addressParts: string[] = [];
      
      if (address.streetNumber) addressParts.push(address.streetNumber);
      if (address.street) addressParts.push(address.street);
      if (address.district) addressParts.push(address.district);
      if (address.subregion) addressParts.push(address.subregion);
      if (address.city) addressParts.push(address.city);
      if (address.region && address.region !== address.city) addressParts.push(address.region);
      if (address.country) addressParts.push(address.country);

      const formattedAddress = addressParts.join(', ');

      return {
        formattedAddress,
        coordinates,
        components: {
          name: address.name || undefined,
          street: address.street || undefined,
          streetNumber: address.streetNumber || undefined,
          district: address.district || undefined,
          subregion: address.subregion || undefined,
          city: address.city || undefined,
          region: address.region || undefined,
          country: address.country || undefined,
          postalCode: address.postalCode || undefined,
          isoCountryCode: address.isoCountryCode || undefined,
        },
      };
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  }

  // Get detailed address for current location
  async getCurrentDetailedAddress(): Promise<DetailedAddress | null> {
    try {
      const coordinates = await this.getCurrentLocation();
      if (!coordinates) {
        return null;
      }

      const detailedAddress = await this.getAddressFromCoordinates(coordinates);
      return detailedAddress;
    } catch (error) {
      console.error('Error getting current detailed address:', error);
      return null;
    }
  }

  // Search for addresses (forward geocoding)
  async searchAddresses(searchText: string): Promise<DetailedAddress[]> {
    try {
      if (searchText.trim().length < 3) {
        return [];
      }

      const geocodedAddresses = await Location.geocodeAsync(searchText);
      
      const detailedAddresses: DetailedAddress[] = [];
      
      for (const geocoded of geocodedAddresses.slice(0, 5)) { // Limit to 5 results
        const address = await this.getAddressFromCoordinates({
          latitude: geocoded.latitude,
          longitude: geocoded.longitude,
        });
        
        if (address) {
          detailedAddresses.push(address);
        }
      }

      return detailedAddresses;
    } catch (error) {
      console.error('Error searching addresses:', error);
      return [];
    }
  }

  // Validate if coordinates are in Vietnam (for delivery area check)
  isInVietnam(coordinates: LocationCoordinates): boolean {
    const { latitude, longitude } = coordinates;
    
    // Vietnam boundaries (approximate)
    const vietnamBounds = {
      north: 23.4,
      south: 8.2,
      east: 109.5,
      west: 102.1,
    };

    return (
      latitude >= vietnamBounds.south &&
      latitude <= vietnamBounds.north &&
      longitude >= vietnamBounds.west &&
      longitude <= vietnamBounds.east
    );
  }

  // Calculate distance between two points (in kilometers)
  calculateDistance(point1: LocationCoordinates, point2: LocationCoordinates): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(point2.latitude - point1.latitude);
    const dLon = this.toRadians(point2.longitude - point1.longitude);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.latitude)) * 
      Math.cos(this.toRadians(point2.latitude)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Check if delivery is available to an address
  async checkDeliveryAvailability(coordinates: LocationCoordinates): Promise<{
    available: boolean;
    distance?: number;
    estimatedTime?: string;
    deliveryFee?: number;
  }> {
    try {
      // Check if in Vietnam
      if (!this.isInVietnam(coordinates)) {
        return {
          available: false,
        };
      }

      // Example coffee shop location (Ho Chi Minh City center)
      const shopLocation: LocationCoordinates = {
        latitude: 10.7769,
        longitude: 106.7009,
      };

      const distance = this.calculateDistance(shopLocation, coordinates);
      
      // Delivery rules
      const maxDeliveryDistance = 20; // 20 km
      const baseDeliveryFee = 15000; // 15,000 VND
      const perKmFee = 3000; // 3,000 VND per km

      if (distance > maxDeliveryDistance) {
        return {
          available: false,
          distance,
        };
      }

      // Calculate delivery fee
      const deliveryFee = baseDeliveryFee + (distance * perKmFee);
      
      // Estimate delivery time (assuming 30 km/h average speed + 15 min preparation)
      const travelTime = (distance / 30) * 60; // minutes
      const totalTime = travelTime + 15; // add preparation time
      
      let estimatedTime: string;
      if (totalTime < 60) {
        estimatedTime = `${Math.round(totalTime)} minutes`;
      } else {
        const hours = Math.floor(totalTime / 60);
        const minutes = Math.round(totalTime % 60);
        estimatedTime = `${hours}h ${minutes}m`;
      }

      return {
        available: true,
        distance,
        estimatedTime,
        deliveryFee: Math.round(deliveryFee),
      };
    } catch (error) {
      console.error('Error checking delivery availability:', error);
      return {
        available: false,
      };
    }
  }

  // Format address for display
  formatAddressForDisplay(address: DetailedAddress): string {
    const { components } = address;
    const parts: string[] = [];

    if (components.streetNumber && components.street) {
      parts.push(`${components.streetNumber} ${components.street}`);
    } else if (components.street) {
      parts.push(components.street);
    }

    if (components.district) parts.push(components.district);
    if (components.city) parts.push(components.city);
    
    return parts.join(', ');
  }

  // Get short address (for display in lists)
  getShortAddress(address: DetailedAddress): string {
    const { components } = address;
    const parts: string[] = [];

    if (components.street) parts.push(components.street);
    if (components.district) parts.push(components.district);
    
    return parts.slice(0, 2).join(', ');
  }
}

export default new LocationService(); 