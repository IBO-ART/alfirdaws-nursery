// استيراد useState و useEffect من React
import { useState, useEffect } from 'react';
// استيراد axios للتواصل مع الخادم API
import axios from 'axios';

// مكون النموذج لإنشاء دفعة جديدة
function CreateBatchForm() {
  // إدارة حالة كل حقل في النموذج
  const [formData, setFormData] = useState({
    plant_type_id: '',
    batch_name: '',
    source: 'مشتراة',
    initial_quantity: '',
    cost_per_plant: '',
    selling_price: '',
  });

  // إدارة حالة قائمة أنواع النباتات
  const [plantTypes, setPlantTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // جلب أنواع النباتات من الخادم عند تحميل المكون
  useEffect(() => {
    const fetchPlantTypes = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/plant-types');
        setPlantTypes(response.data);
      } catch (err) {
        setError('فشل في جلب أنواع النباتات');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlantTypes();
  }, []); // المصفوفة الفارغة تعني أن هذا التأثير يعمل مرة واحدة فقط عند التحميل

  // دالة لتحديث حالة النموذج عند كتابة أي شيء
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  // دالة لإرسال البيانات عند الضغط على زر "حفظ"
  const handleSubmit = async (e) => {
    e.preventDefault(); // منع إعادة تحميل الصفحة
    try {
      const response = await axios.post('http://localhost:3000/api/batches', formData);
      
      // البيانات الجديدة تحتوي على batch و qrCodes
      const { batch, qrCodes } = response.data;
      
      alert(`تم إنشاء الدفعة ${batch.id} بنجاح! جاري فتح نافذة الطباعة...`);
      console.log('Batch created:', batch);
      console.log('QR Codes generated:', qrCodes);

      // استدعاء دالة الطباعة
      handlePrintQRCodes(qrCodes);

    } catch (err) {
      alert('فشل في إنشاء الدفعة');
      console.error(err);
    }
  };

  // دالة لفتح نافذة الطباعة (مبسطة ومستقرة)
  const handlePrintQRCodes = (qrCodes) => {
    // إنشاء محتوى HTML للطباعة
    const printContent = `
      <html dir="rtl">
        <head>
          <title>طباعة رموز QR - مشتلة الفردوس</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; }
            .qr-label { border: 1px solid #ccc; margin: 10px; padding: 10px; display: inline-block; width: 150px; }
            .qr-label img { width: 100px; height: 100px; }
            .qr-label p { margin: 5px 0; font-size: 12px; }
            @media print {
              .qr-label { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <h1>رموز QR للدفعة</h1>
          ${qrCodes.map((qr, index) => `
            <div class="qr-label">
              <img src="${qr.url}" alt="QR Code" />
              <p>${qr.type === 'batch' ? 'رمز الدفعة' : `نبتة رقم ${index + 1}`}</p>
            </div>
          `).join('')}
        </body>
      </html>
    `;

    // فتح نافذة جديدة وكتابة المحتوى
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close(); // إغلاق الكتابة
    printWindow.focus(); // التركيز على النافذة الجديدة
    // الانتظار قليلاً ثم الطباعة
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  // عرض رسالة تحميل أو خطأ
  if (loading) return <p>جاري التحميل...</p>;
  if (error) return <p>{error}</p>;

  // تصميم النموذج
  return (
    <form onSubmit={handleSubmit} className="batch-form">
      <h2>إنشاء دفعة جديدة</h2>

      <label>اختر نوع النبات</label>
      <select name="plant_type_id" value={formData.plant_type_id} onChange={handleChange} required>
        <option value="">-- اختر --</option>
        {plantTypes.map(type => (
          <option key={type.id} value={type.id}>{type.name}</option>
        ))}
      </select>

      <label>اسم الدفعة (اختياري)</label>
      <input type="text" name="batch_name" value={formData.batch_name} onChange={handleChange} placeholder="مثال: دفعة فيكس الشتوية" />

      <label>المصدر</label>
      <select name="source" value={formData.source} onChange={handleChange}>
        <option value="مشتراة">مشتراة</option>
        <option value="منتجة داخلياً">منتجة داخلياً</option>
      </select>

      <label>الكمية</label>
      <input type="number" name="initial_quantity" value={formData.initial_quantity} onChange={handleChange} required />

      <label>تكلفة النبتة الواحدة (دج)</label>
      <input type="number" name="cost_per_plant" value={formData.cost_per_plant} onChange={handleChange} step="0.01" required />

      <label>سعر البيع المقترح (دج)</label>
      <input type="number" name="selling_price" value={formData.selling_price} onChange={handleChange} step="0.01" required />

      <button type="submit" className="submit-button">حفظ الدفعة وإنشاء الرموز</button>
    </form>
  );
}

export default CreateBatchForm;