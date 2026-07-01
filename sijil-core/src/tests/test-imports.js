console.log('Testing imports...');
import('../services/validation/index.js')
  .then(module => {
    console.log('✅ Successfully imported validation/index.js!');
    console.log('Exports:', Object.keys(module));
  })
  .catch(err => {
    console.error('❌ Import error:', err);
  });
