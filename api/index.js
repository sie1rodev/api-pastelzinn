

const admin = require('firebase-admin');

const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

module.exports = async (req, res) => {
  // Sabores
  if (req.method === 'GET' && req.url === '/sabores') {
    const snapshot = await db.collection('sabores').get();
    const sabores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(sabores);
    return;
  }
  if (req.method === 'POST' && req.url === '/sabores') {
    const sabor = req.body;
    const docRef = await db.collection('sabores').add(sabor);
    const doc = await docRef.get();
    res.status(200).json({ id: doc.id, ...doc.data() });
    return;
  }
  if (req.method === 'DELETE' && req.url.startsWith('/sabores/')) {
    const id = req.url.split('/').pop();
    await db.collection('sabores').doc(id).delete();
    res.status(204).end();
    return;
  }
  // Pedidos
  if (req.method === 'GET' && req.url === '/pedidos') {
    const snapshot = await db.collection('pedidos').get();
    const pedidos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(pedidos);
    return;
  }
  if (req.method === 'POST' && req.url === '/pedidos') {
    const pedido = req.body;
    const docRef = await db.collection('pedidos').add(pedido);
    const doc = await docRef.get();
    res.status(200).json({ id: doc.id, ...doc.data() });
    return;
  }
  if (req.method === 'DELETE' && req.url === '/pedidos') {
    // Deleta todos os pedidos
    const snapshot = await db.collection('pedidos').get();
    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    res.status(204).end();
    return;
  }
  res.status(404).json({ error: 'Not found' });
};
