// استيراد useState و useEffect من React
import { useState, useEffect } from 'react';
// استيراد axios للتواصل مع الخادم API
import axios from 'axios';

// مكون لوحة التحكم
function Dashboard() {
  // إدارة حالة كل مقياس
  const [metrics, setMetrics] = useState({
    totalSalesToday: 0,
    totalSalesWeek: 0,
    totalSalesMonth: 0,
    totalStockValue: 0,
  });
  const [topSellingPlants, setTopSellingPlants] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // جلب بيانات لوحة التحكم من الخادم عند تحميل المكون
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // في البداية، سنقوم بمحاكاة البيانات. لاحقاً، سنقوم ببناء واجهة برمجية حقيقية
        const mockMetrics = {
          totalSalesToday: 1250,
          totalSalesWeek: 8750,
          totalSalesMonth: 35500,
          totalStockValue: 52800,
        };
        const mockTopPlants = [
          { plant_name: 'فيكس بنجامينا', total_sold: 25 },
          { plant_name: 'صبار متنوع', total_sold: 18 },
          { plant_name: 'لوردرا كبيرة', total_sold: 12 },
          { plant_name: 'ليمون قزمي', total_sold: 10 },
          { plant_name: 'هندرا', total_sold: 8 },
        ];
        const mockRecentSales = [
          { plant_name: 'فيكس بنجامينا', quantity: 2, total_price: 90, date: '2024-01-30 10:30 AM' },
          { plant_name: 'صبار متنوع', quantity: 1, total_price: 40, date: '2024-01-30 09:15 AM' },
          { plant_name: 'لوردرا كبيرة', quantity: 1, total_price: 80, date: '2024-01-30 08:45 AM' },
        ];

        setMetrics(mockMetrics);
        setTopSellingPlants(mockTopPlants);
        setRecentSales(mockRecentSales);

      } catch (err) {
        setError('فشل في جلب بيانات لوحة التحكم');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // عرض رسالة تحميل أو خطأ
  if (loading) return <p>جاري تحميل لوحة التحكم...</p>;
  if (error) return <p>{error}</p>;

  // تصميم لوحة التحكم
  return (
    <div className="dashboard">
      <h2>لوحة التحكم</h2>
      
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>المبيعات اليوم</h3>
          <p className="metric-value">{metrics.totalSalesToday.toLocaleString()} دج</p>
        </div>
        <div className="metric-card">
          <h3>المبيعات هذا الأسبوع</h3>
          <p className="metric-value">{metrics.totalSalesWeek.toLocaleString()} دج</p>
        </div>
        <div className="metric-card">
          <h3>المبيعات هذا الشهر</h3>
          <p className="metric-value">{metrics.totalSalesMonth.toLocaleString()} دج</p>
        </div>
        <div className="metric-card">
          <h3>قيمة المخزون الحالي</h3>
          <p className="metric-value">{metrics.totalStockValue.toLocaleString()} دج</p>
        </div>
      </div>

      <div className="dashboard-charts">
        <div className="chart-container">
          <h3>أكثر النباتات مبيعاً</h3>
          <ul>
            {topSellingPlants.map((plant, index) => (
              <li key={index}>
                <span className="plant-name">{plant.plant_name}</span>
                <span className="plant-sold">({plant.total_sold} مبيعات)</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="chart-container">
          <h3>أحدث المبيعات</h3>
          <ul>
            {recentSales.map((sale, index) => (
              <li key={index}>
                <span>{sale.plant_name} (x{sale.quantity})</span>
                <span>{sale.total_price} دج</span>
                <span className="sale-date">{sale.date}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;