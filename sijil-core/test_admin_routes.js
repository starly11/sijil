import express from 'express';
import adminRoutes from './src/routes/admin.routes.js';

const app = express();
app.use(express.json());
app.use('/admin', adminRoutes);

// Get all registered routes
const routes = [];
app._router.stack.forEach(r => {
  if (r.route) {
    routes.push({
      path: r.route.path,
      methods: Object.keys(r.route.methods).filter(k => r.route.methods[k])
    });
  }
});

console.log('Admin Routes Registered:');
console.log(JSON.stringify(routes, null, 2));
