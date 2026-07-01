import('fs').then(async (fs) => {
  console.log('=== Checking file existence ===');
  const paths = [
    '/home/starly/Work/sijil/sijil-core/src/services/validation/index.js',
    '/home/starly/Work/sijil/sijil-core/src/schemas/documentIngest.schema.js',
    '/home/starly/Work/sijil/sijil-core/src/schemas/topicIngest.schema.js'
  ];
  
  for (const path of paths) {
    const exists = fs.existsSync(path);
    console.log(`${path} exists: ${exists}`);
  }
  
  console.log('\n=== Testing import ===');
  try {
    const module = await import('../services/validation/index.js');
    console.log('✅ Import success! validateQwenOutput is', typeof module.validateQwenOutput);
  } catch (err) {
    console.error('❌ Import failed:', err);
  }
});
