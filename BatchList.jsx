// استيراد useState و useEffect من React
import { useState, useEffect } from 'react';
// استيراد axios للتواصل مع الخادم API
import axios from 'axios';

// مكون لعرض قائمة الدفعات
function BatchList() {
  // إدارة حالة قائمة الدفعات
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // دالة لجلب قائمة الدفعات (لم تتغير)
  const fetchBatches = async () => {
    try {
        const response = await axios.get('http://localhost:3000/api/batches');
        setBatches(response.data);
    } catch (err) {
        setError('فشل في جلب قائمة الدفعات');
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  // جلب قائمة الدفعات من الخادم عند تحميل المكون
  useEffect(() => {
    fetchBatches();
  }, []);

  // === الدوال الجديدة للتحكم ===

  // دالة لبيع نبتة واحدة
  const handleSellOne = async (batchId, currentQuantity) => {
    const newQuantity = currentQuantity - 1;
    if (newQuantity < 0) {
      alert("الكمية لا يمكن أن تكون أقل من صفر!");
      return;
    }
    try {
      await axios.put(`http://localhost:3000/api/batches/${batchId}`, {
        current_quantity: newQuantity,
        status: 'available' // يمكن إضافة منطق لتغيير الحالة إذا وصلت للصفر
      });
      // قم بتحديث القائمة في الواجهة فوراً
      fetchBatches(); 
      alert('تم بيع نبتة بنجاح!');
    } catch (err) {
      alert('فشل في تحديث الكمية');
      console.error(err);
    }
  };

  // دالة لتسجيل خسارة نبتة واحدة
  const handleLossOne = async (batchId, currentQuantity) => {
    const newQuantity = currentQuantity - 1;
    if (newQuantity < 0) {
      alert("الكمية لا يمكن أن تكون أقل من صفر!");
      return;
    }
    try {
      await axios.put(`http://localhost:3000/api/batches/${batchId}`, {
        current_quantity: newQuantity,
        status: 'available'
      });
      // قم بتحديث القائمة في الواجهة فوراً
      fetchBatches();
      alert('تم تسجيل الخسارة بنجاح!');
    } catch (err) {
      alert('فشل في تسجيل الخسارة');
      console.error(err);
    }
  };


  // عرض رسالة تحميل أو خطأ
  if (loading) return <p>جاري تحميل المخزون...</p>;
  if (error) return <p>{error}</p>;

  // تصميم قائمة الدفعات مع الأزرار الجديدة
  return (
    <div className="batch-list">
      <h2>المخزون الحالي</h2>
      {batches.length === 0 ? (
        <p>لا توجد دفعات حالياً. قم بإنشاء دفعة جديدة!</p>
      ) : (
        <ul>
          {batches.map(batch => (
            <li key={batch.id} className="batch-item">
              <div className="batch-info">
                <strong>{batch.plant_name}</strong> - الكمية: {batch.current_quantity} - السعر: {batch.selling_price} دج
              </div>
              <div className="batch-actions">
                <button onClick={() => handleSellOne(batch.id, batch.current_quantity)} className="sell-button">بيع واحدة</button>
                <button onClick={() => handleLossOne(batch.id, batch.current_quantity)} className="loss-button">خسارة</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default BatchList;