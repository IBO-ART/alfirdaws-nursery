// استيراد المكتبات التي نحتاجها
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const QRCode = require('qrcode'); // <-- استيراد المكتبة الجديدة
require('dotenv').config();

// إنشاء تطبيق Express
const app = express();
const PORT = process.env.PORT || 3000;

// السماح للطلبات من مصادر أخرى (مثل تطبيق الواجهة الأمامية)
app.use(cors());
app.use(express.json()); // للسماح للخادم بقراءة بيانات JSON

// إعداد الاتصال بقاعدة البيانات
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'alfirdaws_nursery',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

// --- الواجهات البرمجية (Endpoints) ---

// 1. إنشاء نوع نبات جديد
app.post('/api/plant-types', async (req, res) => {
  const { name, scientific_name, category, default_price } = req.body;
  try {
    const newType = await pool.query(
      "INSERT INTO PlantTypes (name, scientific_name, category, default_price) VALUES($1, $2, $3, $4) RETURNING *",
      [name, scientific_name, category, default_price]
    );
    res.status(201).json(newType.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// 2. الحصول على كل أنواع النباتات
app.get('/api/plant-types', async (req, res) => {
  try {
    const allTypes = await pool.query("SELECT * FROM PlantTypes ORDER BY name ASC");
    res.json(allTypes.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// 3. إنشاء دفعة جديدة (محدث)
app.post('/api/batches', async (req, res) => {
  const { plant_type_id, batch_name, source, initial_quantity, cost_per_plant, selling_price } = req.body;
  try {
    // 1. إنشاء الدفعة في قاعدة البيانات أولاً
    const newBatchResult = await pool.query(
      "INSERT INTO Batches (plant_type_id, batch_name, source, initial_quantity, current_quantity, cost_per_plant, selling_price, date_received) VALUES($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE) RETURNING *",
      [plant_type_id, batch_name, source, initial_quantity, initial_quantity, cost_per_plant, selling_price]
    );

    const newBatch = newBatchResult.rows[0];
    const batchId = newBatch.id;

    // 2. إنشاء روابط رموز QR
const baseUrl = `${process.env.NEXT_PUBLIC_API_URL}/plant/${plant_type_id}`; // رابط صفحة القصة
    const qrCodes = [];

    // إنشاء رمز QR للدفعة
    const batchQrUrl = `${baseUrl}?batch=${batchId}`;
    const batchQrDataUrl = await QRCode.toDataURL(batchQrUrl);
    qrCodes.push({ type: 'batch', url: batchQrDataUrl });

    // إنشاء رموز QR فردية
    for (let i = 1; i <= initial_quantity; i++) {
      const individualQrUrl = `${baseUrl}?batch=${batchId}&plant=${i}`;
      const individualQrDataUrl = await QRCode.toDataURL(individualQrUrl);
      qrCodes.push({ type: 'individual', url: individualQrDataUrl });
    }

    // 3. إرسال الدفعة ورموز QR كرد
    res.status(201).json({ batch: newBatch, qrCodes: qrCodes });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// 4. الحصول على كل الدفعات
app.get('/api/batches', async (req, res) => {
  try {
    const allBatches = await pool.query(
      `SELECT b.id, b.batch_name, b.initial_quantity, b.current_quantity, b.selling_price, b.status, b.date_received, p.name as plant_name, p.category 
       FROM Batches b 
       JOIN PlantTypes p ON b.plant_type_id = p.id 
       ORDER BY b.date_received DESC`
    );
    res.json(allBatches.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// 5. الحصول على تفاصيل دفعة واحدة
app.get('/api/batches/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const batch = await pool.query(
      `SELECT b.*, p.name as plant_name, p.scientific_name, p.category 
       FROM Batches b 
       JOIN PlantTypes p ON b.plant_type_id = p.id 
       WHERE b.id = $1`,
      [id]
    );
    res.json(batch.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// 6. تحديث بيانات دفعة (مثل الكمية)
app.put('/api/batches/:id', async (req, res) => {
    const { id } = req.params;
    const { current_quantity, status } = req.body;
    try {
        const updatedBatch = await pool.query(
            "UPDATE Batches SET current_quantity = $1, status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *",
            [current_quantity, status, id]
        );
        res.json(updatedBatch.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

// 7. عرض صفحة ويب عامة لنبتة معينة بناءً على معرفها
app.get('/plant/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const plantResult = await pool.query(
      "SELECT name, scientific_name, category, story, image_url FROM PlantTypes WHERE id = $1",
      [id]
    );

    if (plantResult.rows.length === 0) {
      return res.status(404).send('<h1>النبتة غير موجودة</h1>');
    }

    const plant = plantResult.rows[0];

    const plantPageHTML = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${plant.name} - مشتلة الفردوس</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; background-color: #f8f6f3; color: #333; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: auto; background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 15px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        .hero-image { width: 100%; border-radius: 15px; height: 300px; object-fit: cover; background-color: #e0e0e0; }
        h1 { color: #28a745; text-align: center; }
        h2 { color: #555; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        .care-guide { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .care-item { background-color: #f0f9f0; padding: 15px; border-radius: 10px; text-align: center; }
        .pro-tip { background: linear-gradient(145deg, #e8f5e8, #f0fdf0); border-radius: 15px; padding: 20px; margin: 20px 0; text-align: center; }
        .footer { text-align: center; margin-top: 30px; font-size: 0.9rem; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <img src="${plant.image_url || 'https://via.placeholder.com/600x300.png?text=Beautiful+Plant'}" alt="${plant.name}" class="hero-image">
        <h1>مرحباً بك في عائلتك الجديدة</h1>
        <h2>${plant.name}</h2>
        <p><em>من مشتلة الفردوس</em></p>
        <div class="story-section">
            <h2>"حارس الذاكرة"</h2>
            <p>${plant.story || 'هذه النبتة لها قصة فريدة تجمع بين الجمال والطبيعة. بدأت كغصن صغير في دفء صوباتنا، تلقت العناية اليومية حتى أصبحت قوية وجاهزة لتكون جزءاً من منزلك وحياتك.'}</p>
        </div>
        <div class="care-guide">
            <div class="care-item">☀️ <strong>الإضاءة</strong><p>تحتاج لضوء ساطع غير مباشر. مكان قريب من نافذة مثالي.</p></div>
            <div class="care-item">💧 <strong>الري</strong><p>اسقِ التربة عندما تكون جافة للمس بعمق 2-3 سم. لا تترك الماء راكداً.</p></div>
            <div class="care-item">🌱 <strong>التسميد</strong><p>سمّده مرة كل شهر في فصل النمو بالسماد السائل.</p></div>
            <div class="care-item">🌡️ <strong>الحرارة</strong><p>يحب درجات الحرارة المعتدلة بين 18-24 درجة مئوية.</p></div>
        </div>
        <div class="pro-tip">
            <h3>🌿 تلميح من الفردوس</h3>
            <p>رش أوراق النبتة بالماء الرذاذ مرة في الأسبوع. هذا يحافظ على رطوبتها، يمنع ظهور حشرات المن، ويمنحها لمعاناً صحياً وجميلاً!</p>
        </div>
        <div class="footer">
            <p><strong>تابع رحلتك معنا</strong></p>
            <p>تابعنا على انستغرام <a href="#">@Alfirdaws_Nursery</a></p>
            <p>شاركنا صورة نبتتك <a href="#">#قصتي_من_الفردوس</a></p>
        </div>
    </div>
</body>
</html>
    `;
    res.send(plantPageHTML);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('<h1>خطأ في الخادم</h1>');
  }
});

// تشغيل الخادم
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});