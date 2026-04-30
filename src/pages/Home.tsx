import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Coffee, ShoppingBag, Settings } from 'lucide-react';

export default function Home() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center min-h-[70vh] text-center"
    >
      <h1 className="text-5xl font-serif font-bold text-[#5A5A40] mb-4">
        品味純粹，享茶時光
      </h1>
      <p className="text-gray-600 mb-12 max-w-lg">
        在這裡，我們用最誠摯的心為您準備每一杯茶。從挑選茶葉到掌握水溫，只為呈現在那一抹清香。
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        <Link 
          to="/menu"
          className="group p-8 bg-white rounded-3xl border border-[#5A5A40]/10 hover:border-[#5A5A40]/30 hover:shadow-xl transition-all flex flex-col items-center"
        >
          <div className="w-16 h-16 bg-[#F5F5F0] rounded-2xl flex items-center justify-center mb-4 group-hover:bg-[#5A5A40] group-hover:text-white transition-colors">
            <ShoppingBag size={32} />
          </div>
          <h2 className="text-xl font-bold mb-2">瀏覽菜單</h2>
          <p className="text-sm text-gray-500">查看我們精心推出的各類茶飲並直接下單</p>
        </Link>

        <Link 
          to="/admin"
          className="group p-8 bg-white rounded-3xl border border-[#5A5A40]/10 hover:border-[#5A5A40]/30 hover:shadow-xl transition-all flex flex-col items-center"
        >
          <div className="w-16 h-16 bg-[#F5F5F0] rounded-2xl flex items-center justify-center mb-4 group-hover:bg-[#5A5A40] group-hover:text-white transition-colors">
            <Settings size={32} />
          </div>
          <h2 className="text-xl font-bold mb-2">管理後台</h2>
          <p className="text-sm text-gray-500">管理茶飲資料、查看即時訂單狀態</p>
        </Link>
      </div>

      <div className="mt-16 opacity-30">
        <div className="flex gap-4">
          <Coffee size={24} />
          <Coffee size={24} />
          <Coffee size={24} />
        </div>
      </div>
    </motion.div>
  );
}
