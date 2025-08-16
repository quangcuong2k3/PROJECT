import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import {firestore} from '../../firebaseconfig';

// Types
export interface StockLevel {
  size: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  cost: number;
  lastRestocked: Timestamp;
}

export interface InventoryItem {
  id?: string;
  productId: string;
  productName: string;
  productType: 'Coffee' | 'Bean';
  sku: string;
  stockLevels: StockLevel[];
  totalStock: number;
  totalValue: number;
  supplier: string;
  location: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued';
  notes?: string;
  createdAt: Timestamp;
  lastUpdated: Timestamp;
}

export interface StockAlert {
  id?: string;
  productId: string;
  productName: string;
  size: string;
  alertType: 'low_stock' | 'out_of_stock' | 'reorder_point';
  currentStock: number;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isRead: boolean;
  inventoryItemId: string;
  createdAt: Timestamp;
}

export interface StockMovement {
  id?: string;
  productId: string;
  productName: string;
  size: string;
  movementType: 'in' | 'out' | 'adjustment' | 'transfer';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  reference?: string; // Order ID, Transfer ID, etc.
  userId: string;
  createdAt: Timestamp;
}

// ======================
// INVENTORY OPERATIONS
// ======================

export const fetchInventoryItems = async (): Promise<InventoryItem[]> => {
  try {
    console.log('🔄 Fetching inventory items...');
    const snapshot = await getDocs(
      query(collection(firestore, 'inventory'), orderBy('productName'))
    );
    
    const items: InventoryItem[] = [];
    snapshot.forEach(doc => {
      items.push({
        id: doc.id,
        ...doc.data(),
      } as InventoryItem);
    });
    
    console.log(`✅ Fetched ${items.length} inventory items`);
    return items;
  } catch (error) {
    console.error('❌ Error fetching inventory items:', error);
    throw error;
  }
};

export const fetchInventoryByProduct = async (productId: string): Promise<InventoryItem | null> => {
  try {
    console.log(`🔍 Fetching inventory for product: ${productId}`);
    const snapshot = await getDocs(
      query(collection(firestore, 'inventory'), where('productId', '==', productId))
    );
    
    if (snapshot.empty) {
      console.log('📦 No inventory found for product');
      return null;
    }
    
    const doc = snapshot.docs[0];
    const item = {
      id: doc.id,
      ...doc.data(),
    } as InventoryItem;
    
    console.log(`✅ Found inventory for ${item.productName}`);
    return item;
  } catch (error) {
    console.error('❌ Error fetching inventory by product:', error);
    throw error;
  }
};

export const updateStock = async (
  inventoryId: string,
  size: string,
  newStock: number,
  reason: string,
  userId: string
): Promise<void> => {
  try {
    console.log(`🔄 Updating stock for inventory ${inventoryId}, size ${size} to ${newStock}`);
    
    // Get current inventory item
    const inventoryRef = doc(firestore, 'inventory', inventoryId);
    const inventorySnapshot = await getDocs(
      query(collection(firestore, 'inventory'), where('__name__', '==', inventoryId))
    );
    
    if (inventorySnapshot.empty) {
      throw new Error('Inventory item not found');
    }
    
    const inventoryData = inventorySnapshot.docs[0].data() as InventoryItem;
    const stockLevelIndex = inventoryData.stockLevels.findIndex(level => level.size === size);
    
    if (stockLevelIndex === -1) {
      throw new Error(`Size ${size} not found in inventory`);
    }
    
    const previousStock = inventoryData.stockLevels[stockLevelIndex].currentStock;
    const stockDifference = newStock - previousStock;
    
    // Update stock level
    inventoryData.stockLevels[stockLevelIndex].currentStock = newStock;
    inventoryData.stockLevels[stockLevelIndex].lastRestocked = Timestamp.now();
    
    // Recalculate total stock and value
    inventoryData.totalStock = inventoryData.stockLevels.reduce((total, level) => total + level.currentStock, 0);
    inventoryData.totalValue = inventoryData.stockLevels.reduce((total, level) => total + (level.currentStock * level.cost), 0);
    inventoryData.lastUpdated = Timestamp.now();
    
    // Determine status
    const hasOutOfStock = inventoryData.stockLevels.some(level => level.currentStock === 0);
    const hasLowStock = inventoryData.stockLevels.some(level => level.currentStock <= level.reorderPoint);
    
    if (hasOutOfStock) {
      inventoryData.status = 'out_of_stock';
    } else if (hasLowStock) {
      inventoryData.status = 'low_stock';
    } else {
      inventoryData.status = 'in_stock';
    }
    
    // Update inventory
    await updateDoc(inventoryRef, {
      stockLevels: inventoryData.stockLevels,
      totalStock: inventoryData.totalStock,
      totalValue: inventoryData.totalValue,
      status: inventoryData.status,
      lastUpdated: inventoryData.lastUpdated,
    });
    
    // Record stock movement
    await addDoc(collection(firestore, 'stockMovements'), {
      productId: inventoryData.productId,
      productName: inventoryData.productName,
      size,
      movementType: stockDifference > 0 ? 'in' : stockDifference < 0 ? 'out' : 'adjustment',
      quantity: Math.abs(stockDifference),
      previousStock,
      newStock,
      reason,
      userId,
      createdAt: Timestamp.now(),
    } as Omit<StockMovement, 'id'>);
    
    // Check for alerts
    await checkAndCreateStockAlerts(inventoryData);
    
    console.log(`✅ Stock updated successfully`);
  } catch (error) {
    console.error('❌ Error updating stock:', error);
    throw error;
  }
};

export const addInventoryItem = async (item: Omit<InventoryItem, 'id'>): Promise<string> => {
  try {
    console.log(`🔄 Adding new inventory item: ${item.productName}`);
    
    const docRef = await addDoc(collection(firestore, 'inventory'), {
      ...item,
      createdAt: Timestamp.now(),
      lastUpdated: Timestamp.now(),
    });
    
    console.log(`✅ Inventory item added with ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error adding inventory item:', error);
    throw error;
  }
};

// ======================
// STOCK ALERTS
// ======================

export const fetchStockAlerts = async (includeRead: boolean = false): Promise<StockAlert[]> => {
  try {
    console.log('🔄 Fetching stock alerts...');
    
    // Simplified query to avoid composite index requirement
    let alertQuery = query(
      collection(firestore, 'stockAlerts'),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(alertQuery);
    const alerts: StockAlert[] = [];
    
    snapshot.forEach(doc => {
      const alertData = {
        id: doc.id,
        ...doc.data(),
      } as StockAlert;
      
      // Filter in memory instead of using composite query
      if (includeRead || !alertData.isRead) {
        alerts.push(alertData);
      }
    });
    
    console.log(`✅ Fetched ${alerts.length} stock alerts`);
    return alerts;
  } catch (error) {
    console.error('❌ Error fetching stock alerts:', error);
    throw error;
  }
};

export const markAlertAsRead = async (alertId: string): Promise<void> => {
  try {
    const alertRef = doc(firestore, 'stockAlerts', alertId);
    await updateDoc(alertRef, {
      isRead: true,
    });
    console.log(`✅ Alert ${alertId} marked as read`);
  } catch (error) {
    console.error('❌ Error marking alert as read:', error);
    throw error;
  }
};

export const deleteAlert = async (alertId: string): Promise<void> => {
  try {
    await deleteDoc(doc(firestore, 'stockAlerts', alertId));
    console.log(`✅ Alert ${alertId} deleted`);
  } catch (error) {
    console.error('❌ Error deleting alert:', error);
    throw error;
  }
};

const checkAndCreateStockAlerts = async (inventoryItem: InventoryItem): Promise<void> => {
  try {
    for (const stockLevel of inventoryItem.stockLevels) {
      let alertType: StockAlert['alertType'] | null = null;
      let severity: StockAlert['severity'] = 'low';
      
      if (stockLevel.currentStock === 0) {
        alertType = 'out_of_stock';
        severity = 'critical';
      } else if (stockLevel.currentStock <= stockLevel.reorderPoint) {
        alertType = 'reorder_point';
        severity = stockLevel.currentStock <= stockLevel.minStock ? 'high' : 'medium';
      } else if (stockLevel.currentStock <= stockLevel.minStock) {
        alertType = 'low_stock';
        severity = 'medium';
      }
      
      if (alertType) {
        // Check if alert already exists
        const existingAlerts = await getDocs(
          query(
            collection(firestore, 'stockAlerts'),
            where('productId', '==', inventoryItem.productId),
            where('size', '==', stockLevel.size),
            where('alertType', '==', alertType),
            where('isRead', '==', false)
          )
        );
        
        if (existingAlerts.empty) {
          await addDoc(collection(firestore, 'stockAlerts'), {
            productId: inventoryItem.productId,
            productName: inventoryItem.productName,
            size: stockLevel.size,
            alertType,
            currentStock: stockLevel.currentStock,
            threshold: alertType === 'out_of_stock' ? 0 : 
                      alertType === 'reorder_point' ? stockLevel.reorderPoint : stockLevel.minStock,
            severity,
            isRead: false,
            inventoryItemId: inventoryItem.id || '',
            createdAt: Timestamp.now(),
          } as Omit<StockAlert, 'id'>);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error checking stock alerts:', error);
  }
};

// ======================
// STOCK MOVEMENTS
// ======================

export const fetchStockMovements = async (
  productId?: string,
  limit: number = 50
): Promise<StockMovement[]> => {
  try {
    console.log('🔄 Fetching stock movements...');
    
    let movementQuery = query(
      collection(firestore, 'stockMovements'),
      orderBy('createdAt', 'desc')
    );
    
    if (productId) {
      movementQuery = query(
        collection(firestore, 'stockMovements'),
        where('productId', '==', productId),
        orderBy('createdAt', 'desc')
      );
    }
    
    const snapshot = await getDocs(movementQuery);
    const movements: StockMovement[] = [];
    
    let count = 0;
    snapshot.forEach(doc => {
      if (count < limit) {
        movements.push({
          id: doc.id,
          ...doc.data(),
        } as StockMovement);
        count++;
      }
    });
    
    console.log(`✅ Fetched ${movements.length} stock movements`);
    return movements;
  } catch (error) {
    console.error('❌ Error fetching stock movements:', error);
    throw error;
  }
};

// ======================
// REAL-TIME SUBSCRIPTIONS
// ======================

export const subscribeToInventory = (
  callback: (items: InventoryItem[]) => void
): (() => void) => {
  console.log('🔄 Setting up inventory subscription...');
  
  const unsubscribe = onSnapshot(
    query(collection(firestore, 'inventory'), orderBy('productName')),
    (snapshot) => {
      const items: InventoryItem[] = [];
      snapshot.forEach(doc => {
        items.push({
          id: doc.id,
          ...doc.data(),
        } as InventoryItem);
      });
      callback(items);
    },
    (error) => {
      console.error('❌ Error in inventory subscription:', error);
    }
  );
  
  return unsubscribe;
};

export const subscribeToStockAlerts = (
  callback: (alerts: StockAlert[]) => void
): (() => void) => {
  console.log('🔄 Setting up stock alerts subscription...');
  
  // Simplified subscription to avoid composite index requirement
  const unsubscribe = onSnapshot(
    query(
      collection(firestore, 'stockAlerts'),
      orderBy('createdAt', 'desc')
    ),
    (snapshot) => {
      const alerts: StockAlert[] = [];
      snapshot.forEach(doc => {
        const alertData = {
          id: doc.id,
          ...doc.data(),
        } as StockAlert;
        
        // Filter unread alerts in memory
        if (!alertData.isRead) {
          alerts.push(alertData);
        }
      });
      callback(alerts);
    },
    (error) => {
      console.error('❌ Error in stock alerts subscription:', error);
    }
  );
  
  return unsubscribe;
};

// ======================
// UTILITY FUNCTIONS
// ======================

export const getInventoryStats = (items: InventoryItem[]) => {
  const totalProducts = items.length;
  const inStock = items.filter(item => item.status === 'in_stock').length;
  const lowStock = items.filter(item => item.status === 'low_stock').length;
  const outOfStock = items.filter(item => item.status === 'out_of_stock').length;
  const totalValue = items.reduce((sum, item) => sum + item.totalValue, 0);
  const totalStock = items.reduce((sum, item) => sum + item.totalStock, 0);
  
  return {
    totalProducts,
    inStock,
    lowStock,
    outOfStock,
    totalValue,
    totalStock,
    stockPercentage: {
      inStock: totalProducts > 0 ? (inStock / totalProducts) * 100 : 0,
      lowStock: totalProducts > 0 ? (lowStock / totalProducts) * 100 : 0,
      outOfStock: totalProducts > 0 ? (outOfStock / totalProducts) * 100 : 0,
    }
  };
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}; 