import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {useStore} from '../store/firebaseStore';
import {BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING} from '../theme/theme';
import HeaderBar from '../components/HeaderBar';
import CustomIcon from '../components/CustomIcon';

const {width: screenWidth} = Dimensions.get('window');

interface AdminScreenProps {
  navigation: any;
}

const AdminScreen: React.FC<AdminScreenProps> = ({navigation}) => {
  const {user, isAuthenticated} = useStore();

  const adminFeatures = [
    {
      id: 'inventory',
      title: 'Inventory Management',
      subtitle: 'Manage stock levels, alerts, and analytics',
      icon: 'cube',
      color: COLORS.primaryOrangeHex,
      screen: 'Inventory',
    },
    {
      id: 'movements',
      title: 'Stock Movements',
      subtitle: 'Track inventory changes and history',
      icon: 'swap-horizontal',
      color: '#6B73FF',
      screen: 'StockMovements',
    },
    {
      id: 'reports',
      title: 'Reports & Analytics',
      subtitle: 'View detailed business insights',
      icon: 'document-text',
      color: '#50C878',
      screen: 'Reports',
    },
    {
      id: 'settings',
      title: 'Admin Settings',
      subtitle: 'Configure system preferences',
      icon: 'settings',
      color: '#FF6B6B',
      screen: 'AdminSettings',
    },
  ];

  const handleFeaturePress = (feature: typeof adminFeatures[0]) => {
    if (feature.screen === 'Inventory') {
      // Navigate to the AdminTabNavigator which contains InventoryScreen
      navigation.navigate('AdminTabs');
    } else if (feature.screen === 'StockMovements') {
      navigation.navigate('StockMovements');
    } else {
      // For future features
      console.log(`Navigate to ${feature.screen}`);
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={COLORS.primaryBlackHex} barStyle="light-content" />
        <HeaderBar title="Admin Panel" />
        <View style={styles.centerContainer}>
          <View style={styles.authPrompt}>
            <CustomIcon name="lock-closed" size={48} color={COLORS.primaryOrangeHex} />
            <Text style={styles.authTitle}>Authentication Required</Text>
            <Text style={styles.authSubtext}>
              Please log in with admin credentials to access management features
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.primaryBlackHex} barStyle="light-content" />
      <HeaderBar title="Admin Panel" />

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome, Admin</Text>
          <Text style={styles.welcomeSubtitle}>
            Manage your coffee business efficiently
          </Text>
        </View>

        {/* Admin Features Grid */}
        <View style={styles.featuresGrid}>
          {adminFeatures.map((feature, index) => (
            <TouchableOpacity
              key={feature.id}
              style={[
                styles.featureCard,
                {
                  marginRight: index % 2 === 0 ? SPACING.space_8 : 0,
                  marginLeft: index % 2 === 1 ? SPACING.space_8 : 0,
                }
              ]}
              onPress={() => handleFeaturePress(feature)}
              activeOpacity={0.8}>
              
              <View style={[styles.featureIconContainer, {backgroundColor: feature.color + '20'}]}>
                <CustomIcon 
                  name={feature.icon} 
                  size={32} 
                  color={feature.color} 
                />
              </View>
              
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureSubtitle}>{feature.subtitle}</Text>
              </View>
              
              <View style={styles.featureArrow}>
                <CustomIcon 
                  name="chevron-forward" 
                  size={20} 
                  color={COLORS.primaryLightGreyHex} 
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStatsSection}>
          <Text style={styles.sectionTitle}>Quick Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>--</Text>
              <Text style={styles.statLabel}>Total Products</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>--</Text>
              <Text style={styles.statLabel}>Low Stock Alerts</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>--</Text>
              <Text style={styles.statLabel}>Today's Orders</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>--</Text>
              <Text style={styles.statLabel}>Revenue</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authPrompt: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_20,
    padding: SPACING.space_32,
    alignItems: 'center',
    margin: SPACING.space_20,
  },
  authTitle: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_20,
    color: COLORS.primaryWhiteHex,
    marginTop: SPACING.space_16,
    marginBottom: SPACING.space_8,
  },
  authSubtext: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryLightGreyHex,
    textAlign: 'center',
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.space_20,
    paddingBottom: SPACING.space_20,
  },
  welcomeSection: {
    paddingVertical: SPACING.space_20,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_24,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_8,
  },
  welcomeSubtitle: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryLightGreyHex,
    textAlign: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.space_32,
  },
  featureCard: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_20,
    padding: SPACING.space_20,
    marginBottom: SPACING.space_16,
    width: (screenWidth - SPACING.space_40 - SPACING.space_16) / 2,
    elevation: 3,
    shadowColor: COLORS.primaryBlackHex,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  featureIconContainer: {
    width: 60,
    height: 60,
    borderRadius: BORDERRADIUS.radius_15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.space_16,
  },
  featureContent: {
    flex: 1,
    marginBottom: SPACING.space_12,
  },
  featureTitle: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_4,
  },
  featureSubtitle: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
    lineHeight: 16,
  },
  featureArrow: {
    alignSelf: 'flex-end',
  },
  quickStatsSection: {
    marginTop: SPACING.space_20,
  },
  sectionTitle: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_20,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_16,
    width: (screenWidth - SPACING.space_40 - SPACING.space_16) / 2,
    marginBottom: SPACING.space_12,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_20,
    color: COLORS.primaryOrangeHex,
    marginBottom: SPACING.space_4,
  },
  statLabel: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
    textAlign: 'center',
  },
});

export default AdminScreen; 