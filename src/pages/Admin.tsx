import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from 'firebase/auth';
import { 
  subscribeToOrders, 
  updateOrderStatus, 
  getCategories, 
  getProducts, 
  saveProduct,
  checkIsAdmin
} from '../services/teaService';
import { Order, Category, Product } from '../types';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  ClipboardList, 
  Leaf, 
  Clock, 
  CheckCircle2, 
  MoreHorizontal, 
  Plus, 
  Trash2,
  AlertCircle
} from 'lucide-react';

interface AdminProps {
  user: User | null;
}

export default function Admin({ user }: AdminProps) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'menu'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // For product editing
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product>>({});

  useEffect(() => {
    if (user) {
      checkIsAdmin(user.uid).then(setIsAdmin);
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      const unsub = subscribeToOrders(setOrders);
      fetchMenuData();
      return unsub;
    }
  }, [isAdmin]);

  const fetchMenuData = async () => {
    const [cats, prods] = await Promise.all([getCategories(), getProducts()]);
    setCategories(cats);
    setProducts(prods);
  };

  const handleSeedData = async () => {
    if (!user) return;
    try {
      // 1. Set current user as admin
      console.log("Setting admin permissions...");
      await setDoc(doc(db, 'admins', user.uid), { email: user.email });
      
      // Wait a moment for Firestore to propagate
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsAdmin(true);

      // 2. Add sample categories
      console.log("Adding categories...");
      const catRefs = await Promise.all([
        addDoc(collection(db, 'categories'), { name: '茶人系列 原味茶', order: 1 }),
        addDoc(collection(db, 'categories'), { name: '經典奶茶', order: 2 }),
      ]);

      // 3. Add sample products (based on user image)
      console.log("Adding products...");
      await Promise.all([
        addDoc(collection(db, 'products'), { name: '輕香烏龍綠', price: 45, categoryId: catRefs[0].id, isAvailable: true, description: '清新脫俗的口感' }),
        addDoc(collection(db, 'products'), { name: '糯米香茶', price: 45, categoryId: catRefs[0].id, isAvailable: true, description: '獨特的糯米清香' }),
        addDoc(collection(db, 'products'), { name: '島韻紅茶', price: 40, categoryId: catRefs[0].id, isAvailable: true, description: '醇厚紮實的茶韻' }),
        addDoc(collection(db, 'products'), { name: '炭培烏龍', price: 40, categoryId: catRefs[0].id, isAvailable: true, description: '深邃的炭火香氣' }),
        addDoc(collection(db, 'products'), { name: '油切蕎麥茶', price: 40, categoryId: catRefs[0].id, isAvailable: true, description: '健康首選，推薦無糖' }),
        addDoc(collection(db, 'products'), { name: '手採高山青', price: 40, categoryId: catRefs[0].id, isAvailable: true, description: '來自高山的純淨茶湯' }),
        addDoc(collection(db, 'products'), { name: '紅茶拿鐵', price: 60, categoryId: catRefs[1].id, isAvailable: true, description: '斯里蘭卡紅茶搭配鮮奶' }),
      ]);

      await fetchMenuData();
      alert('初始化成功！請點擊上方標籤切換回「訂單管理」或查看「菜單設置」');
    } catch (e: any) {
      console.error(e);
      alert(`初始化失敗: ${e.message || '未知錯誤'}`);
    }
  };

  if (isAdmin === null) return <div className="text-center py-20">權限檢查中...</div>;

  if (isAdmin === false) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle size={64} className="text-red-400 mb-6" />
        <h2 className="text-2xl font-serif font-bold mb-4">存取被拒</h2>
        <p className="text-gray-500 mb-8 max-w-sm">您目前沒有管理員權限。如果您是管理員，請使用正確的帳號登入。</p>
        {!user ? (
          <p className="text-sm text-gray-400 italic">請先登入帳號來檢查權限</p>
        ) : (
          <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200">
             <p className="text-amber-800 text-sm mb-4">這是個測試用按鈕，點擊後會將目前的帳號設為管理員並匯入預設菜單。</p>
             <button 
              onClick={handleSeedData}
              className="bg-amber-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-amber-600 transition-all"
            >
              初始化管理員與菜單
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-100">
        <button 
          onClick={() => setActiveTab('orders')}
          className={`pb-4 px-2 text-sm font-bold transition-all relative ${activeTab === 'orders' ? 'text-[#5A5A40]' : 'text-gray-400'}`}
        >
          訂單管理
          {activeTab === 'orders' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-[#5A5A40] rounded-t-full" />}
        </button>
        <button 
          onClick={() => setActiveTab('menu')}
          className={`pb-4 px-2 text-sm font-bold transition-all relative ${activeTab === 'menu' ? 'text-[#5A5A40]' : 'text-gray-400'}`}
        >
          菜單設置
          {activeTab === 'menu' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-[#5A5A40] rounded-t-full" />}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'orders' ? (
          <motion.div
            key="orders"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 gap-4">
              {orders.map(order => (
                <div key={order.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                       <span className="bg-[#F5F5F0] text-[#5A5A40] px-3 py-1 rounded-full text-xs font-mono font-bold">
                        #{order.id.slice(-4).toUpperCase()}
                      </span>
                      <h4 className="font-bold text-lg">{order.customerName}</h4>
                      <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-md font-bold ${
                        order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        order.status === 'preparing' ? 'bg-blue-100 text-blue-700' :
                        order.status === 'ready' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 space-y-1">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex gap-2">
                          <span className="font-bold text-[#5A5A40]">{item.quantity}x</span>
                          <span>{item.name} ({item.ice}/{item.sugar})</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="md:w-32 text-right">
                    <div className="text-xs text-gray-400 mb-1">總計</div>
                    <div className="font-mono font-bold text-lg">${order.totalPrice}</div>
                  </div>

                  <div className="flex gap-2 pt-4 md:pt-0 border-t md:border-0 border-gray-50">
                    {order.status === 'pending' && (
                      <button 
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                        className="bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-600 transition-all"
                      >
                        開始製作
                      </button>
                    )}
                    {order.status === 'preparing' && (
                      <button 
                        onClick={() => updateOrderStatus(order.id, 'ready')}
                        className="bg-green-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-600 transition-all"
                      >
                        準備出餐
                      </button>
                    )}
                    {order.status === 'ready' && (
                      <button 
                        onClick={() => updateOrderStatus(order.id, 'completed')}
                        className="bg-gray-800 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-black transition-all"
                      >
                        完成結案
                      </button>
                    )}
                    {order.status !== 'completed' && order.status !== 'cancelled' && (
                      <button 
                        onClick={() => updateOrderStatus(order.id, 'cancelled')}
                        className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                         <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {orders.length === 0 && (
                <div className="text-center py-20 text-gray-400 border-2 border-dashed rounded-3xl">
                   尚無任何訂單
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="menu"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-serif font-bold text-xl">飲品清單</h3>
              <button 
                onClick={() => {
                  setEditingProduct({ isAvailable: true });
                  setIsEditingProduct(true);
                }}
                className="flex items-center gap-2 bg-[#5A5A40] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-[#5A5A40]/20"
              >
                <Plus size={16} />
                新增飲品
              </button>
            </div>

            <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-[10px] uppercase tracking-widest text-gray-400 font-bold border-b">
                    <th className="px-6 py-4">名稱</th>
                    <th className="px-6 py-4">分類</th>
                    <th className="px-6 py-4 font-mono">價格</th>
                    <th className="px-6 py-4">狀態</th>
                    <th className="px-6 py-4 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {products.map(product => (
                    <tr key={product.id} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold">{product.name}</td>
                      <td className="px-6 py-4 text-gray-500">
                        {categories.find(c => c.id === product.categoryId)?.name || '未分類'}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-[#5A5A40]">${product.price}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${product.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {product.isAvailable ? '供應中' : '暫停供應'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                           onClick={() => {
                             setEditingProduct(product);
                             setIsEditingProduct(true);
                           }}
                           className="text-gray-400 hover:text-[#5A5A40] transition-colors"
                        >
                          <MoreHorizontal />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Product Modal */}
      <AnimatePresence>
        {isEditingProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
              onClick={() => setIsEditingProduct(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl overflow-hidden"
            >
              <h3 className="text-2xl font-serif font-bold mb-8">
                {editingProduct.id ? '編輯飲品' : '新增飲品'}
              </h3>
              
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">品名</label>
                  <input 
                    type="text" 
                    value={editingProduct.name || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-[#5A5A40] outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">價格</label>
                    <input 
                      type="number" 
                      value={editingProduct.price || 0}
                      onChange={(e) => setEditingProduct({...editingProduct, price: Number(e.target.value)})}
                      className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-[#5A5A40] outline-none transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">分類</label>
                    <select 
                      value={editingProduct.categoryId || ''}
                      onChange={(e) => setEditingProduct({...editingProduct, categoryId: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-[#5A5A40] outline-none transition-all"
                    >
                      <option value="">請選擇分類</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-4 py-2">
                  <input 
                    type="checkbox" 
                    id="available"
                    checked={editingProduct.isAvailable} 
                    onChange={(e) => setEditingProduct({...editingProduct, isAvailable: e.target.checked})}
                    className="w-5 h-5 accent-[#5A5A40]"
                  />
                  <label htmlFor="available" className="font-bold text-sm">供應中</label>
                </div>
              </div>

              <div className="flex gap-4 mt-10">
                <button 
                  onClick={() => setIsEditingProduct(false)}
                  className="flex-1 py-4 text-gray-400 font-bold"
                >
                  取消
                </button>
                <button 
                  onClick={async () => {
                    await saveProduct(editingProduct);
                    setIsEditingProduct(false);
                    fetchMenuData();
                  }}
                  className="flex-1 py-4 bg-[#5A5A40] text-white rounded-2xl font-bold shadow-lg shadow-[#5A5A40]/30"
                >
                  儲存
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
