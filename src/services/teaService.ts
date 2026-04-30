import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Category, Product, Order, OperationType, FirestoreErrorInfo } from '../types';

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Categories
export const getCategories = async (): Promise<Category[]> => {
  const path = 'categories';
  try {
    const snapshot = await getDocs(collection(db, path));
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Category));
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, path);
    return [];
  }
};

// Products
export const getProducts = async (categoryId?: string): Promise<Product[]> => {
  const path = 'products';
  try {
    let q = query(collection(db, path));
    if (categoryId) {
      q = query(q, where('categoryId', '==', categoryId));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Product));
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, path);
    return [];
  }
};

export const saveProduct = async (product: Partial<Product>) => {
  const path = 'products';
  try {
    if (product.id) {
      const { id, ...data } = product;
      await updateDoc(doc(db, path, id), data);
    } else {
      await addDoc(collection(db, path), {
        ...product,
        isAvailable: product.isAvailable ?? true,
      });
    }
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, path);
  }
};

// Orders
export const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'status'>) => {
  const path = 'orders';
  try {
    const newOrder = {
      ...orderData,
      status: 'pending',
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, path), newOrder);
    return docRef.id;
  } catch (e) {
    handleFirestoreError(e, OperationType.CREATE, path);
  }
};

export const subscribeToOrders = (callback: (orders: Order[]) => void) => {
  const path = 'orders';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(d => ({ 
      id: d.id, 
      ...d.data(),
      createdAt: d.data().createdAt?.toDate() // Convert Firestore Timestamp to Date
    } as Order));
    callback(orders);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const updateOrderStatus = async (orderId: string, status: Order['status']) => {
  const path = `orders/${orderId}`;
  try {
    await updateDoc(doc(db, 'orders', orderId), { 
      status, 
      updatedAt: serverTimestamp() 
    });
  } catch (e) {
    handleFirestoreError(e, OperationType.UPDATE, path);
  }
};

// Admin Check
export const checkIsAdmin = async (uid: string): Promise<boolean> => {
  const path = `admins/${uid}`;
  try {
    const snapshot = await getDocs(query(collection(db, 'admins'), where('__name__', '==', uid)));
    return !snapshot.empty;
  } catch (e) {
    // Silently fail or return false if permission denied to check admin list
    return false;
  }
};
