import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getCategories, getProducts, createOrder } from '../services/teaService';
import { Category, Product, OrderItem } from '../types';
import { ShoppingCart, Plus, Minus, X, Check } from 'lucide-react';

export default function Menu() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Selection state
  const [selectedIce, setSelectedIce] = useState('正常冰');
  const [selectedSugar, setSelectedSugar] = useState('全糖');
  const [quantity, setQuantity] = useState(1);
  
  const [customerName, setCustomerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [cats, prods] = await Promise.all([getCategories(), getProducts()]);
      setCategories(cats);
      setProducts(prods);
      setLoading(false);
    };
    fetchData();
  }, []);

  const filteredProducts = activeCategory === 'all' 
    ? products 
    : products.filter(p => p.categoryId === activeCategory);

  const addToCart = () => {
    if (!selectedProduct) return;
    const newItem: OrderItem = {
      productId: selectedProduct.id,
      name: selectedProduct.name,
      price: selectedProduct.price,
      quantity: quantity,
      ice: selectedIce,
      sugar: selectedSugar
    };
    setCart([...cart, newItem]);
    setSelectedProduct(null);
    // Reset options
    setSelectedIce('正常冰');
    setSelectedSugar('全糖');
    setQuantity(1);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmitOrder = async () => {
    if (!customerName || cart.length === 0) return;
    
    setIsSubmitting(true);
    try {
      await createOrder({
        customerName,
        items: cart,
        totalPrice,
      });
      setOrderSuccess(true);
      setCart([]);
      setCustomerName('');
      setTimeout(() => {
        setOrderSuccess(false);
        setIsCartOpen(false);
      }, 3000);
    } catch (e) {
      alert('訂單提交失敗，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-20 font-serif">準備菜單中...</div>;

  return (
    <div className="relative">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Categories Sidebar */}
        <aside className="w-full md:w-48 flex-shrink-0">
          <div className="sticky top-24 flex md:flex-col overflow-x-auto md:overflow-x-visible pb-4 md:pb-0 gap-2">
            <button
              onClick={() => setActiveCategory('all')}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeCategory === 'all' 
                ? 'bg-[#5A5A40] text-white shadow-lg shadow-[#5A5A40]/30' 
                : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              全部飲品
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeCategory === cat.id 
                  ? 'bg-[#5A5A40] text-white shadow-lg shadow-[#5A5A40]/30' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => (
              <motion.div
                layout
                key={product.id}
                className="bg-white rounded-3xl p-5 border border-[#5A5A40]/5 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="aspect-square bg-[#F5F5F0] rounded-2xl mb-4 overflow-hidden relative">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#5A5A40]/20">
                      <Plus size={48} />
                    </div>
                  )}
                  {!product.isAvailable && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center font-bold text-gray-500">
                      已售完
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg">{product.name}</h3>
                  <span className="font-mono text-[#5A5A40] font-bold">${product.price}</span>
                </div>
                <p className="text-xs text-gray-400 mb-4 line-clamp-2">{product.description || '精心製作的職人飲品'}</p>
                <button
                  disabled={!product.isAvailable}
                  onClick={() => setSelectedProduct(product)}
                  className="w-full py-2 bg-[#F5F5F0] text-[#5A5A40] rounded-xl text-sm font-bold group-hover:bg-[#5A5A40] group-hover:text-white transition-all disabled:opacity-50"
                >
                  加入購物車
                </button>
              </motion.div>
            ))}
          </div>
          {filteredProducts.length === 0 && (
            <div className="text-center py-20 text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl">
              目前此分類尚無飲品
            </div>
          )}
        </div>
      </div>

      {/* Cart Button */}
      {cart.length > 0 && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-8 right-8 w-16 h-16 bg-[#5A5A40] text-white rounded-full shadow-2xl flex items-center justify-center z-40"
        >
          <ShoppingCart />
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center border-2 border-white font-bold">
            {cart.length}
          </span>
        </motion.button>
      )}

      {/* Product Options Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-8">
                <h3 className="text-2xl font-serif font-bold mb-6">{selectedProduct.name} 選擇規格</h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">數量</label>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-10 h-10 border rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors"
                      >
                        <Minus size={18} />
                      </button>
                      <span className="text-xl font-mono font-bold w-12 text-center">{quantity}</span>
                      <button 
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-10 h-10 border rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">冰量</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['正常冰', '少冰', '去冰'].map(lvl => (
                        <button 
                          key={lvl}
                          onClick={() => setSelectedIce(lvl)}
                          className={`px-4 py-2 border rounded-xl text-sm transition-all ${
                            selectedIce === lvl ? 'bg-[#5A5A40] text-white border-[#5A5A40]' : 'hover:border-[#5A5A40]'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">甜度</label>
                    <div className="grid grid-cols-4 gap-2">
                       {['全糖', '半糖', '微糖', '無糖'].map(lvl => (
                        <button 
                          key={lvl}
                          onClick={() => setSelectedSugar(lvl)}
                          className={`px-2 py-2 border rounded-xl text-sm transition-all ${
                            selectedSugar === lvl ? 'bg-[#5A5A40] text-white border-[#5A5A40]' : 'hover:border-[#5A5A40]'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-10 flex gap-4">
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="flex-1 py-4 text-gray-500 font-bold"
                  >
                    取消
                  </button>
                  <button
                    onClick={addToCart}
                    className="flex-1 py-4 bg-[#5A5A40] text-white rounded-2xl font-bold shadow-lg shadow-[#5A5A40]/30"
                  >
                    加入
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b flex justify-between items-center">
                <h3 className="text-xl font-serif font-bold">我的購物車 ({cart.length})</h3>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex gap-4 p-4 bg-gray-50 rounded-2xl">
                    <div className="flex-1">
                      <div className="flex justify-between font-bold">
                        <span>{item.name}</span>
                        <span>${item.price}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1 flex gap-2">
                        <span>{item.ice}</span>
                        <span>/</span>
                        <span>{item.sugar}</span>
                      </div>
                    </div>
                    <button onClick={() => removeFromCart(idx)} className="text-red-300 hover:text-red-500"><X size={18} /></button>
                  </div>
                ))}
                {cart.length === 0 && !orderSuccess && (
                  <div className="text-center py-20 text-gray-400">購物車是空的</div>
                )}
                {orderSuccess && (
                  <div className="text-center py-20 text-[#5A5A40] flex flex-col items-center">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                      <Check size={32} />
                    </div>
                    <p className="font-bold text-xl">訂單已送出！</p>
                    <p className="text-sm opacity-60 mt-1">請稍候取餐</p>
                  </div>
                )}
              </div>

              <div className="p-6 border-t bg-gray-50/50">
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-lg font-bold">
                    <span>總計</span>
                    <span className="font-mono">${totalPrice}</span>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">大名 / 稱呼</label>
                    <input 
                      type="text" 
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="例如：王小明"
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-[#5A5A40] outline-none transition-all"
                    />
                  </div>
                </div>
                <button
                  disabled={isSubmitting || cart.length === 0 || !customerName || orderSuccess}
                  onClick={handleSubmitOrder}
                  className="w-full py-4 bg-[#5A5A40] text-white rounded-2xl font-bold shadow-lg shadow-[#5A5A40]/30 disabled:opacity-50 transition-all"
                >
                  {isSubmitting ? '處理中...' : '確認下單'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
