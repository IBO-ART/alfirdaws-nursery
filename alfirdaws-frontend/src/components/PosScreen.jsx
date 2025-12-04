// استيراد useState من React لإدارة حالة الشاشة
import { useState, useEffect } from 'react';
// استيراد axios للتواصل مع الخادم API
import axios from 'axios';

// مكون شاشة نقطة البيع
function PosScreen() {
  // إدارة حالة البحث وسلة المشتريات
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [batches, setBatches] = useState([]); // سنحتاج لقائمة الدفعات للبحث فيها

  // جلب قائمة الدفعات عند تحميل الشاشة
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const response = await axios.get('http://process.env.NEXT_PUBLIC_API_URL/api/batches');
        setBatches(response.data);
      } catch (err) {
        console.error("فشل في جلب الدفعات:", err);
      }
    };
    fetchBatches();
  }, []);

  // دالة لإضافة نبتة إلى السلة
  const handleAddToCart = (batch) => {
    // تحقق مما إذا كانت الكمية متاحة
    if (batch.current_quantity <= 0) {
      alert(`عذراً، الكمية متوفرة من ${batch.plant_name} هي 0`);
      return;
    }
    // تحقق مما إذا كانت النبتة موجودة بالفعل في السلة
    const existingItem = cart.find(item => item.id === batch.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === batch.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...batch, quantity: 1 }]);
    }
  };

  // دالة لحساب الإجمالي
  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.selling_price * item.quantity), 0).toFixed(2);
  };

  // دالة لإتمام البيع (سنقوم بتنفيذها لاحقاً)
   // دالة لإتمام البيع (النسخة الحقيقية)
  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert("السلة فارغة!");
      return;
    }

    // إنشاء قائمة من الطلبات لكل منتج في السلة
    const salePromises = cart.map(item => {
      const newQuantity = item.current_quantity - item.quantity;
      if (newQuantity < 0) {
        // إذا كانت الكمية غير كافية، نرجع وعدم تنفيذ أي عملية
        throw new Error(`الكمية المتوفرة من ${item.plant_name} غير كافية!`);
      }
      // إرسال طلب تحديث لكل منتج
      return axios.put(`http://process.env.NEXT_PUBLIC_API_URL/api/batches/${item.id}`, {
        current_quantity: newQuantity,
        status: newQuantity === 0 ? 'sold_out' : 'available' // تغيير الحالة إذا نفدت الكمية
      });
    });

    try {
      // تنفيذ جميع عمليات البيع في نفس الوقت والانتظار حتى تنتهي كلها
      await Promise.all(salePromises);

      // إذا نجحت كل العمليات
      alert(`تم البيع بنجاح! الإجمالي: ${calculateTotal()} دج`);
      setCart([]); // تفريغ السلة
      setSearchTerm(''); // مسح حقل البحث
      
    } catch (error) {
      // إذا فشلت أي عملية
      alert(`فشل في إتمام البيع: ${error.message}`);
      console.error(error);
    }
  };

  return (
    <div className="pos-screen">
      <div className="pos-search-section">
        <h2>نقطة البيع</h2>
        <input
          type="text"
          className="pos-search-bar"
          placeholder="ابحث عن نبات أو امسح رمز QR..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="pos-main-content">
        <div className="pos-items-list">
          <h3>البحث</h3>
          {/* عرض النباتات المطابقة للبحث */}
          {batches.filter(batch => 
            batch.plant_name.toLowerCase().includes(searchTerm.toLowerCase()) && batch.current_quantity > 0
          ).map(batch => (
            <div key={batch.id} className="pos-item" onClick={() => handleAddToCart(batch)}>
              <span>{batch.plant_name}</span>
              <span>{batch.selling_price} دج</span>
            </div>
          ))}
        </div>

        <div className="pos-cart">
          <h3>سلة المشتريات</h3>
          {cart.length === 0 ? (
            <p>السلة فارغة</p>
          ) : (
            <>
              {cart.map(item => (
                <div key={item.id} className="pos-cart-item">
                  <span>{item.plant_name} (x{item.quantity})</span>
                  <span>{(item.selling_price * item.quantity).toFixed(2)} دج</span>
                </div>
              ))}
              <hr />
              <div className="pos-total">
                <strong>الإجمالي:</strong>
                <span>{calculateTotal()} دج</span>
              </div>
              <button onClick={handleCheckout} className="checkout-button">إتمام البيع</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PosScreen;